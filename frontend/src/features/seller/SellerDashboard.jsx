import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { api } from "../../lib/api";
import { Store, UtensilsCrossed, ClipboardList, Banknote, Sparkles } from "lucide-react";

const BRAND = "#006B3D";

export function SellerDashboard() {
  const { getToken } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["seller-shops"],
    queryFn: () => api.get("/api/v1/shops/mine", getToken),
  });

  const { data: earningsData } = useQuery({
    queryKey: ["seller-earnings-summary"],
    queryFn: () => api.get("/api/v1/seller/earnings/summary", getToken),
  });

  const { data: insightsData } = useQuery({
    queryKey: ["seller-insights"],
    queryFn: () => api.get("/api/v1/seller/insights", getToken),
  });

  const shops = data?.data ?? [];
  const approvedShop = shops.find((s) => s.approvalStatus === "APPROVED");
  const earnings = earningsData?.data;
  const insights = insightsData?.data; // { insights: string[], summary?: { periodDays, orderCount } }

  if (isLoading) {
    return <p className="text-black/60">Loading…</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-black">Dashboard</h1>
      <p className="mt-1 text-black/60">Manage your shop, meals, and orders.</p>

      {earnings !== undefined && (
        <div className="mt-6 rounded-xl border border-black/10 p-4" style={{ backgroundColor: `${BRAND}0c` }}>
          <h2 className="flex items-center gap-2 font-medium text-black">
            <Banknote className="h-5 w-5" style={{ color: BRAND }} /> Earnings & commission (this month)
          </h2>
          <p className="mt-2 text-black/80">
            Gross: LKR {earnings.grossLkr?.toLocaleString() ?? 0} · Orders: {earnings.orderCount ?? 0}
          </p>
          <p className="text-sm font-medium" style={{ color: BRAND }}>
            10% commission due: LKR {earnings.commissionLkr?.toLocaleString() ?? 0}
          </p>
        </div>
      )}

      {insights !== undefined && shops.some((s) => s.approvalStatus === "APPROVED") && (
        <div className="mt-6 rounded-xl border border-black/10 p-4" style={{ backgroundColor: `${BRAND}0c` }}>
          <h2 className="flex items-center gap-2 font-medium text-black">
            <Sparkles className="h-5 w-5" style={{ color: BRAND }} /> AI insights from your sales
          </h2>
          <p className="mt-1 text-sm text-black/60">
            Based on the last {insights?.summary?.periodDays ?? 30} days of completed orders.
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-black/80">
            {(insights?.insights ?? []).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          {insights?.summary?.orderCount === 0 && (
            <p className="mt-2 text-xs text-black/60">Complete more orders to get richer insights.</p>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/seller/shops"
          className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-6 shadow-sm transition hover:border-[#006B3D]/30 hover:shadow-md"
        >
          <div className="rounded-lg p-3" style={{ backgroundColor: `${BRAND}18` }}>
            <Store className="h-6 w-6" style={{ color: BRAND }} />
          </div>
          <div>
            <h2 className="font-medium text-black">My shops</h2>
            <p className="text-sm text-black/60">{shops.length} shop(s)</p>
          </div>
        </Link>
        {approvedShop && (
          <>
            <Link
              to={`/seller/shops/${approvedShop.id}/meals`}
              className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-6 shadow-sm transition hover:border-[#006B3D]/30 hover:shadow-md"
            >
              <div className="rounded-lg p-3" style={{ backgroundColor: `${BRAND}18` }}>
                <UtensilsCrossed className="h-6 w-6" style={{ color: BRAND }} />
              </div>
              <div>
                <h2 className="font-medium text-black">Meals</h2>
                <p className="text-sm text-black/60">Manage menu</p>
              </div>
            </Link>
            <Link
              to={`/seller/shops/${approvedShop.id}/orders`}
              className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-6 shadow-sm transition hover:border-[#006B3D]/30 hover:shadow-md"
            >
              <div className="rounded-lg p-3" style={{ backgroundColor: `${BRAND}18` }}>
                <ClipboardList className="h-6 w-6" style={{ color: BRAND }} />
              </div>
              <div>
                <h2 className="font-medium text-black">Orders</h2>
                <p className="text-sm text-black/60">Accept & update status</p>
              </div>
            </Link>
          </>
        )}
      </div>

      {shops.length === 0 && (
        <p className="mt-6 text-black/60">Create a shop first from the apply flow or admin.</p>
      )}
    </div>
  );
}
