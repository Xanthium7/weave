
import { GoogleGenAI, Content } from "@google/genai";
import { toolsConfig } from "@/utils/tools";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });
const models = {
  m1: "gemini-2.5-flash",
  m2: "gemini-2.5-pro",
  m3: "gemini-3.1-flash-lite",
};
export async function createAiStream(history: Content[]) {
  return await ai.models.generateContentStream({
    model: models.m3,
    contents: history,
    config: {
      tools: toolsConfig,
    },
  });
}