import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TooltipButton } from "./tooltip-button";
import {
  Volume2,
  VolumeX,
  LogOut,
  Pause,
  Play,
  Timer,
  Webcam,
  Mic,
  CircleAlert,
  AlertCircle,
  Info,
} from "lucide-react";
import { RecordAnswer } from "./record-answer";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useMediaPermissions } from "@/hooks/use-media-permissions";
import { generateAiContent } from "@/utils/gemini-helper";

interface QuestionSectionProps {
  questions: { question: string; answer: string }[];
  mockInterviewExperience: string;
  onStateChange?: (isStarted: boolean) => void;
  addViolation: (reason: string) => void;
}

export const QuestionSection = ({
  questions,
  mockInterviewExperience,
  onStateChange,
  addViolation,
}: QuestionSectionProps) => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWebCam, setIsWebCam] = useState(false);
  const [currentSpeech, setCurrentSpeech] =
    useState<SpeechSynthesisUtterance | null>(null);

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [preferredLanguage, setPreferredLanguage] = useState("en-US");
  const [isTranslatingAudio, setIsTranslatingAudio] = useState(false);
  const translationCache = useRef<Record<string, string>>({});
  const [sessionAnswers, setSessionAnswers] = useState<string[]>([]);

  // Notify parent component about state changes
  useEffect(() => {
    onStateChange?.(isStarted);
  }, [isStarted, onStateChange]);

  const getDuration = () => {
    if (mockInterviewExperience?.toLowerCase().includes("junior")) return 120; // 2 mins
    if (mockInterviewExperience?.toLowerCase().includes("mid")) return 180; // 3 mins
    if (mockInterviewExperience?.toLowerCase().includes("senior")) return 300; // 5 mins
    return 180;
  };

  const navigate = useNavigate();

  const handleStart = () => {
    setIsStarted(true);
    setIsPaused(false);
    setTimeLeft(getDuration());
  };

  const handleAnswerSaved = (answer?: string) => {
    if (answer) {
      setSessionAnswers((prev) => [...prev, answer.trim()]);
    }
    
    if (activeQuestionIndex < questions.length - 1) {
      setActiveQuestionIndex((prev) => prev + 1);
      setTimeLeft(getDuration());
    } else {
      // Last question answered - finish interview
      setIsStarted(false);
      navigate(`/generate/feedback/${interviewId}`);
    }
  };

  // We need to get interviewId to redirect correctly.
  // It's not passed in props. We can use useParams().

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isStarted && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isStarted && timeLeft === 0) {
      // Time is up for current question
      if (activeQuestionIndex < questions.length - 1) {
        setActiveQuestionIndex((prev) => prev + 1);
        setTimeLeft(getDuration());
      } else {
        // End of interview - could redirect or show completion
        // For now, we'll just stop the timer and maybe show a finished state
        // or let the user manually finish via the RecordAnswer component's "End Interview" if it exists.
        // But strict requirement says "Total interview duration equals sum of all individual question times".
        // If we are at the last question and time runs out, effectively the interview logic for questions is done.
        setIsStarted(false);
      }
    }

    return () => clearInterval(interval);
  }, [
    isStarted,
    isPaused,
    timeLeft,
    activeQuestionIndex,
    questions.length,
    mockInterviewExperience,
  ]);

  // Handle Pause/Resume
  const togglePause = () => {
    if (isPaused) {
      // Resume
      setIsPaused(false);
    } else {
      // Pause
      setIsPaused(true);
      // Stop speech unconditionally
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setCurrentSpeech(null);
    }
  };

  // When active question changes or component unmounts, stop speech
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentSpeech(null);
    
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeQuestionIndex]);

  const handlePlayQuestion = async (qst: string) => {
    if (isPlaying && currentSpeech) {
      // stop the speech if already playing
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentSpeech(null);
    } else {
      if ("speechSynthesis" in window) {
        setIsTranslatingAudio(true);
        let textToRead = qst;
        
        if (preferredLanguage !== "en-US") {
           try {
              const langMap: Record<string, string> = {
                  "hi-IN": "Hindi",
                  "mr-IN": "Marathi"
              };
              const targetLang = langMap[preferredLanguage];
              
              if (targetLang) {
                const cacheKey = `${targetLang}-${qst}`;
                
                if (translationCache.current[cacheKey]) {
                   // Instant load from cache memory
                   textToRead = translationCache.current[cacheKey];
                } else {
                   // Wait for Gemini API
                   const prompt = `Translate the following interview question into ${targetLang}. Return ONLY the translated string, with no additional formatting or markdown: "${qst}"`;
                   const translationText = await generateAiContent({ prompt });
                   if (translationText) {
                       textToRead = translationText.trim().replace(/['"`]/g, '');
                       // Save to cache for the future
                       translationCache.current[cacheKey] = textToRead;
                   }
                }
              }
           } catch(e) {
               console.error("Failed to translate TTS", e);
           }
        }
        setIsTranslatingAudio(false);

        const speech = new SpeechSynthesisUtterance(textToRead);
        speech.lang = preferredLanguage;
        speech.rate = 1.2; // Speed up playback by 20%
        window.speechSynthesis.speak(speech);
        setIsPlaying(true);
        setCurrentSpeech(speech);

        // handle the speech end
        speech.onend = () => {
          setIsPlaying(false);
          setCurrentSpeech(null);
        };
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const {
    hasPermissions,
    requestPermissions,
    error: permissionError,
  } = useMediaPermissions();

  if (!isStarted) {
    return (
      <div className="w-full min-h-[400px] border rounded-xl p-8 flex flex-col items-center justify-center bg-white shadow-sm gap-6 text-center">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Ready to Start?
          </h2>
          <p className="text-muted-foreground w-full max-w-md mx-auto">
            Review the interview details below and ensure your environment is
            set up.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mt-4">
          <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-all">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              Questions
            </span>
            <span className="text-lg font-bold text-slate-800">
              {questions.length} Questions
            </span>
          </div>

          <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-all">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Timer className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              Duration
            </span>
            <span className="text-lg font-bold text-slate-800">
              {getDuration() / 60} Minutes/Q
            </span>
          </div>

          <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-all">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <CircleAlert className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              Difficulty
            </span>
            <span className="text-lg font-bold text-slate-800 capitalize">
              {mockInterviewExperience}
            </span>
          </div>
        </div>

        {!hasPermissions && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 w-full max-w-2xl mt-4 flex flex-col md:flex-row items-center gap-4 text-left">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex-shrink-0 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-grow">
              <h3 className="font-semibold text-amber-800">
                Permissions Check
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                To use the microphone and camera features, please grant access.
                You can still proceed with text-only mode.
              </p>
              {permissionError && (
                <p className="text-xs text-red-600 font-semibold mt-2 bg-red-50 p-2 rounded border border-red-100">
                  Error: {permissionError}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={requestPermissions}
              className="border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800 min-w-40"
              disabled={hasPermissions}
            >
              {hasPermissions ? (
                <>
                  <Mic className="w-4 h-4 mr-2" /> <span>Enabled</span>
                </>
              ) : (
                <>
                  <Webcam className="w-4 h-4 mr-2" /> <span>Enable Access</span>
                </>
              )}
            </Button>
          </div>
        )}

        <div className="mt-4">
          <Button
            onClick={handleStart}
            size="lg"
            className="px-12 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all animate-in fade-in zoom-in duration-300"
          >
            Start Interview <Play className="w-5 h-5 ml-2 fill-current" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Top Action Buttons */}
        <div className="flex justify-end items-center gap-4">
          <Button
            variant="outline"
            size="default"
            onClick={togglePause}
            className={cn(
              "flex items-center gap-2 transition-colors",
              isPaused &&
                "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200",
            )}
          >
            {isPaused ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
            <span>{isPaused ? "Resume" : "Pause"}</span>
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                size="default"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Exit Interview
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Exit Interview?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to exit? Your progress so far is saved.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if ("speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                    }
                    setIsPlaying(false);
                    setCurrentSpeech(null);
                    setIsStarted(false);
                    navigate("/generate");
                  }}
                >
                  Exit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="w-full min-h-96 border rounded-md p-4">
          {/* Timer Display */}
          <div className="flex justify-between items-start mb-6 gap-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-primary">
                Question {activeQuestionIndex + 1} of {questions.length}
              </h2>
              <div className="flex flex-wrap gap-3">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "text-xs md:text-sm font-medium p-2 rounded-md transition-all cursor-default",
                      activeQuestionIndex === index
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "text-neutral-500 hover:bg-neutral-50",
                    )}
                  >
                    Question #{index + 1}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 md:gap-6">
              <div
                className={`text-lg md:text-xl font-bold whitespace-nowrap ${timeLeft < 30 ? "text-red-500" : "text-primary"}`}
              >
                Time Left: {formatTime(timeLeft)}
              </div>
            </div>
          </div>

          <Tabs
            value={questions[activeQuestionIndex]?.question}
            className="w-full space-y-8"
            orientation="vertical"
          >
            {/* Hidden TabsList to maintain tab functionality without displaying the old list */}
            <TabsList className="hidden">
              {questions?.map((tab, i) => (
                <TabsTrigger
                  key={tab.question}
                  value={tab.question}
                  disabled={true}
                >
                  {`Question #${i + 1}`}
                </TabsTrigger>
              ))}
            </TabsList>

            {questions?.map((tab, i) => (
              <TabsContent key={i} value={tab.question}>
                <div className="text-lg font-medium text-left tracking-wide text-neutral-800 my-5 prose max-w-none w-full break-words">
                  <ReactMarkdown>{tab.question}</ReactMarkdown>
                </div>

                <div className="w-full flex items-center justify-end">
                  <TooltipButton
                    content={isPlaying ? "Stop" : "Start"}
                    icon={
                      isPlaying ? (
                        <VolumeX className="min-w-5 min-h-5 text-muted-foreground" />
                      ) : (
                        <Volume2 className="min-w-5 min-h-5 text-muted-foreground" />
                      )
                    }
                    onClick={() => handlePlayQuestion(tab.question)}
                    loading={isTranslatingAudio}
                  />
                </div>

                <RecordAnswer
                  question={tab}
                  isWebCam={isWebCam}
                  setIsWebCam={setIsWebCam}
                  onAnswerSaved={handleAnswerSaved}
                  showTimedSkip={getDuration() - timeLeft >= 60}
                  preferredLanguage={preferredLanguage}
                  setPreferredLanguage={setPreferredLanguage}
                  addViolation={addViolation}
                  sessionAnswers={sessionAnswers}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-background p-8 rounded-lg shadow-lg text-center max-w-md w-full border">
            <h3 className="text-2xl font-bold mb-4">Interview Paused</h3>
            <p className="text-muted-foreground mb-6">
              Your interview is currently paused. The timer has stopped and the
              question is hidden. Click Resume to continue.
            </p>
            <Button onClick={togglePause} className="w-full gap-2">
              <Play className="w-4 h-4" /> Resume Interview
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
