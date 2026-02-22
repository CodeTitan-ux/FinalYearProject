import { Timestamp, FieldValue } from "firebase/firestore";

export interface ResumeProfile {
  skills: string[];
  yearsExperience?: number;
  roles: string[];
  companies: string[];
  projects: {
    name: string;
    description: string;
    techStack: string[];
  }[];
  education: string[];
  rawText?: string;
  atsScore?: number;
  atsRationale?: string;
}

export interface Interview {
  id: string;
  position: string;
  description: string;
  experience: number | string;
  techStack: string;
  questions: { question: string; answer: string }[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  userId: string;
  interviewerStyle?: string;
  resumeProfile?: ResumeProfile;
}

export interface UserAnswer {
  id: string;
  mockIdRef: string;
  question: string;
  correct_ans: string;
  user_ans: string;
  feedback: string;
  rating: number;
  userId: string;
  createdAt: Timestamp;
  confidenceScore?: {
    overall: number;
    textScore: number;
    speechScore: number;
    webcamScore: number;
  };
  updatedAt?: Timestamp;
}

export interface User {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
  role?: "user" | "admin";
  createdAt: Timestamp | FieldValue;
  updateAt: Timestamp | FieldValue;
}

export interface InterviewSession {
  id: string;
  mockIdRef: string;
  userId: string;
  status: "active" | "completed";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  questions: { question: string; answer: string }[];
  answers: UserAnswer[];
  score: number;
  feedback: string;
  position: string; // duplicate for easier display
  experience: number | string; // duplicate for easier display
  description: string;
  techStack: string;
  resumeProfile?: ResumeProfile;
}
