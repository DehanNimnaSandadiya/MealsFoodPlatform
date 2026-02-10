import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { ORDER_STATUS_LABELS } from "../../lib/constants";
import { Package, ListChecks } from "lucide-react";
import { useState } from "react";

const BRAND = "#006B3D";

export function RiderDashboard() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [otpInput, setOtpInput] = useState({});

  const { data: availableData } = useQuery({
    queryKey: ["rider-available"],
    queryFn: () => api.get("/api/v1/rider/orders/available", getToken),
  });

  const { data: mineData } = useQuery({
    queryKey: ["rider-mine"],
    queryFn: () => api.get("/api/v1/rider/orders/mine", getToken),
  });

  const acceptOrder = useMutation({
    mutationFn: (orderId) => api.post(`/api/v1/rider/orders/${orderId}/accept`, {}, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rider-available"] });
      queryClient.invalidateQueries({ queryKey: ["rider-mine"] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, nextStatus }) =>
      api.patch(`/api/v1/rider/orders/${orderId}/status`, { nextStatus }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rider-mine"] });
    },
  });

  const deliverOrder = useMutation({
    mutationFn: ({ orderId, otp }) =>
      api.post(`/api/v1/rider/orders/${orderId}/deliver`, { otp }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rider-mine"] });
    },
  });

  const available = availableData?.data ?? [];
  const mine = mineData?.data ?? [];
  const active = mine.filter((o) => !["COMPLETED", "DELIVERED"].includes(o.status));
  const totalEarnings = mine.reduce((sum, o) => sum + (o.riderFeeLkr ?? 0), 0);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-black">Dashboard</h1>
      <p className="mt-1 text-black/60">Accept deliveries and complete with OTP.</p>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-black/60">Total earnings</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: BRAND }}>LKR {totalEarnings.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-black/60">Deliveries</p>
          <p className="mt-1 text-2xl font-bold text-black">{mine.length}</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-black">
          <Package className="h-5 w-5" style={{ color: BRAND }} /> Available orders
        </h2>
        {acceptOrder.isError && (
          <p className="mt-2 text-sm text-red-600">{acceptOrder.error?.message ?? "Accept failed."}</p>
        )}
        {available.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-black/5 bg-white p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-black/20" />
            <p className="mt-3 text-black/60">No orders ready for pickup. Check back soon.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {available.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-black">{o.shop?.name ?? "Shop"}</p>
                  <p className="mt-0.5 text-sm text-black/60">{o.deliveryAddress}</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: BRAND }}>
                    LKR {o.riderFeeLkr ?? o.totalLkr} · {o.distanceKm} km
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={acceptOrder.isPending}
                    onClick={() => acceptOrder.mutate(o.id)}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
                    style={{ backgroundColor: BRAND }}
                  >
                    {acceptOrder.isPending ? "Accepting…" : "Accept"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-black">
          <ListChecks className="h-5 w-5" style={{ color: BRAND }} /> My deliveries
        </h2>
        {active.length === 0 && mine.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-black/5 bg-white p-8 text-center">
            <ListChecks className="mx-auto h-12 w-12 text-black/20" />
            <p className="mt-3 text-black/60">No deliveries yet. Accept an order above to start.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {mine.map((o) => (
              <li key={o.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <p className="font-medium text-black">Order #{String(o.id).slice(-6)}</p>
                <p className="text-sm text-black/60">
                  {ORDER_STATUS_LABELS[o.status] ?? o.status} · {o.deliveryAddress}
                </p>
                <p className="text-sm font-medium" style={{ color: BRAND }}>
                  Fee: LKR {o.riderFeeLkr}
                </p>

                {o.status === "RIDER_ASSIGNED" && (
                  <button
                    type="button"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ orderId: o.id, nextStatus: "PICKED_UP" })}
                    className="mt-3 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
                    style={{ backgroundColor: BRAND }}
                  >
                    Mark Picked up
                  </button>
                )}
                {o.status === "PICKED_UP" && (
                  <button
                    type="button"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ orderId: o.id, nextStatus: "ON_THE_WAY" })}
                    className="mt-3 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
                    style={{ backgroundColor: BRAND }}
                  >
                    Mark On the way
                  </button>
                )}
                {o.status === "ON_THE_WAY" && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={otpInput[o.id] ?? ""}
                      onChange={(e) => setOtpInput((prev) => ({ ...prev, [o.id]: e.target.value }))}
                      className="w-28 rounded-xl border-2 border-black/10 px-3 py-2 text-center font-mono text-black focus:border-[#006B3D] focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={deliverOrder.isPending || !otpInput[o.id]}
                      onClick={() => deliverOrder.mutate({ orderId: o.id, otp: otpInput[o.id] })}
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
                      style={{ backgroundColor: BRAND }}
                    >
                      Complete delivery
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
