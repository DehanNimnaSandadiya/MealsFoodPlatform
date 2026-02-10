import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { api } from "../../lib/api";
import { ORDER_STATUS_LABELS } from "../../lib/constants";
import { Package } from "lucide-react";

export function StudentOrdersPage() {
  const { getToken } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["student-orders"],
    queryFn: () => api.get("/api/v1/orders/mine", getToken),
  });

  const orders = data?.data ?? [];

  if (isLoading) return <p className="text-stone-500">Loading…</p>;

  return (
    <div>
      <Link to="/student" className="text-sm text-amber-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-stone-900">My orders</h1>
      {orders.length === 0 ? (
        <p className="mt-4 text-stone-500">No orders yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                to={`/student/orders/${o.id}`}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 transition hover:border-amber-200"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-stone-900">
                      Order #{String(o.id).slice(-6)}
                    </p>
                    <p className="text-sm text-stone-500">
                      {ORDER_STATUS_LABELS[o.status] ?? o.status} · LKR {o.totalLkr}
                    </p>
                  </div>
                </div>
                <span className="text-amber-600">View →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
