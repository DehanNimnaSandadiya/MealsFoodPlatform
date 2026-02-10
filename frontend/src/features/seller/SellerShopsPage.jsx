import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { api } from "../../lib/api";
import { Store } from "lucide-react";

export function SellerShopsPage() {
  const { getToken } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["seller-shops"],
    queryFn: () => api.get("/api/v1/shops/mine", getToken),
  });

  const shops = data?.data ?? [];

  if (isLoading) return <p className="text-stone-500">Loading…</p>;

  return (
    <div>
      <Link to="/seller" className="text-sm text-amber-600 hover:underline">
        ← Dashboard
      </Link>
      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">My shops</h1>
        <Link
          to="/seller/shops/new"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Create shop
        </Link>
      </div>
      {shops.length === 0 ? (
        <p className="mt-4 text-stone-500">No shops yet. Create one to get started.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {shops.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <Store className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-stone-900">{s.name}</p>
                  <p className="text-sm text-stone-500">{s.approvalStatus}</p>
                </div>
              </div>
              {s.approvalStatus === "APPROVED" && (
                <div className="flex gap-3">
                  <Link
                    to={`/seller/shops/${s.id}/meals`}
                    className="text-sm text-amber-600 hover:underline"
                  >
                    Meals
                  </Link>
                  <Link
                    to={`/seller/shops/${s.id}/flash-deals`}
                    className="text-sm text-amber-600 hover:underline"
                  >
                    Flash deals
                  </Link>
                  <Link
                    to={`/seller/shops/${s.id}/orders`}
                    className="text-sm text-amber-600 hover:underline"
                  >
                    Orders
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
