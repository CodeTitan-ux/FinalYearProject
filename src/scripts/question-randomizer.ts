import { db } from "@/config/firebase.config";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

interface Question {
    question: string;
    answer: string;
}

export class QuestionRandomizer {
    private static TOPICS = [
        "Data Structures", "Algorithms", "System Design", "Database Optimization",
        "Security", "Performance", "Testing", "clean Code", "Scalability",
        "Microservices", "API Design", "Authentication", "State Management",
        "Cloud Computing", "CI/CD", "Debugging", "Networking", "Concurrency"
    ];

    /**
     * Fetches the last 3 interviews for the user to analyze recent questions.
     */
    static async getPreviousQuestions(userId: string): Promise<string[]> {
        if (!userId) return [];

        try {
            const q = query(
                collection(db, "users", userId, "interviews"),
                orderBy("createdAt", "desc"),
                limit(3)
            );

            const querySnapshot = await getDocs(q);
            const questions: string[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.questions && Array.isArray(data.questions)) {
                    data.questions.forEach((q: Question) => {
                         questions.push(q.question);
                    });
                }
            });

            return questions;
        } catch (error) {
            console.error("Error fetching previous questions:", error);
            return [];
        }
    }

    /**
     * Selects focus areas using a weighted random selection algorithm.
     * Topics referenced in previous questions get lower weights.
     */
    static selectFocusAreas(previousQuestions: string[], count: number = 3): string[] {
        const weights: Record<string, number> = {};
        
        // Initialize weights
        this.TOPICS.forEach(topic => weights[topic] = 10); // Base weight

        // Down-rank topics found in previous questions
        previousQuestions.forEach(q => {
            const lowerQ = q.toLowerCase();
            this.TOPICS.forEach(topic => {
                if (lowerQ.includes(topic.toLowerCase())) {
                    weights[topic] = Math.max(1, weights[topic] - 3); // Decrease weight
                }
            });
        });

        // Weighted Random Selection
        const selectedTopics: Set<string> = new Set();
        const topicList = Object.keys(weights);

        while (selectedTopics.size < count) {
            const totalWeight = topicList.reduce((sum, topic) => sum + (selectedTopics.has(topic) ? 0 : weights[topic]), 0);
            let random = Math.random() * totalWeight;
            
            for (const topic of topicList) {
                if (selectedTopics.has(topic)) continue;

                random -= weights[topic];
                if (random <= 0) {
                    selectedTopics.add(topic);
                    break;
                }
            }
        }

        return Array.from(selectedTopics);
    }
}
