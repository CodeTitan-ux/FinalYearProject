import * as functionsV1 from "firebase-functions/v1";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { Webhook } from "svix";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

const pdfParse = require("pdf-parse");

admin.initializeApp();

const db = admin.firestore();

export const userDeleted = functionsV1.https.onRequest(async (req, res) => {
  const SIGNATURE_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNATURE_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  // Verify the webhook signature
  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    res.status(400).json({ error: "Missing svix headers" });
    return;
  }

  const wh = new Webhook(SIGNATURE_SECRET);
  let evt: any;

  try {
    evt = wh.verify(req.rawBody.toString(), {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    res.status(400).json({ error: "Error verifying webhook" });
    return;
  }

  const eventType = evt.type;

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (!id) {
      console.error("No user ID found in webhook data");
      res.status(400).json({ error: "No user ID found" });
      return;
    }

    console.log(`Processing deletion for user: ${id}`);

    try {
      const batch = db.batch();

      // 1. Delete Interviews
      const interviewsQuery = await db
        .collection("users")
        .doc(id)
        .collection("interviews")
        .get();
      console.log(`Found ${interviewsQuery.size} interviews to delete.`);
      interviewsQuery.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 2. Delete User Answers
      const answersQuery = await db
        .collection("users")
        .doc(id)
        .collection("userAnswers")
        .get();
      console.log(`Found ${answersQuery.size} answers to delete.`);
      answersQuery.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 3. Delete User Profile document
      const userDoc = db.collection("users").doc(id);
      batch.delete(userDoc);

      // Commit the batch
      await batch.commit();

      console.log(`Successfully deleted data for user ${id}`);
      res.status(200).json({ message: "User data deleted successfully" });
    } catch (error) {
      console.error("Error deleting user data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    // Handle other event types or ignore
    res.status(200).json({ message: "Event type not handled" });
  }
});

export const processResumeV2 = onCall(
  { timeoutSeconds: 120, memory: "512MiB", cors: true },
  async (request) => {
    const { fileData, userId } = request.data;
    console.log(`[processResume] Call received for userId: ${userId}`);

    if (!userId) {
      throw new HttpsError(
        "unauthenticated",
        "User ID is required to process resume."
      );
    }

    if (!fileData) {
      throw new HttpsError(
        "invalid-argument",
        "No file data provided."
      );
    }

    try {
      // 1. Decode base64 to buffer
      const buffer = Buffer.from(fileData, "base64");

      // 2. Parse PDF
      console.log("[processResumeV2] Parsing PDF...");
      const pdfData = await pdfParse(buffer);
      const text = pdfData.text;

      if (!text || text.trim().length === 0) {
        throw new HttpsError(
          "invalid-argument",
          "Could not extract text from PDF."
        );
      }

      // 3. Process with Gemini
      const apiKey = process.env.VITE_GEMINI_API_KEY || (request as any).params?.GEMINI_API_KEY; 
      
      if (!apiKey) {
        console.error("[processResume] Gemini API key missing from env.");
        throw new HttpsError(
          "internal",
          "Gemini API key not configured on server."
        );
      }

      console.log("[processResume] Calling Gemini API...");
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
      Analyze the following document text and determine if it is a verifiable personal resume or curriculum vitae of an individual person.
      CRITICAL: You MUST aggressively reject the following:
      - Academic syllabuses, university course outlines, or curriculum documents.
      - Blank pages, random notes, or assignments.
      - Any document that does not clearly describe an individual's work experience, personal skills, and background.
      
      You MUST return ONLY a valid JSON object. No explanation, no markdown formatting.

      The JSON object MUST match the following TypeScript interface strictly:

      interface ValidationResult {
        isValidResume: boolean;
        reasonForRejection: string | null; // Provide a brief reason if isValidResume is false
        profile: {
          skills: string[];
          yearsExperience: number;
          roles: string[];
          companies: string[];
          projects: {
            name: string;
            description: string;
            techStack: string[];
          }[];
          education: string[];
          atsScore: number; // Calculate an ATS-style score out of 100 based on structure, clarity, and impact
          atsRationale: string; // A 1-sentence brief rationale for the ATS Score
        } | null; // Provide profile ONLY if isValidResume is true
      }

      Document Text:
      """
      ${text.substring(0, 15000)}
      """
    `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const jsonStart = responseText.indexOf("{");
      const jsonEnd = responseText.lastIndexOf("}");

      if (jsonStart === -1 || jsonEnd === -1) {
        console.error("[processResume] Failed to parse AI response:", responseText);
        throw new HttpsError(
          "internal",
          "Failed to parse AI response into JSON."
        );
      }

      const cleanJson = responseText.substring(jsonStart, jsonEnd + 1);
      const validationData = JSON.parse(cleanJson);

      if (!validationData.isValidResume) {
         console.warn("[processResume] Validation Failed:", validationData.reasonForRejection);
         throw new HttpsError(
            "invalid-argument",
            validationData.reasonForRejection || "The uploaded document does not appear to be a valid resume."
         );
      }

      console.log("[processResume] Success!");
      return validationData.profile;
    } catch (error: any) {
      console.error("[processResume] Error:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError(
        "internal",
        error.message || "An error occurred while processing the resume."
      );
    }
  }
);
