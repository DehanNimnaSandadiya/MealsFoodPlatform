import { Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { getRoleHome } from "../lib/constants";

export function RoleRedirect() {
  const { getToken } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get("/api/v1/auth/me", getToken),
  });

  if (isLoading || !data?.data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-stone-500">Loading…</p>
      </div>
    );
  }

  const role = data.data.role;
  const approvalStatus = data.data.approvalStatus;

  if (role === "SELLER" && approvalStatus !== "APPROVED") return <Navigate to="/pending" replace />;
  if (role === "RIDER" && approvalStatus !== "APPROVED") return <Navigate to="/pending" replace />;

  const home = getRoleHome(role);
  return <Navigate to={home} replace />;
}
