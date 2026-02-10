import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Users, Store, AlertCircle, Bike, Banknote, Check, X } from "lucide-react";

const BRAND = "#006B3D";

export function AdminDashboard() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: usersData } = useQuery({
    queryKey: ["admin-users", "PENDING"],
    queryFn: () => api.get("/api/v1/admin/approvals/users?status=PENDING", getToken),
  });

  const { data: ridersData } = useQuery({
    queryKey: ["admin-riders", "PENDING"],
    queryFn: () => api.get("/api/v1/admin/approvals/users?status=PENDING", getToken),
  });

  const { data: shopsData } = useQuery({
    queryKey: ["admin-shops", "PENDING"],
    queryFn: () => api.get("/api/v1/admin/approvals/shops?status=PENDING", getToken),
  });

  const { data: complaintsData } = useQuery({
    queryKey: ["admin-complaints"],
    queryFn: () => api.get("/api/v1/admin/complaints", getToken),
  });

  const { data: revenueData } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: () => api.get("/api/v1/admin/reports/revenue", getToken),
  });

  const approveUser = useMutation({
    mutationFn: (clerkUserId) =>
      api.patch(`/api/v1/admin/approvals/users/${clerkUserId}`, {
        approvalStatus: "APPROVED",
      }, getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const rejectUser = useMutation({
    mutationFn: ({ clerkUserId, rejectionReason }) =>
      api.patch(`/api/v1/admin/approvals/users/${clerkUserId}`, {
        approvalStatus: "REJECTED",
        rejectionReason: rejectionReason || undefined,
      }, getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const approveShop = useMutation({
    mutationFn: (shopId) =>
      api.patch(`/api/v1/admin/approvals/shops/${shopId}`, {
        approvalStatus: "APPROVED",
      }, getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-shops"] }),
  });

  const rejectShop = useMutation({
    mutationFn: ({ shopId, rejectionReason }) =>
      api.patch(`/api/v1/admin/approvals/shops/${shopId}`, {
        approvalStatus: "REJECTED",
        rejectionReason: rejectionReason || undefined,
      }, getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-shops"] }),
  });

  const updateComplaint = useMutation({
    mutationFn: ({ complaintId, status, resolutionNotes }) =>
      api.patch(`/api/v1/admin/complaints/${complaintId}`, { status, resolutionNotes }, getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-complaints"] }),
  });

  const pendingRiders = (ridersData?.data ?? []).filter((u) => u.role === "RIDER");
  const pendingSellers = (usersData?.data ?? []).filter((u) => u.role === "SELLER");
  const pendingShops = shopsData?.data ?? [];
  const complaints = complaintsData?.data ?? [];
  const revenue = revenueData?.data;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-black">Admin dashboard</h1>
      <p className="mt-1 text-black/60">Approve sellers, shops, and riders. Review complaints.</p>

      {/* Revenue card */}
      {revenue !== undefined && (
        <div
          className="mt-6 rounded-2xl border border-black/5 p-5 shadow-sm"
          style={{ backgroundColor: `${BRAND}08` }}
        >
          <h2 className="flex items-center gap-2 font-semibold text-black">
            <Banknote className="h-5 w-5" style={{ color: BRAND }} /> Platform revenue (this month)
          </h2>
          <p className="mt-2 text-black/80">
            Completed orders: {revenue.orderCount ?? 0} · Gross LKR {revenue.grossLkr?.toLocaleString() ?? 0}
          </p>
          <p className="text-sm font-semibold" style={{ color: BRAND }}>
            Platform commission (10%): LKR {revenue.platformCommissionLkr?.toLocaleString() ?? 0}
          </p>
        </div>
      )}

      {/* Summary counts */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-black/60">Pending sellers</p>
          <p className="mt-1 text-2xl font-bold text-black">{pendingSellers.length}</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-black/60">Pending riders</p>
          <p className="mt-1 text-2xl font-bold text-black">{pendingRiders.length}</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-black/60">Pending shops</p>
          <p className="mt-1 text-2xl font-bold text-black">{pendingShops.length}</p>
        </div>
      </div>

      {/* Pending sellers */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-black">
          <Users className="h-5 w-5" style={{ color: BRAND }} /> Pending sellers
        </h2>
        {pendingSellers.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-black/5 bg-white p-6 text-center">
            <Users className="mx-auto h-10 w-10 text-black/20" />
            <p className="mt-3 text-black/60">No pending sellers.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {pendingSellers.map((u) => (
              <li
                key={u.clerkUserId}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
              >
                <span className="font-medium text-black/80">
                  {u.role} — {u.clerkUserId?.slice(0, 28)}…
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={approveUser.isPending}
                    onClick={() => approveUser.mutate(u.clerkUserId)}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
                    style={{ backgroundColor: BRAND }}
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={rejectUser.isPending}
                    onClick={() => {
                      const reason = window.prompt("Rejection reason (optional):");
                      if (reason !== null) rejectUser.mutate({ clerkUserId: u.clerkUserId, rejectionReason: reason.trim() || undefined });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pending riders */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-black">
          <Bike className="h-5 w-5" style={{ color: BRAND }} /> Pending riders
        </h2>
        {pendingRiders.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-black/5 bg-white p-6 text-center">
            <Bike className="mx-auto h-10 w-10 text-black/20" />
            <p className="mt-3 text-black/60">No pending riders.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {pendingRiders.map((u) => (
              <li
                key={u.clerkUserId}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
              >
                <span className="font-medium text-black/80">{u.clerkUserId?.slice(0, 28)}…</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={approveUser.isPending}
                    onClick={() => approveUser.mutate(u.clerkUserId)}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
                    style={{ backgroundColor: BRAND }}
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={rejectUser.isPending}
                    onClick={() => {
                      const reason = window.prompt("Rejection reason (optional):");
                      if (reason !== null) rejectUser.mutate({ clerkUserId: u.clerkUserId, rejectionReason: reason.trim() || undefined });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pending shops */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-black">
          <Store className="h-5 w-5" style={{ color: BRAND }} /> Pending shops
        </h2>
        {pendingShops.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-black/5 bg-white p-6 text-center">
            <Store className="mx-auto h-10 w-10 text-black/20" />
            <p className="mt-3 text-black/60">No pending shops.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {pendingShops.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
              >
                <span className="font-semibold text-black">{s.name}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={approveShop.isPending}
                    onClick={() => approveShop.mutate(s.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
                    style={{ backgroundColor: BRAND }}
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={rejectShop.isPending}
                    onClick={() => {
                      const reason = window.prompt("Rejection reason (optional):");
                      if (reason !== null) rejectShop.mutate({ shopId: s.id, rejectionReason: reason.trim() || undefined });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Complaints */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-black">
          <AlertCircle className="h-5 w-5" style={{ color: BRAND }} /> Complaints
        </h2>
        {complaints.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-black/5 bg-white p-6 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-black/20" />
            <p className="mt-3 text-black/60">No complaints.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {complaints.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-black">
                      Order #{String(c.orderId).slice(-6)} · {c.targetType}
                    </p>
                    <p className="mt-1 text-sm text-black/70">{c.message}</p>
                    <p className="mt-1 text-xs text-black/50">
                      {c.status} {c.resolutionNotes && `· ${c.resolutionNotes}`}
                    </p>
                  </div>
                  {c.status !== "RESOLVED" && c.status !== "CLOSED" && (
                    <button
                      type="button"
                      disabled={updateComplaint.isPending}
                      onClick={() => {
                        const notes = window.prompt("Resolution notes (optional):");
                        updateComplaint.mutate({
                          complaintId: c.id,
                          status: "RESOLVED",
                          resolutionNotes: notes?.trim() || undefined,
                        });
                      }}
                      className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
                      style={{ backgroundColor: BRAND }}
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
