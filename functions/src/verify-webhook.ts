import * as admin from "firebase-admin";
import { Webhook } from "svix";

// Mock environment variables
// Use a valid base64 usage. Svix secrets are usually whsec_ + base64. 
// Let's just try a valid base64 string, or prefix it if svix library requires it.
// Actually, standard Svix secrets start with whsec_ and the rest is base64.
// Let's try a simple valid base64.
process.env.CLERK_WEBHOOK_SECRET = "whsec_Cj9wG3/8l5/8l5/8l5/8l5/8l5/8l5/8l5/8l5/8l58=";

// Initialize admin (will use default credentials if available, or fail if not)
try {
    admin.initializeApp();
} catch (e) {
    console.log("Admin already initialized or failed:", e);
}

const db = admin.firestore();

// Mock Data Setup
async function setupMockData(userId: string) {
    console.log("Setting up mock data...");
    await db.collection("interviews").add({
        userId,
        position: "Test Position",
        createdAt: admin.firestore.Timestamp.now()
    });
    
    await db.collection("userAnswers").add({
        userId,
        question: "Test Question",
        createdAt: admin.firestore.Timestamp.now()
    });
    console.log("Mock data created.");
}

async function verifyDeletion(userId: string) {
    console.log("Verifying deletion...");
    const interviews = await db.collection("interviews").where("userId", "==", userId).get();
    const answers = await db.collection("userAnswers").where("userId", "==", userId).get();
    
    if (interviews.empty && answers.empty) {
        console.log("SUCCESS: All data deleted.");
    } else {
        console.error(`FAILURE: Found ${interviews.size} interviews and ${answers.size} answers remaining.`);
    }
}

async function runTest() {
    const userId = "test_user_" + Date.now();
    
    // 1. Setup Data
    try {
        await setupMockData(userId);
    } catch (e) {
         console.warn("Skipping data setup/verification due to missing credentials or permission. Verifying logic only.");
    }

    // 2. Prepare Payload and Headers
    const payload = JSON.stringify({
        type: "user.deleted",
        data: { id: userId }
    });
    
    const secret = process.env.CLERK_WEBHOOK_SECRET!;
    const wh = new Webhook(secret);

    // Mock timestamp and ID for signing manually if sign() requires them or use the correct method
    const timestampDate = new Date();
    const id = "msg_" + Date.now();
    
    // In newer svix versions, sign might be static or require more params if using instance
    // Let's use `sign` assuming it returns the signature, not headers object, or adapt based on error
    // If sign expects (payload, timestamp, id)
    const signature = (wh as any).sign(payload, timestampDate, id) as string;

    const headers: any = {
        "svix-id": id,
        "svix-timestamp": Math.floor(timestampDate.getTime() / 1000).toString(),
        "svix-signature": signature
    };
    
    console.log("Generated headers for test:", headers);
    
    // 3. Simulate The Handler Logic
    
    const svix_id = headers["svix-id"];
    const svix_timestamp = headers["svix-timestamp"];
    const svix_signature = headers["svix-signature"];
    
    const verifyWh = new Webhook(secret);
    try {
        const evt = verifyWh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as any;
        
        console.log("SUCCESS: Webhook signature verified.");
        console.log("Event Type:", evt.type);
        console.log("User ID:", evt.data.id);
        
        if (evt.type === "user.deleted" && evt.data.id === userId) {
            console.log("Logic check passed: Correct event type and user ID extracted.");
        } else {
            console.error("Logic check failed: Incorrect event type or user ID.");
        }
        
    } catch (err) {
        console.error("FAILURE: Webhook verification failed:", err);
    }
    
    // 4. Trigger Deletion (Manual call to db logic)
    // If we had credentials, we would call the delete logic here.
    // For now, we will simulate the DB call if we can.
    
    if (admin.apps.length > 0) {
         console.log("Attempting database deletion logic...");
         const batch = db.batch();
         const interviewsQuery = await db.collection("interviews").where("userId", "==", userId).get();
         interviewsQuery.docs.forEach((doc) => batch.delete(doc.ref));
         const answersQuery = await db.collection("userAnswers").where("userId", "==", userId).get();
         answersQuery.docs.forEach((doc) => batch.delete(doc.ref));
         await batch.commit();
         await verifyDeletion(userId);
    }
}

runTest();
