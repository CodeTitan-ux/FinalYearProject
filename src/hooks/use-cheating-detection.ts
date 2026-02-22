import { useEffect, useRef } from "react";
import { toast } from "sonner";

export const useCheatingDetection = (
  isActive: boolean, 
  onTerminate: () => void
) => {
  const violationsRef = useRef(0);

  const addViolation = (reason: string) => {
    if (!isActive) return;

    violationsRef.current += 1;
    const currentViolations = violationsRef.current;

    if (currentViolations < 9) {
      toast.warning(`Warning (${currentViolations}/10): Cheating Detected`, {
        description: `${reason}. Please adhere to the interview rules.`,
        duration: 4000,
        className: "md:min-w-[350px] p-4 !text-base !font-semibold animate-heartbeat shadow-lg border-amber-500 bg-amber-50 text-amber-900",
      });
    } else if (currentViolations === 9) {
      toast.error("FINAL WARNING: Cheating Detected", {
        description: `${reason}. One more violation will terminate the interview.`,
        duration: 4000,
        className: "md:min-w-[380px] p-5 !text-lg !font-bold animate-heartbeat shadow-2xl border-red-500 bg-red-100 text-red-900",
      });
    } else if (currentViolations >= 10) {
      toast.error("Interview Terminated", {
        description: `Multiple violations detected (${reason}). Your session has been ended.`,
        duration: 4000,
        className: "md:min-w-[380px] p-5 !text-lg !font-bold shadow-2xl border-red-700 bg-red-600 text-white",
      });
      onTerminate();
    }
  };

  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation("Tab switch or window minimized");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isActive]);

  return { addViolation, violations: violationsRef.current };
};
