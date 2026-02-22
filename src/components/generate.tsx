import { Navigate, Outlet, useOutletContext } from "react-router-dom";
import { useDbUser } from "@/provider/user-provider";
import { LoaderPage } from "@/routes/loader-page";

export const Generate = () => {
  const context = useOutletContext();
  const { dbUser, isLoadingDbUser } = useDbUser();

  if (isLoadingDbUser) return <LoaderPage />;
  if (dbUser?.role === "admin") return <Navigate to="/admin" replace />;

  return (
    <div className="flex-col md:px-12">
      <Outlet context={context} />
    </div>
  );
};
