import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function ProtectedRoute({ children, allowedRoles }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const location = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get("/api/v1/auth/me", getToken),
    enabled: isLoaded && isSignedIn === true,
  });

  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-stone-500">Loading…</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (isLoading || !data?.data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-stone-500">Loading…</p>
      </div>
    );
  }

  const user = data.data;
  const role = user.role;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}
