
import { bashToolSchema, readFileSchema, writeFileSchema } from "@/utils/dummy/tools";
import { CODING_AGENT_SYSTEM_PROMPT } from "@/utils/prompts/systemPrompt";
import { GoogleGenAI } from "@google/genai";
import { Content } from "@google/genai";

const ai = new GoogleGenAI({apiKey: process.env.GOOGLE_API_KEY});
// console.log(process.env.GOOGLE_API_KEY)
export let memory = { value: [{role: "system", parts: [{text: CODING_AGENT_SYSTEM_PROMPT}]}] as Content[] };

export const AiResponse = async () => {
  const response = await ai.models.generateContent({
    model: "	gemini-3.1-flash-lite",
    contents: memory.value,
    config: {
        tools: [
            {
                functionDeclarations:[
                    // declarations
                    bashToolSchema,
                    readFileSchema,
                    writeFileSchema
                ]
            }
        ]
    }
  });
  return response;
};
