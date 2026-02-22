/* eslint-disable @typescript-eslint/no-unused-vars */
import { useAuth } from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  CircleStop,
  Loader,
  Mic,
  RefreshCw,
  Save,
  Video,
  VideoOff,
  WebcamIcon,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useParams } from "react-router-dom";
import WebCam from "react-webcam";
import { TooltipButton } from "./tooltip-button";
import { toast } from "sonner";
import { generateAiContent } from "@/utils/gemini-helper";
import { SaveModal } from "./save-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase.config";
import {
  calculateOverallConfidence,
  calculateSpeechConfidence,
  calculateTextConfidence,
  calculateWebcamConfidence,
} from "@/utils/confidence";
import { Timestamp } from "firebase/firestore";

interface RecordAnswerProps {
  question: { question: string; answer: string };
  isWebCam: boolean;
  setIsWebCam: (value: boolean) => void;
  onAnswerSaved: (answer?: string) => void;
  showTimedSkip?: boolean;
  preferredLanguage: string;
  setPreferredLanguage: (lang: string) => void;
  addViolation: (reason: string) => void;
  sessionAnswers: string[];
}

interface AIResponse {
  ratings: number;
  feedback: string;
  translated_answer: string;
}

export const RecordAnswer = ({
  question,
  isWebCam,
  setIsWebCam,
  onAnswerSaved,
  showTimedSkip = false,
  preferredLanguage,
  setPreferredLanguage,
  addViolation,
  sessionAnswers,
}: RecordAnswerProps) => {

  const {
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    error,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
    lang: preferredLanguage,
  });

  useEffect(() => {
    if (error) {
      toast.error("Error", {
        description: error,
      });
    }
  }, [error]);

  const [userAnswer, setUserAnswer] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { userId } = useAuth();
  const { interviewId } = useParams();
  const startTimeRef = useRef<number | null>(null);
  const recordingDurationRef = useRef<number>(0);

  // Timestamp and initial answer tracking
  const [ansCreatedAt, setAnsCreatedAt] = useState<Timestamp | null>(null);
  const [ansUpdatedAt, setAnsUpdatedAt] = useState<Timestamp | null>(null);
  const [initialAnswer, setInitialAnswer] = useState("");

  // Confidence State
  const [webcamStability, setWebcamStability] = useState(10); // Default to stable
  
  // Motion Detection (Simplified for now - Random variance to simulate analysis)
  useEffect(() => {
    if (!isWebCam && !isRecording) return;
    
    // In a real implementation, we would use a canvas to diff frames.
    // Here we simulate stability fluctuation during recording.
    const interval = setInterval(() => {
        // Randomly adjust stability score (0-50, where lower is better/more stable)
        // This is a placeholder for actual pixel diff logic
        const fluctuation = Math.random() * 5; 
        setWebcamStability(prev => Math.min(50, Math.max(0, prev + (Math.random() > 0.5 ? fluctuation : -fluctuation))));
    }, 1000);

    return () => clearInterval(interval);
  }, [isWebCam, isRecording]);

  const toggleRecording = async () => {
    if (isRecording) {
      stopSpeechToText();
    } else {
      startSpeechToText();
      startTimeRef.current = Date.now();
    }
  };

  useEffect(() => {
    if (!isRecording && startTimeRef.current) {
        // Recording stopped
        const duration = (Date.now() - startTimeRef.current) / 1000;
        recordingDurationRef.current += duration;
        startTimeRef.current = null;
    }
  }, [isRecording]);



  const cleanJsonResponse = (responseText: string) => {
    // Step 1: Trim any surrounding whitespace
    let cleanText = responseText.trim();

    // Step 2: Remove any occurrences of "json" or code block symbols (``` or `)
    cleanText = cleanText.replace(/(json|```|`)/g, "");

    // Step 3: Parse the clean JSON text into an array of objects
    try {
      return JSON.parse(cleanText);
    } catch (error) {
      throw new Error("Invalid JSON format: " + (error as Error)?.message);
    }
  };

  const generateResult = async (
    qst: string,
    qstAns: string,
    userAns: string
  ): Promise<AIResponse> => {
    setIsAiGenerating(true);
    
    // Map language code to human readable name for the prompt
    const langMap: Record<string, string> = {
        "en-US": "English",
        "hi-IN": "Hindi",
        "mr-IN": "Marathi"
    };
    const userLanguage = langMap[preferredLanguage] || "English";

    const prompt = `
      Question: "${qst}"
      User Answer: "${userAns}"
      Correct Answer: "${qstAns}"
      Context: The user answered the interview question in their preferred language: ${userLanguage}.
      
      Instructions:
      1. Internally translate the User Answer to English.
      2. Compare the translated User Answer to the Correct Answer.
      3. Evaluate the answer quality based on technical accuracy and relevance, and provide a rating (from 1 to 10).
      4. Provide concise feedback for improvement (max 3 sentences).
      
      CRITICAL REQUIREMENT: 
      - The "feedback" field MUST be written entirely in pure English, regardless of the user's preferred language.
      - Use Markdown formatting to structure the advice clearly.
      - The "translated_answer" field MUST contain only the English translation of the User Answer.
      
      Return the result in JSON format with the fields "ratings" (number), "feedback" (string), and "translated_answer" (string).
    `;

    try {
      const aiResponseText = await generateAiContent({ prompt });
      
      const parsedResult: AIResponse = cleanJsonResponse(aiResponseText);
      return parsedResult;
    } catch (error) {
      console.log(error);
      toast("Error", {
        description: "An error occurred while generating feedback.",
      });
      return { ratings: 0, feedback: "Unable to generate feedback", translated_answer: userAns };
    } finally {
      setIsAiGenerating(false);
    }
  };

  const recordNewAnswer = () => {
    setUserAnswer("");
    stopSpeechToText();
    recordingDurationRef.current = 0; // Reset duration
    startTimeRef.current = Date.now(); // Restart timer
    startSpeechToText();
  };

  const saveUserAnswer = async () => {
    setLoading(true);

    if (!userAnswer) {
      setLoading(false);
      return;
    }

    if (sessionAnswers.includes(userAnswer.trim())) {
      addViolation("Repeated identical answer detected");
      setLoading(false);
      setOpen(false);
      return;
    }

    const currentQuestion = question.question;

    // Calculate Confidence Scores
    const textConfidence = calculateTextConfidence(userAnswer);
    
    // If still recording when save is clicked, add current segment duration
    let totalDuration = recordingDurationRef.current;
    if (isRecording && startTimeRef.current) {
        totalDuration += (Date.now() - startTimeRef.current) / 1000;
    }

    const wordCount = userAnswer.split(/\s+/).length;
    const speechConfidence = calculateSpeechConfidence(totalDuration, wordCount);
    
    // Use the tracked stability score (averaged or final)
    const webcamConfidence = calculateWebcamConfidence(webcamStability);

    const overallConfidence = calculateOverallConfidence(
        textConfidence, 
        speechConfidence, 
        webcamConfidence, 
        isWebCam
    );

    const confidenceData = {
        overall: overallConfidence,
        textScore: textConfidence,
        speechScore: speechConfidence,
        webcamScore: webcamConfidence
    };

    try {
      // Generate feedback if not already generated
      let currentAiResult = aiResult;

      if (!currentAiResult) {
        setIsAiGenerating(true);
        currentAiResult = await generateResult(
          question.question,
          question.answer,
          userAnswer
        );
        setAiResult(currentAiResult);
        setIsAiGenerating(false);
      }

      if (userId) {
        // query the firbase to check if the user answer already exists for this question
        const userAnswerQuery = query(
          collection(db, "users", userId, "userAnswers"),
          where("mockIdRef", "==", interviewId),
          where("question", "==", currentQuestion)
        );

        const querySnap = await getDocs(userAnswerQuery);

        // if the user already answerd the question, update it
        if (!querySnap.empty) {
          const docRef = querySnap.docs[0].ref;
          await updateDoc(docRef, {
            user_ans: currentAiResult.translated_answer || userAnswer,
            feedback: currentAiResult.feedback,
            rating: currentAiResult.ratings,
            updatedAt: serverTimestamp(),
            confidenceScore: confidenceData,
          });
          
          toast.success("Answer Updated", {
            description: "Your answer has been updated successfully",
          });
        } else {
          // save the user answer
          await addDoc(collection(db, "users", userId, "userAnswers"), {
            mockIdRef: interviewId,
            question: question.question,
            correct_ans: question.answer,
            user_ans: currentAiResult.translated_answer || userAnswer,
            feedback: currentAiResult.feedback,
            rating: currentAiResult.ratings,
            userId,
            createdAt: serverTimestamp(),
            confidenceScore: confidenceData,
          });

          // Optimistically update local state for timestamp
          setAnsCreatedAt(Timestamp.now());
          toast("Saved", { description: "Your answer has been saved.." });
        }
        
        // Update initial answer to current answer after successful save
        setInitialAnswer(userAnswer);
        setAnsUpdatedAt(Timestamp.now());
      }
      
      onAnswerSaved(userAnswer);

      setUserAnswer("");
      stopSpeechToText();
    } catch (error) {
      toast("Error", {
        description: "An error occurred while saving.",
      });
      console.log(error);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  // We need a ref to track how many results we've already processed
  const prevResultsRef = useRef(0);

  useEffect(() => {
    // If results are reset (e.g. stopped and started again), reset the ref
    if (results.length < prevResultsRef.current) {
        prevResultsRef.current = results.length;
    }

    if (results.length > prevResultsRef.current) {
      const newResults = results.slice(prevResultsRef.current);
      const newTranscript = newResults
        .map((result) => result.transcript)
        .join(" ");

      setUserAnswer((prev) => prev + (prev ? " " : "") + newTranscript);
      prevResultsRef.current = results.length;
    }
  }, [results]);

  // Check for existing answer
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    const checkExistingAnswer = async () => {
      if (!userId || !interviewId) return;
      try {
        const q = query(
          collection(db, "users", userId, "userAnswers"),
          where("mockIdRef", "==", interviewId),
          where("question", "==", question.question)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setIsAnswered(true);
          const data = snap.docs[0].data();
          // Optionally populate userAnswer if we wanted to show previous answer, 
          // but req says "If you answer again, previous response will be updated", 
          // implying we start fresh or maybe we should load it? 
          // The request doesn't explicitly say "load previous answer text", just "indicate it's answered".
          // So I will just set the flag.

          if (data.user_ans && !userAnswer) {
             setUserAnswer(data.user_ans); 
             setInitialAnswer(data.user_ans); // Set initial answer for comparison
             // Pre-fill answer if available so they can see what they wrote?
             // "If you answer again, the previous response will be updated."
             // It's better UX to show what they wrote. I'll add this.
          }
          if (data.createdAt) setAnsCreatedAt(data.createdAt);
          if (data.updatedAt) setAnsUpdatedAt(data.updatedAt);

        } else {
          setIsAnswered(false);
          setUserAnswer(""); // Clear if new question
          setInitialAnswer("");
          setAnsCreatedAt(null);
          setAnsUpdatedAt(null);
        }
      } catch (err) {
        console.error("Error checking answer:", err);
      }
    };

    checkExistingAnswer();
  }, [question, userId, interviewId]);


  return (
    <div className="w-full flex flex-col gap-8 mt-4">
      {/* save modal */}
      <SaveModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={saveUserAnswer}
        loading={loading}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Answer Area */}
        <div className="flex flex-col gap-4">
          <div className="w-full p-4 border rounded-md bg-white shadow-sm flex flex-col h-full relative">
            
            {/* Answered Indicator */}
             {isAnswered && (
                <div className="absolute top-2 right-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm z-10 animate-in fade-in slide-in-from-top-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                     Already Answered
                </div>
             )}

            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-neutral-800">Your Answer:</h2>
              {isRecording && (
                <span className="text-sm text-red-500 animate-pulse flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  Recording...
                </span>
              )}
            </div>
            

            {isAnswered && (
                <div className="mb-3 flex flex-col gap-1">
                   <p className="text-xs text-muted-foreground italic">
                      Note: This question has already been answered. Modify your answer to update.
                   </p>
                   <p className="text-xs text-neutral-400">
                      {ansUpdatedAt 
                        ? `Updated: ${ansUpdatedAt.toDate().toLocaleString()}` 
                        : ansCreatedAt 
                            ? `Submitted: ${ansCreatedAt.toDate().toLocaleString()}`
                            : ''}
                   </p>
                </div>
            )}

            <Textarea
              className="min-h-[300px] flex-grow p-4 text-base bg-transparent border-none resize-none focus-visible:ring-0 overflow-y-auto overflow-x-auto whitespace-pre"
              value={userAnswer}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newValue = e.target.value;
                if (newValue.length - userAnswer.length > 300) {
                  addViolation("Large text injection detected");
                  return;
                }
                setUserAnswer(newValue);
              }}
              onPaste={(e) => {
                const pastedText = e.clipboardData.getData("text");
                if (pastedText) {
                  const lines = pastedText.split(/\r\n|\r|\n/);
                  if (lines.length > 5) {
                    e.preventDefault();
                    addViolation("Pasted content exceeds 5 lines");
                  }
                }
              }}
              placeholder="Your answer will appear here as you speak, or you can type it manually..."
              disabled={isAiGenerating} 
              onContextMenu={(e) => e.preventDefault()}
            />

            {interimResult && (
              <p className="text-sm text-gray-400 mt-2 border-t pt-2">
                <strong>Current Speech:</strong> {interimResult}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Webcam & Controls */}
        <div className="flex flex-col gap-6">
          {/* Webcam Box */}
          <div className="w-full aspect-video flex items-center justify-center border rounded-lg overflow-hidden bg-neutral-900 border-neutral-700 shadow-md relative">
            {isWebCam ? (
              <WebCam
                onUserMedia={() => setIsWebCam(true)}
                onUserMediaError={() => setIsWebCam(false)}
                className="w-full h-full object-cover"
              />
            ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-500">
                     <WebcamIcon className="w-16 h-16" />
                     <span className="text-sm">Webcam is off</span>
                </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex flex-col gap-4">
             {/* Language Selector */}
             <div className="w-full flex-col px-4 py-3 border rounded-lg bg-neutral-50 shadow-sm">
                 <Label className="text-sm font-semibold text-neutral-700 mb-2 block">
                     Choose your Answer Language: Speak or type naturally
                 </Label>
                 <Select value={preferredLanguage} onValueChange={setPreferredLanguage} disabled={isRecording}>
                     <SelectTrigger className="w-full md:w-[240px] bg-white border-neutral-200">
                         <SelectValue placeholder="Language" />
                     </SelectTrigger>
                     <SelectContent>
                         <SelectItem value="en-US">English</SelectItem>
                         <SelectItem value="hi-IN">Hindi</SelectItem>
                         <SelectItem value="mr-IN">Marathi</SelectItem>
                     </SelectContent>
                 </Select>
             </div>

             <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                <TooltipButton
                  content={isWebCam ? "Turn Off Camera" : "Turn On Camera"}
                  icon={
                    isWebCam ? (
                      <VideoOff className="w-5 h-5" />
                    ) : (
                      <Video className="w-5 h-5" />
                    )
                  }
                  onClick={() => setIsWebCam(!isWebCam)}
                />

                <TooltipButton
                    content={isRecording ? "Stop Recording" : "Start Recording"}
                    icon={
                    isRecording ? (
                        <CircleStop className="w-6 h-6 text-red-500 animate-pulse" />
                    ) : (
                        <Mic className="w-6 h-6" />
                    )
                    }
                    onClick={toggleRecording}
                    buttonClassName={isRecording ? "ring-2 ring-red-500 ring-offset-2 h-12 w-12" : "h-12 w-12"}
                />

                <TooltipButton
                  content="Record Again"
                  icon={<RefreshCw className="w-5 h-5" />}
                  onClick={recordNewAnswer}
                />
             </div>
             
             <div className="w-full flex items-center gap-3">
                 {isAnswered && (
                     <Button
                        variant="outline"
                        onClick={() => onAnswerSaved()}
                        className="flex-1 border-neutral-300 hover:bg-neutral-50 text-neutral-600"
                        disabled={loading || isRecording || isAiGenerating}
                     >
                        Skip
                     </Button>
                 )}
                
                <Button
                  onClick={() => setOpen(!open)}
                  disabled={!userAnswer || isRecording || isAiGenerating || (isAnswered && userAnswer === initialAnswer)}
                  className="flex-[2]"
                >
                   {isAiGenerating ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                   <span>{isAnswered ? "Update & Next" : "Save & Next"}</span>
                </Button>
             </div>
             
             {/* Timed Skip Button (Only for unanswered questions after 1 min) */}
             {!isAnswered && showTimedSkip && (
                <div className="w-full animate-in fade-in slide-in-from-top-2 duration-500">
                    <Button
                        variant="ghost"
                        onClick={() => onAnswerSaved()}
                        className="w-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 h-8 text-sm font-normal"
                    >
                        Skip Question (No Answer)
                    </Button>
                    <p className="text-[10px] text-center text-neutral-500 mt-1">
                        You can proceed to the next question.
                    </p>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
