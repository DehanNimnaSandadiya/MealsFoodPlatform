import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { api } from "../../lib/api";
import { Bike } from "lucide-react";

export function ApplyRiderPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get("/api/v1/auth/me", getToken),
  });
  const role = meData?.data?.role;
  const approvalStatus = meData?.data?.approvalStatus;

  const apply = useMutation({
    mutationFn: () => api.post("/api/v1/apply/rider", {}, getToken),
    onSuccess: () => {
      navigate("/pending", { replace: true });
    },
  });

  if (role === "RIDER") {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-stone-200 bg-white p-8 shadow-sm text-center">
        <p className="text-stone-700">You&apos;re already a rider.</p>
        <Link
          to={approvalStatus === "APPROVED" ? "/rider" : "/pending"}
          className="mt-4 inline-block text-amber-600 hover:underline"
        >
          Go to {approvalStatus === "APPROVED" ? "rider dashboard" : "pending status"}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
      <div className="flex justify-center text-amber-600">
        <Bike className="h-12 w-12" />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-stone-900">Become a rider</h1>
      <p className="mt-2 text-stone-600">
        Deliver orders for approved sellers. After you apply, an admin will review your account.
        Once approved, you can accept deliveries and earn per km.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          disabled={apply.isPending}
          onClick={() => apply.mutate()}
          className="w-full rounded-lg bg-amber-600 py-2.5 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {apply.isPending ? "Applying…" : "Apply as rider"}
        </button>
        {apply.isError && (
          <p className="text-sm text-red-600">{apply.error.message}</p>
        )}
        <Link
          to="/"
          className="block text-center text-sm text-stone-500 hover:text-stone-700"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
