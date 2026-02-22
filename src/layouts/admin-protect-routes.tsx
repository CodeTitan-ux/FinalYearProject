import { LoaderPage } from "@/routes/loader-page";
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { useDbUser } from "@/provider/user-provider";

export const AdminProtectRoutes = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const { dbUser, isLoadingDbUser } = useDbUser();

  if (!isLoaded || isLoadingDbUser) {
    return <LoaderPage />;
  }

  if (!isSignedIn) {
    return <Navigate to={"/signin"} replace />;
  }

  if (dbUser?.role !== "admin") {
    return <Navigate to={"/generate"} replace />;
  }

  return children;
};
