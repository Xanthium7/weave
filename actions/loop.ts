import prisma from "@/lib/db";
import { backupToS3, restoreIntoSandbox } from "@/lib/s3";
import { bootstrapProject, createSandbox } from "@/lib/sandbox";
import { StreamEvent } from "@/types/stream";
import { CODING_AGENT_SYSTEM_PROMPT } from "@/utils/prompts/systemPrompt";
import { createStreamableValue } from "@ai-sdk/rsc";
import { Content } from "@google/genai";
import Sandbox from "@e2b/code-interpreter";
import { createAiStream } from "./gemini";
import { executeTool } from "@/utils/tools";

const PROJECT_DIR = "/home/user/LovableProject";

export const getAiResponse = async (projectId: string, userMessage: string) => {
  const stream = createStreamableValue<StreamEvent>();

  (async () => {
    let sandbox: Sandbox | null = null;

    try {
      // load projecct
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        stream.update({ type: "error", content: "Project not found" });
        stream.done();
        return;
      }

      // load context history
      let history: Content[] = [];
      if (project.context) {
        history = project.context as Content[];
      } else {
        // or cook up a new history
        history = [
          {
            role: "user",
            parts: [{ text: CODING_AGENT_SYSTEM_PROMPT }],
          },
          {
            role: "model",
            parts: [
              {
                text: "Understood. I will use the provided tools to build your project inside the sandbox.",
              },
            ],
          },
        ];
      }

      // create a new sandbox
      sandbox = await createSandbox();

      // backup the code if it exists
      if (project.s3BackupKey) {
        try {
          const restored = await restoreIntoSandbox(sandbox, projectId);
          if (restored) {
            stream.update({ type: "restored-from-backup" });
            const previewUrl = await bootstrapProject(sandbox);
            if (previewUrl) {
              stream.update({ type: "preview-url", url: previewUrl });
            }
          }
        } catch (error) {
          console.error("Failed to restore code:", error);
        }
      }

      history.push({
        role: "user",
        parts: [{ text: userMessage }],
      });

      //------------------------- the main agent loop -------------------------
      let keepGoing = true;
      let loopCount = 0;
      const MAX_LOOPS = 50;

      while (keepGoing && loopCount < MAX_LOOPS) {
        loopCount++;

        const streamResponse = await createAiStream(history);
        let fullText = "";
        const functionCalls = [];

        for await (const chunk of streamResponse) {
          const candidate = chunk.candidates?.[0];
          if (!candidate?.content?.parts) continue;

          for (const part of candidate.content.parts) {
            if (part.text) {
              fullText += part.text;
              stream.update({ type: "text-delta", content: part.text });
            }
            if (part.functionCall) {
              functionCalls.push({
                name: part.functionCall.name!,
                args: part.functionCall.args as Record<string, unknown>,
              });
            }
          }
        }

        // now execute all the tools in the fucntionCalls[]

        if (functionCalls.length > 0) {
          history.push({
            role: "model",
            parts: functionCalls.map((fc) => ({
              functionCall: { name: fc.name, args: fc.args },
            })),
          });

          const functionResponse = [];

          for (const fc of functionCalls) {
            stream.update({ type: "tool-call", tool: fc.name, args: fc.args });
            const result = await executeTool(
              sandbox!,
              fc.name,
              fc.args,
              stream,
            );
            stream.update({ type: "tool-result", tool: fc.name, result });

            functionResponse.push({
              functionResponse: {
                name: fc.name,
                response: { output: JSON.stringify(result) },
              },
            });
          }

          history.push({ role: "model", parts: functionResponse });
        } else {
          if (fullText) {
            history.push({ role: "model", parts: [{ text: fullText }] });
            stream.update({ type: "text-complete", content: fullText });
          }
          keepGoing = false;
        }
      }

      if (loopCount >= MAX_LOOPS) {
        stream.update({ type: "error", content: "Max iterations reached" });
      }

      // fallback incase llm forgets to send preview
      try {
        const host = sandbox!.getHost(3000);
        stream.update({ type: "preview-url", url: `https://${host}` });
      } catch (err) {
        stream.update({
          type: "error",
          content: "Could not generate preview url",
        });
      }

      // after every complete cycle we update the context in the db
      await prisma.project.update({
        where: { id: projectId },
        data: { context: history as any },
      });

      // also after that we have to backup to s3 as well
      try {
        const version = await backupToS3(sandbox!, projectId);
        await prisma.project.update({
          where: { id: projectId },
          data: {
            s3BackupKey: `projects/${projectId}/v${version}.tar.gz`,
            lastBackupAt: new Date(),
          },
        });
        stream.update({ type: "backup-complete", version})
      } catch (err) {
        console.error("[Backup] Failed: ", err)
      }

      stream.update({type: "done"})
    } catch (error: any) {
        console.error("[Loop] Fatal: ", error)
        stream.update({type: "error", content: error.message || "Unexpected error" })
    } finally {
      stream.done();
    }
  })();

  return stream.value;
};
