"use server";

import { AiResponse, memory } from "./gemini";
import { bashTool, readFile, writeFile } from "@/utils/dummy/tools";
import { createStreamableValue } from "@ai-sdk/rsc";

interface StreamPayload {
  type: string;
  response: string;
}

export const getAiResponse = async (initalPrompt: string) => {
  const stream = createStreamableValue<StreamPayload>({
    type: "",
    response: "",
  });

  (async () => {
    let keepGoing = true;

    memory.value.push({
      role: "user",
      parts: [{ text: initalPrompt }],
    });

    while (keepGoing) {
      console.log("Thinking...");
      const response = await AiResponse();
      const candidate = response?.candidates?.[0];
      if (!candidate || !candidate.content) {
        console.log("No response from AI");
        stream.update({
          type: "error",
          response: "Error: No response from AI",
        });
        break;
      }

      memory.value.push(candidate.content);

      if (response.functionCalls && response.functionCalls.length > 0) {
        const functionCall = response.functionCalls[0];

        if (functionCall.name === "run_bash_command") {
          const command = functionCall?.args?.command;
          console.log("Agent wants to run command: ", command);
          stream.update({
            type: "toolCall",
            response: command as string,
          });
          const toolResult = bashTool(command as string);

          memory.value.push({
            role: "user",
            parts: [
              {
                functionResponse: {
                  name: functionCall.name,
                  response: {
                    output: toolResult.content,
                  },
                },
              },
            ],
          });
        } else if (functionCall.name === "read_file") {
          const path = functionCall?.args?.path;
          console.log("Agent wants to read file: ", path);
          stream.update({
            type: "toolCall",
            response: `Reading: ${path}`,
          });
          const toolResult = readFile(path as string);

          memory.value.push({
            role: "user",
            parts: [
              {
                functionResponse: {
                  name: functionCall.name,
                  response: {
                    output: toolResult,
                  },
                },
              },
            ],
          });
        } else if (functionCall.name === "write_file") {
          const path = functionCall?.args?.path;
          const fileContents = functionCall?.args?.fileContents;
          console.log("Agent wants to write file: ", path);
          const toolResult = writeFile(path as string, fileContents as string);

          memory.value.push({
            role: "user",
            parts: [
              {
                functionResponse: {
                  name: functionCall.name,
                  response: {
                    output: toolResult,
                  },
                },
              },
            ],
          });
        }
      } else {
        const text = candidate?.content?.parts?.[0]?.text;
        if (text) {
          console.log(text);
          stream.update({
            type: "message",
            response: text,
          });
        }
        keepGoing = false;
      }
    }
    stream.done();
  })();

  return stream.value;
};
