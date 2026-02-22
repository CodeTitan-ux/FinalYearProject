
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY missing");
}

const genAI = new GoogleGenerativeAI(apiKey);

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-1.5-flash";

interface GenerateOptions {
  prompt: string;
  maxRetries?: number;
}

export const generateAiContent = async ({ prompt, maxRetries = 3 }: GenerateOptions): Promise<string> => {
  let currentModelName = PRIMARY_MODEL;
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const model = genAI.getGenerativeModel({ model: currentModelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      attempts++;
      console.warn(`Attempt ${attempts} failed with model ${currentModelName}:`, error.message);

      // Check for 404 or specific model errors to switch fallback
      if (error.message.includes("404") || error.message.includes("not found")) {
        console.warn(`Model ${currentModelName} not found. Switching to fallback: ${FALLBACK_MODEL}`);
        currentModelName = FALLBACK_MODEL;
      }
      
      if (attempts >= maxRetries) {
        throw new Error(`Failed to generate content after ${maxRetries} attempts. Last error: ${error.message}`);
      }

      // Exponential backoff: 1s, 2s, 4s...
      const delay = Math.pow(2, attempts) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Unexpected error in generation loop");
};
