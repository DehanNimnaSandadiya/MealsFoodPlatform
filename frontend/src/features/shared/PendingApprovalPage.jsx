import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { api } from "../../lib/api";
import { Clock } from "lucide-react";

export function PendingApprovalPage() {
  const { getToken } = useAuth();
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get("/api/v1/auth/me", getToken),
  });

  const role = data?.data?.role ?? "";
  const status = data?.data?.approvalStatus ?? "PENDING";

  return (
    <div className="mx-auto max-w-md rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
      <div className="flex justify-center text-amber-600">
        <Clock className="h-12 w-12" />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-stone-900">
        {role === "SELLER" ? "Seller" : "Rider"} account pending
      </h1>
      <p className="mt-2 text-stone-600">
        Your account is under review. You’ll be able to use the full dashboard once an admin approves you.
        Status: <strong>{status}</strong>
      </p>
    </div>
  );
}
