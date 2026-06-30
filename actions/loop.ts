"use server";

import prisma from "@/lib/db";
import { backupToS3, restoreIntoSandbox } from "@/lib/s3";
import { bootstrapProject, createSandbox } from "@/lib/sandbox";
import { StreamEvent } from "@/types/stream";
import { CODING_AGENT_SYSTEM_PROMPT } from "@/utils/prompts/systemPrompt";
// import { createStreamableValue } from "@ai-sdk/rsc";
import { Content } from "@google/genai";
import Sandbox from "@e2b/code-interpreter";
import { createAiStream } from "./gemini";
import { executeTool } from "@/utils/tools";

const PROJECT_DIR = "/home/user/LovableProject";
const sandboxCache = new Map<string, Sandbox>();

// The core agent loop - can be imported and awaited directly (e.g. from test scripts)
export const runAgentLoop = async (projectId: string, userMessage: string) => {
  let sandbox: Sandbox | null = null;

  try {
    // load project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      console.error("Project not found");
      return;
    }

    // load context history
    let history: Content[] = [];
    if (project.context) {
      history = project.context as Content[];
    } else {
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

    // check if cached sandbox is alive
    let isSandboxAlive = false;
    if (sandboxCache.has(projectId)) {
      const cachedSandbox = sandboxCache.get(projectId)!;
      if (await cachedSandbox.isRunning()) {
        sandbox = cachedSandbox;
        isSandboxAlive = true;
        console.log("[Sandbox]: Reusing existing sandbox from cache.");
        // stream.update({
        //   type: "text-delta",
        //   content: "\n[Sandbox restored from cache]\n",
        // });
      } else {
        console.log("[Sandbox]: Cached sandbox is dead, creating a new one.");
        sandboxCache.delete(projectId);
      }
    }

    // create a new sandbox if no alive cached sandbox exists
    if (!isSandboxAlive) {
      console.log("[Sandbox]: Creating new sandbox...");
      sandbox = await createSandbox();
      sandboxCache.set(projectId, sandbox);

      // Ensure the project directory exists
      try {
        await sandbox.commands.run(`mkdir -p ${PROJECT_DIR}`);
      } catch (err) {
        console.error("Failed to create project directory:", err);
      }

      // restore from backup if it exists
      if (project.s3BackupKey) {
        try {
          const restored = await restoreIntoSandbox(sandbox, projectId);
          if (restored) {
            console.log("[Sandbox]: Restored from S3 backup. Bootstrapping...");
            // stream.update({ type: "restored-from-backup" });
            const previewUrl = await bootstrapProject(sandbox);
            if (previewUrl) {
              console.log(`[Preview URL]: ${previewUrl}`);
              // stream.update({ type: "preview-url", url: previewUrl });
            }
          }
        } catch (error) {
          console.error("Failed to restore code:", error);
        }
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
      const functionCalls: { name: string; args: Record<string, unknown> }[] = [];

      for await (const chunk of streamResponse) {
        const candidate = chunk.candidates?.[0];
        if (!candidate?.content?.parts) continue;

        for (const part of candidate.content.parts) {
          if (part.text) {
            fullText += part.text;
            // stream.update({ type: "text-delta", content: part.text });
          }
          if (part.functionCall) {
            functionCalls.push({
              name: part.functionCall.name!,
              args: part.functionCall.args as Record<string, unknown>,
            });
          }
        }
      }

      if (functionCalls.length > 0) {
        history.push({
          role: "model",
          parts: functionCalls.map((fc) => ({
            functionCall: { name: fc.name, args: fc.args },
          })),
        });

        const functionResponse = [];

        for (const fc of functionCalls) {
          // Log meaningful info per tool
          switch (fc.name) {
            case "writeFile":
              console.log(`[writeFile]: ${fc.args.path}`);
              break;
            case "updateFile":
              console.log(`[updateFile]: ${fc.args.path} (lines ${fc.args.startLine}-${fc.args.endLine})`);
              break;
            case "readFile":
              console.log(`[readFile]: ${fc.args.path}`);
              break;
            case "deleteFile":
              console.log(`[deleteFile]: ${fc.args.path}`);
              break;
            case "listFiles":
              console.log(`[listFiles]: ${fc.args.path}`);
              break;
            case "runCommand":
              console.log(`[runCommand]: ${fc.args.command}`);
              break;
            default:
              console.log(`[Tool Call]: ${fc.name}`);
          }
          const result = await executeTool(
            sandbox!,
            fc.name,
            fc.args,
            // stream,
          );
          console.log(`[Tool Result]: ${fc.name} done`);

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
          // Print the final agent response
          console.log(`\n[Agent]: ${fullText}`);
        }
        keepGoing = false;
      }
    }

    if (loopCount >= MAX_LOOPS) {
      console.error("[Error]: Max iterations reached");
      // stream.update({ type: "error", content: "Max iterations reached" });
    }

    // fallback: print the preview url
    try {
      const host = sandbox!.getHost(3000);
      console.log(`[Preview URL]: https://${host}`);
      // stream.update({ type: "preview-url", url: `https://${host}` });
    } catch (err) {
      console.error("Could not get preview URL");
      // stream.update({
      //   type: "error",
      //   content: "Could not generate preview url",
      // });
    }

    // save context back to db
    await prisma.project.update({
      where: { id: projectId },
      data: { context: history as any },
    });

    // backup to s3
    try {
      const version = await backupToS3(sandbox!, projectId);
      await prisma.project.update({
        where: { id: projectId },
        data: {
          s3BackupKey: `projects/${projectId}/v${version}.tar.gz`,
          lastBackupAt: new Date(),
        },
      });
      console.log(`[Backup]: Complete (v${version})`);
      // stream.update({ type: "backup-complete", version });
    } catch (err) {
      console.error("[Backup] Failed: ", err);
    }

    // stream.update({ type: "done" });
  } catch (error: any) {
    console.error("[Loop] Fatal: ", error);
    // stream.update({
    //   type: "error",
    //   content: error.message || "Unexpected error",
    // });
  } finally {
    // stream.done();
  }
};

// RSC wrapper - used by the Next.js frontend
export const getAiResponse = async (projectId: string, userMessage: string) => {
  // const stream = createStreamableValue<StreamEvent>();
  // (async () => { ... stream.update / stream.done ... })();
  // return stream.value;

  // Temporarily just calls runAgentLoop directly (no streaming to frontend)
  await runAgentLoop(projectId, userMessage);
};
