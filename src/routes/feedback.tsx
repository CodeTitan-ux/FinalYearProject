import { db } from "@/config/firebase.config";
import { Interview, UserAnswer } from "@/types";
import { useAuth } from "@clerk/clerk-react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { LoaderPage } from "./loader-page";
import { CustomBreadCrumb } from "@/components/custom-bread-crumb";
import { Headings } from "@/components/headings";
import { InterviewPin } from "@/components/pin";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { CircleCheck, Star, Trophy, Video, Mic, MessageSquare } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ResumeProfileCard } from "@/components/resume-profile-card";
import ReactMarkdown from "react-markdown";


import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ConfidenceCardProps {
  confidenceScore?: {
    overall: number;
    textScore: number;
    speechScore: number;
    webcamScore: number;
  };
}

const ConfidenceCard = ({ confidenceScore }: ConfidenceCardProps) => {
  if (!confidenceScore) return null;

  const { overall, textScore, speechScore, webcamScore } = confidenceScore;


  
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Card className="border p-4 shadow-sm">
      <CardTitle className="flex items-center text-base font-semibold mb-4 text-neutral-700">
        <Trophy className="mr-2 w-5 h-5 text-yellow-500" />
        Confidence Analysis
      </CardTitle>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {/* Overall Score - Circular-ish Display */}
         <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-neutral-50 border">
            <div className="relative w-24 h-24 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-neutral-200"
                    />
                    <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - overall / 100)}
                        className={getProgressColor(overall).replace("bg-", "text-")}
                        strokeLinecap="round"
                    />
                 </svg>
                 <span className="absolute text-xl font-bold text-neutral-700">{overall}%</span>
            </div>
            <p className="mt-2 text-sm font-medium text-muted-foreground">Overall Confidence</p>
         </div>

         {/* Breakdown */}
         <div className="space-y-4">
             {/* Text Analysis */}
             <div className="space-y-1">
                 <div className="flex justify-between text-xs font-medium">
                    <div className="flex items-center gap-1 text-neutral-600">
                        <MessageSquare className="w-3 h-3" /> Text Quality
                    </div>
                    <span>{textScore}/100</span>
                 </div>
                 <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                     <div className={`h-full rounded-full ${getProgressColor(textScore)}`} style={{ width: `${textScore}%` }} />
                 </div>
             </div>

             {/* Speech Analysis */}
             <div className="space-y-1">
                 <div className="flex justify-between text-xs font-medium">
                    <div className="flex items-center gap-1 text-neutral-600">
                        <Mic className="w-3 h-3" /> Speech Rate & Flow
                    </div>
                    <span>{speechScore}/100</span>
                 </div>
                 <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                     <div className={`h-full rounded-full ${getProgressColor(speechScore)}`} style={{ width: `${speechScore}%` }} />
                 </div>
             </div>

             {/* Webcam Analysis */}
             <div className="space-y-1">
                 <div className="flex justify-between text-xs font-medium">
                    <div className="flex items-center gap-1 text-neutral-600">
                        <Video className="w-3 h-3" /> Body Language/Stability
                    </div>
                     <span>{webcamScore}/100</span>
                 </div>
                 <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                     <div className={`h-full rounded-full ${getProgressColor(webcamScore)}`} style={{ width: `${webcamScore}%` }} />
                 </div>
             </div>
         </div>
      </div>
    </Card>
  );
};

export const Feedback = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<UserAnswer[]>([]);
  const [activeFeed, setActiveFeed] = useState("");
  const { userId } = useAuth();
  const navigate = useNavigate();

  if (!interviewId) {
    navigate("/generate", { replace: true });
  }

  useEffect(() => {
    if (interviewId) {
      const fetchInterview = async () => {
        if (interviewId) {
          try {
            const interviewDoc = await getDoc(
              doc(db, "users", userId!, "interviews", interviewId),
            );
            if (interviewDoc.exists()) {
              setInterview({
                id: interviewDoc.id,
                ...interviewDoc.data(),
              } as Interview);
            }
          } catch (error) {
            console.log(error);
          }
        }
      };

      const fetchFeedbacks = async () => {
        setIsLoading(true);
        try {
          const querSanpRef = query(
            collection(db, "users", userId!, "userAnswers"),
            where("mockIdRef", "==", interviewId),
          );

          const querySnap = await getDocs(querSanpRef);

          const interviewData: UserAnswer[] = querySnap.docs.map((doc) => {
            return { id: doc.id, ...doc.data() } as UserAnswer;
          });

          setFeedbacks(interviewData);
        } catch (error) {
          console.log(error);
          toast("Error", {
            description: "Something went wrong. Please try again later..",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchInterview();
      fetchFeedbacks();
    }
  }, [interviewId, navigate, userId]);

  //   calculate the ratings out of 10

  const overAllRating = useMemo(() => {
    if (feedbacks.length === 0) return "0.0";

    const totalRatings = feedbacks.reduce(
      (acc, feedback) => acc + feedback.rating,
      0,
    );

    return (totalRatings / feedbacks.length).toFixed(1);
  }, [feedbacks]);

  const sortedFeedbacks = useMemo(() => {
    if (!interview?.questions) return feedbacks;

    return [...feedbacks].sort((a, b) => {
      const indexA = interview.questions.findIndex(
        (q) => q.question === a.question,
      );
      const indexB = interview.questions.findIndex(
        (q) => q.question === b.question,
      );
      return indexA - indexB;
    });
  }, [feedbacks, interview]);

  if (isLoading) {
    return <LoaderPage className="w-full h-[70vh]" />;
  }

  return (
    <div className="flex flex-col w-full gap-8 py-5">
      <div className="flex items-center justify-between w-full gap-2">
        <CustomBreadCrumb
          breadCrumbPage={"Feedback"}
          breadCrumpItems={[
            { label: "Mock Interviews", link: "/generate" },
            {
              label: `${interview?.position}`,
              link: `/generate/interview/${interview?.id}`,
            },
          ]}
        />
      </div>

      <Headings
        title="Congratulations !"
        description="Your personalized feedback is now available. Dive in to see your strengths, areas for improvement, and tips to help you ace your next interview."
      />

      <p className="text-base text-muted-foreground">
        Your overall interview ratings :{" "}
        <span className="text-emerald-500 font-semibold text-xl">
          {overAllRating} / 10
        </span>
      </p>

      {interview && <InterviewPin interview={interview} onMockPage />}

      <Headings title="Interview Feedback" isSubHeading />

      {interview?.resumeProfile && (
        <div className="mb-6">
            <ResumeProfileCard profile={interview.resumeProfile} hideBadges={true} />
        </div>
      )}

      {sortedFeedbacks && (
        <Accordion type="single" collapsible className="space-y-6">
          {sortedFeedbacks.map((feed) => {
            const index = interview?.questions?.findIndex(
              (q) => q.question === feed.question,
            );
            return (
              <AccordionItem
                key={feed.id}
                value={feed.id}
                className="border rounded-lg shadow-md"
              >
                <AccordionTrigger
                  onClick={() => setActiveFeed(feed.id)}
                  className={cn(
                    "px-5 py-3 flex items-center justify-between text-base rounded-t-lg transition-colors hover:no-underline",
                    activeFeed === feed.id
                      ? "bg-gradient-to-r from-purple-50 to-blue-50"
                      : "hover:bg-gray-50",
                  )}
                >
                  <span>
                    {index !== undefined && index !== -1
                      ? `Question ${index + 1} : `
                      : ""}
                    {feed.question}
                  </span>
                </AccordionTrigger>

                <AccordionContent className="px-5 py-6 bg-white rounded-b-lg space-y-5 shadow-inner">
                  <div className="text-lg font-semibold text-gray-700">
                    <Star className="inline mr-2 text-yellow-500 fill-yellow-500" />
                    Rating : {feed.rating}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {/* Confidence Analysis */}
                    {feed.confidenceScore && (
                        <div className="md:col-span-2">
                             <ConfidenceCard confidenceScore={feed.confidenceScore} />
                        </div>
                    )}

                    <Card className="border p-4 bg-green-50 rounded-lg shadow-sm border-green-100">
                      <CardTitle className="flex items-center text-base font-semibold mb-2 text-green-700">
                        <CircleCheck className="mr-2 w-5 h-5 text-green-600" />
                        Expected Answer
                      </CardTitle>

                      <CardDescription className="font-medium text-gray-700 w-full p-2 h-60 overflow-y-auto overflow-x-auto start-hidden-scrollbar">
                        <div className="prose prose-sm max-w-none text-gray-700 prose-headings:text-green-800 prose-p:text-gray-700 prose-strong:text-gray-800">
                          <ReactMarkdown
                            components={{
                              code({
                                node,
                                className,
                                children,
                                ...props
                              }) {
                                const match = /language-(\w+)/.exec(
                                  className || "",
                                );
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                const { ref, ...rest } = props;
                                return match ? (
                                  <SyntaxHighlighter
                                    style={vscDarkPlus as any}
                                    language={match[1]}
                                    PreTag="div"
                                    {...rest}
                                  >
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {feed.correct_ans}
                          </ReactMarkdown>
                        </div>
                      </CardDescription>
                    </Card>

                    <Card className="border p-4 bg-blue-50 rounded-lg shadow-sm border-blue-100">
                      <CardTitle className="flex items-center text-base font-semibold mb-2 text-blue-700">
                        <CircleCheck className="mr-2 w-5 h-5 text-blue-600" />
                        Your Answer
                      </CardTitle>

                      <CardDescription className="font-medium text-gray-700 w-full p-2 h-60 overflow-y-auto overflow-x-auto start-hidden-scrollbar">
                        <div className="prose prose-sm max-w-none text-gray-700 prose-headings:text-blue-800 prose-p:text-gray-700 prose-strong:text-gray-800">
                          <ReactMarkdown
                            components={{
                              code({
                                node,
                                className,
                                children,
                                ...props
                              }) {
                                const match = /language-(\w+)/.exec(
                                  className || "",
                                );
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                const { ref, ...rest } = props;
                                return match ? (
                                  <SyntaxHighlighter
                                    style={vscDarkPlus as any}
                                    language={match[1]}
                                    PreTag="div"
                                    {...rest}
                                  >
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {feed.user_ans}
                          </ReactMarkdown>
                        </div>
                      </CardDescription>
                    </Card>
                  </div>

                  <Card className="border p-4 bg-amber-50 rounded-lg shadow-sm border-amber-100">
                    <CardTitle className="flex items-center text-base font-semibold mb-2 text-amber-700">
                      <CircleCheck className="mr-2 w-5 h-5 text-amber-600" />
                      Feedback
                    </CardTitle>

                    <CardDescription className="font-medium text-gray-700 w-full p-2 h-60 overflow-y-auto overflow-x-auto start-hidden-scrollbar">
                      <div className="prose prose-sm max-w-none text-gray-700 prose-headings:text-amber-800 prose-p:text-gray-700 prose-strong:text-gray-800">
                        <ReactMarkdown
                          components={{
                            code({
                              node,
                              className,
                              children,
                              ...props
                            }) {
                              const match = /language-(\w+)/.exec(
                                className || "",
                              );
                              // eslint-disable-next-line @typescript-eslint/no-unused-vars
                              const { ref, ...rest } = props;
                              return match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus as any}
                                  language={match[1]}
                                  PreTag="div"
                                  {...rest}
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {feed.feedback}
                        </ReactMarkdown>
                      </div>
                    </CardDescription>
                  </Card>


                   <div className="w-full text-right text-xs text-muted-foreground mt-2 flex flex-col items-end gap-1">
                      {feed.updatedAt ? (
                        <span>Updated: {feed.updatedAt.toDate().toLocaleString()}</span>
                      ) : feed.createdAt ? (
                        <span>Submitted: {feed.createdAt.toDate().toLocaleString()}</span>
                      ) : null}
                   </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};
