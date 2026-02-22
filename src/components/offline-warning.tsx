import { useEffect, useState } from "react";
import { WifiOff, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const OfflineWarning = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <div className="max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto">
        <Alert className="bg-rose-50 border-rose-200 shadow-xl flex flex-col items-center text-center p-6 rounded-2xl gap-3">
          <div className="bg-rose-100 p-3 rounded-full">
            <WifiOff className="h-8 w-8 text-rose-600" />
          </div>
          <div>
            <AlertTitle className="text-lg font-bold text-rose-900 mb-2">
              No Internet Connection
            </AlertTitle>
            <AlertDescription className="text-rose-700/90 leading-relaxed font-medium">
              <p className="mb-4">
                This project requires an active internet connection to communicate securely with authentication servers, cloud databases, and AI extraction models.
              </p>
              <div className="flex items-center justify-center gap-2 text-rose-800 bg-rose-100/50 py-2 px-4 rounded-lg text-sm border border-rose-200/50">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Please reconnect to Wi-Fi to continue.</span>
              </div>
            </AlertDescription>
          </div>
        </Alert>
      </div>
    </div>
  );
};
