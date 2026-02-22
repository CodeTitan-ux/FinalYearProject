import { Interview } from "@/types";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { LoaderPage } from "./loader-page";
import { useAuth } from "@clerk/clerk-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { CustomBreadCrumb } from "@/components/custom-bread-crumb";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, AlertTriangle } from "lucide-react";
import { QuestionSection } from "@/components/question-section";
import { useCheatingDetection } from "@/hooks/use-cheating-detection";

interface OutletContextType {
  setShowFooter: (show: boolean) => void;
  setShowHeader: (show: boolean) => void;
}

export const MockInterviewPage = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  // Use explicit type casting for context with fallback to avoid crashes if context is missing
  const { setShowFooter, setShowHeader } = (useOutletContext() as OutletContextType) || { setShowFooter: () => {}, setShowHeader: () => {} };
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isInterviewActive, setIsInterviewActive] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const { userId } = useAuth();

  const navigate = useNavigate();

  const handleTerminate = () => {
    setIsInterviewActive(false);
    navigate("/generate", { replace: true });
  };

  const { addViolation } = useCheatingDetection(isInterviewActive, handleTerminate);

  useEffect(() => {
    setIsLoading(true);
    const fetchInterview = async () => {
      if (interviewId) {
        try {
          if (userId) {
              const interviewDoc = await getDoc(doc(db, "users", userId, "interviews", interviewId));
              if (interviewDoc.exists()) {
                setInterview({
                  id: interviewDoc.id,
                  ...interviewDoc.data(),
                } as Interview);
              }
          }
        } catch (error) {
          console.log(error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchInterview();
  }, [interviewId, navigate]);

  // Hide footer and header when interview is active
  useEffect(() => {
    if (setShowFooter) {
      setShowFooter(!isInterviewActive);
    }
    if (setShowHeader) {
      setShowHeader(!isInterviewActive);
    }
    
    // Cleanup: ensure footer and header are visible when unmounting or navigating away
    return () => {
      if (setShowFooter) setShowFooter(true);
      if (setShowHeader) setShowHeader(true);
    };
  }, [isInterviewActive, setShowFooter, setShowHeader]);

  if (isLoading) {
    return <LoaderPage className="w-full h-[70vh]" />;
  }

  if (!interviewId) {
    navigate("/generate", { replace: true });
  }

  if (!interview) {
     if (!isLoading) {
        // Only redirect if done loading and still no interview
        // navigate("/generate", { replace: true });
     }
  }

  return (
    <div className="flex flex-col w-full gap-8 py-5">
      <CustomBreadCrumb
        breadCrumbPage="Start"
        enabled={!isInterviewActive}
        breadCrumpItems={[
          { label: "Mock Interviews", link: "/generate" },
          {
            label: interview?.position || "",
            link: `/generate/interview/${interviewId}`, // Breadcrumb should go back to Load Page
          },
        ]}
      />

      {!isInterviewActive && (
        <div className="w-full flex flex-col gap-4">
          <Alert className="bg-sky-100 border border-sky-200 p-4 rounded-lg flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <AlertTitle className="text-sky-800 font-semibold">
                Important Note
              </AlertTitle>
              <AlertDescription className="text-sm text-sky-700 mt-1 leading-relaxed">
                Press "Record Answer" to begin answering the question. Once you
                finish the interview, you&apos;ll receive feedback comparing your
                responses with the ideal answers.
                <br />
                <br />
                <strong>Note:</strong>{" "}
                <span className="font-medium">Your video is never recorded.</span>{" "}
                You can disable the webcam anytime if preferred.
              </AlertDescription>
            </div>
          </Alert>

          <Alert className="bg-rose-50 border border-rose-200 p-4 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <AlertTitle className="text-rose-800 font-semibold">
                Anti-Cheating & Interview Rules
              </AlertTitle>
              <AlertDescription className="text-sm text-rose-700 mt-1 leading-relaxed space-y-2">
                <p>This interview environment is strictly monitored to ensure fairness. Please adhere to the following rules:</p>
                <ul className="list-disc list-inside space-y-1 ml-1 text-rose-700/90">
                  <li>Do not switch tabs, minimize the browser, or open other applications.</li>
                  <li>Ensure your microphone and webcam remain active if enabled.</li>
                  <li>Maintain focus on the interview screen at all times.</li>
                </ul>
                <p className="font-medium mt-2">
                  Violations will result in a strike. <strong>10 strikes will permanently terminate your interview.</strong>
                </p>
              </AlertDescription>
            </div>
          </Alert>
        </div>
      )}

      {interview?.questions && interview?.questions.length > 0 && (
        <div className="mt-4 w-full flex flex-col items-start gap-4">
          <QuestionSection
            questions={interview?.questions}
            mockInterviewExperience={interview?.experience as string}
            onStateChange={setIsInterviewActive}
            addViolation={addViolation}
          />
        </div>
      )}
    </div>
  );
};
