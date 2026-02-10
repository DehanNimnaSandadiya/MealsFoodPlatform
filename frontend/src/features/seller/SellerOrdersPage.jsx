import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { api } from "../../lib/api";
import { ORDER_STATUS_LABELS } from "../../lib/constants";

const NEXT_STATUS = {
  PLACED: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY_FOR_PICKUP",
  READY_FOR_PICKUP: null,
  RIDER_ASSIGNED: null,
  PICKED_UP: null,
  ON_THE_WAY: null,
  DELIVERED: "COMPLETED",
  COMPLETED: null,
};

export function SellerOrdersPage() {
  const { shopId } = useParams();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["seller-orders", shopId],
    queryFn: () => api.get(`/api/v1/seller/shops/${shopId}/orders`, getToken),
    enabled: !!shopId,
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, nextStatus }) =>
      api.patch(`/api/v1/seller/orders/${orderId}/status`, { nextStatus }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-orders", shopId] });
    },
  });

  const orders = data?.data ?? [];

  if (isLoading) return <p className="text-stone-500">Loading…</p>;

  return (
    <div>
      <Link to="/seller" className="text-sm text-amber-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-stone-900">Orders</h1>
      <p className="text-stone-600">Shop ID: {shopId}</p>
      {orders.length === 0 ? (
        <p className="mt-4 text-stone-500">No orders yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => {
            const next = NEXT_STATUS[o.status];
            return (
              <li
                key={o.id}
                className="rounded-xl border border-stone-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-stone-900">Order #{String(o.id).slice(-6)}</p>
                    <p className="text-sm text-stone-500">
                      {ORDER_STATUS_LABELS[o.status] ?? o.status} · LKR {o.totalLkr}
                    </p>
                  </div>
                  {next && (
                    <button
                      type="button"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ orderId: o.id, nextStatus: next })}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      Mark {ORDER_STATUS_LABELS[next] ?? next}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
