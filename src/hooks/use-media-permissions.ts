import { useState, useEffect } from "react";

export const useMediaPermissions = () => {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      // If successful, stop the tracks immediately as we just needed to check permissions
      stream.getTracks().forEach((track) => track.stop());
      setHasPermissions(true);
    } catch (err) {
      console.error("Permission denied:", err);
      // Determine error message based on error name
      let errorMessage = "Access denied. Please check your browser settings.";
      if (err instanceof DOMException) {
          if (err.name === "NotAllowedError") {
              errorMessage = "Microphone or Camera access was denied. Please allow access in your browser settings URL bar.";
          } else if (err.name === "NotFoundError") {
              errorMessage = "No microphone or camera found on this device.";
          } else if (err.name === "NotReadableError") {
              errorMessage = "Your microphone or camera is already in use by another application.";
          }
      }
      setError(errorMessage);
      setHasPermissions(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
     // Check immediately on mount if we already have permissions (optional, but good UX)
     // However, navigator.permissions.query for 'camera' isn't supported in all browsers (Firefox).
     // getUserMedia is the most reliable cross-browser way, but prompts user.
     // We'll rely on explicit user action to request permissions to avoid prompting on load if undesired.
     // Or we can try to get them if they were already granted? 
     // For now, let's force the check/prompt flow.
  }, []);

  return { hasPermissions, error, isLoading, requestPermissions };
};
