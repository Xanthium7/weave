
import { GoogleGenAI, Content } from "@google/genai";
import { toolsConfig } from "@/utils/tools";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });
const MODEL = "gemini-2.5-flash";


export async function createAiStream(history: Content[]) {
  return await ai.models.generateContentStream({
    model: MODEL,
    contents: history,
    config: {
      tools: toolsConfig,
    },
  });
}