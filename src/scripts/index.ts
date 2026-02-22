import {
  GoogleGenerativeAI,
} from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY missing");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

/*
  startChat is good for maintaining history like a chat bot
  but for independent requests like generating interview questions or grading,
  using model.generateContent() is better to avoid history pollution.
*/
export const chatSession = model.startChat({
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: 8192,
  },
});
