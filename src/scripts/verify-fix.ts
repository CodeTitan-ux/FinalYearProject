
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// Manually load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY missing");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function verifyFix() {
  console.log("Verifying fix with model: gemini-2.5-flash");
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Generate 5 technical interview questions for a Senior React Developer.
    Return ONLY a raw JSON array.
    Each object must have "question" and "answer".
    Keep answers concise but informative (max 3-4 sentences).
  `;

  console.log("Starting generation...");
  const start = Date.now();
  try {
    const result = await model.generateContent(prompt);
    const end = Date.now();
    const duration = (end - start) / 1000;
    
    console.log(`Generation complete!`);
    console.log(`Time taken: ${duration}s`);
    
    // Validate JSON structure briefly
    const text = result.response.text();
    if (text.includes("[") && text.includes("]")) {
        console.log("Output looks like JSON array.");
    } else {
        console.warn("Output might not be JSON array.");
    }

    if (duration <= 15) {
        console.log("PASS: Generation time is within the 10-15s limit.");
    } else {
        console.log("WARN: Generation time is still over 15s.");
    }
    
  } catch (error: any) {
    console.error("Error during generation:", error.message);
  }
}

verifyFix();
