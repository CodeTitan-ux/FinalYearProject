# AI-Powered Mock Interview Platform

## 📌 Project Overview

The **AI-Powered Mock Interview Platform** is a comprehensive, full-stack web application designed to simulate real-world technical and HR interviews. Built as a Final Year Information Technology (BE-IT) Engineering project, this platform leverages the capabilities of modern Generative AI to provide dynamic, role-specific interview questions, real-time evaluation, and actionable feedback.

Our mission is to bridge the gap between academic preparation and industry expectations by offering students and job seekers a highly accessible, intelligent, and scalable tool for interview practice.

## 🚀 Technical Scope

This project demonstrates a robust, modern technology stack and sophisticated cloud-based architecture:

- **Frontend Core:** React.js (v18), TypeScript, Vite
- **UI & Styling:** Tailwind CSS, Radix UI Primitives, Lucide Icons
- **Backend & Database:** Firebase Firestore (NoSQL), Firebase Cloud Functions
- **Authentication & Security:** Clerk Auth (with Webhook synchronization for strict data isolation)
- **Artificial Intelligence Engine:** Google Generative AI (Gemini Pro API)
- **Media & Processing:** Browser Web Speech API (Speech-to-Text, Multilingual Text-to-Speech), React Webcam

## 💡 Key Features

- **Dynamic Question Generation:** Utilizes Gemini AI to generate tailored questions based on job role, tech stack, and experience level.
- **Multilingual Support:** Localized Text-to-Speech capabilities enable interviews in English, Hindi, and Marathi, catering to diverse linguistic backgrounds.
- **Cheating Detection System:** Employs a robust client-wide "10-Strike Rule" engine that tracks window switching and suspicious activities, ensuring platform integrity and simulating remote proctoring.
- **Real-Time Evaluation:** An AI-driven feedback mechanism evaluates candidate responses, grades answers, and provides clear improvement suggestions.
- **Admin Analytics Dashboard:** Comprehensive analytics for administrators to track usage metrics, system performance, API calls, and user statistics.
- **Customizable Interviewer Personas:** Configurable interviewer styles ranging from strict technical focus to conversational HR formats.
- **Question Randomization Engine:** Advanced topic weighting algorithm designed to prevent repeated questions and ensure fair distribution over multiple sessions.
- **Strict Data Isolation:** Engineered with secure Firebase rules and nested schema designs synced via Clerk Webhooks to ensure user data remains completely private.

## 🎓 Academic & Industry Relevance

**Academic Value:**

- Serves as a practical implementation of advanced web development paradigms, including strict typing, custom React hooks, state management, and Cloud Function webhooks.
- Demonstrates applied Artificial Intelligence by shifting from basic CRUD applications to deeply integrated, logic-driven AI systems.
- Emphasizes security-first development practices via strict database isolation and robust webhook synchronization.

**Industry Relevance:**

- **Solving a Real Problem:** Technical interviewing remains a high-anxiety bottleneck for early-career professionals. This tool provides a scalable, low-cost preparation environment that closely mirrors actual assessments.
- **Modern Architecture:** The microservice-aligned architecture (delegating Auth to Clerk, Database to Firebase, and Logic to API integrations) perfectly mimics current industry standards for building scalable SaaS products.
- **Accessibility & Ethics:** The inclusion of multilingual support and anti-cheat tracking highlights a focus on both user accessibility and evaluative integrity—key factors in modern HR tech.

---

_Developed as a Final Year Project for Bachelor of Engineering in Information Technology (BE-IT)._
