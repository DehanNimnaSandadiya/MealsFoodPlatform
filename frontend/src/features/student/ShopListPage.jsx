import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Store, ChevronRight, Star, Clock } from "lucide-react";

const BRAND = "#006B3D";
const DEFAULT_SHOP_IMAGE = "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80";

export function ShopListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["shops"],
    queryFn: () => api.get("/api/v1/shops"),
  });

  const shops = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-black/10" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[2/1] animate-pulse rounded-2xl bg-black/5" />
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        Failed to load shops. Try again later.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link to="/student" className="inline-flex items-center gap-1 text-sm font-semibold text-black/70 hover:text-black" style={{ color: BRAND }}>
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-black">Nearby shops</h1>
        <p className="mt-1 text-black/60">Home chefs and Rice & Curry spots near you.</p>
      </div>

      {shops.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-12 text-center">
          <Store className="mx-auto h-14 w-14 text-black/20" />
          <p className="mt-4 font-medium text-black/80">No shops available yet</p>
          <p className="mt-1 text-sm text-black/60">Check back soon or apply to become a seller.</p>
          <Link to="/apply/seller" className="mt-4 inline-block font-semibold hover:underline" style={{ color: BRAND }}>
            Become a seller
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {shops.map((s) => (
            <li key={s.id}>
              <Link
                to={`/student/shops/${s.id}`}
                className="flex gap-4 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="h-28 w-28 shrink-0 overflow-hidden bg-black/5 sm:h-32 sm:w-36">
                  <img src={DEFAULT_SHOP_IMAGE} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1 py-4 pr-4">
                  <h2 className="font-semibold text-black">{s.name}</h2>
                  <p className="mt-0.5 line-clamp-1 text-sm text-black/60">{s.address}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-black/50">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      4.5
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      25–35 min
                    </span>
                  </div>
                </div>
                <div className="flex items-center pr-4">
                  <ChevronRight className="h-5 w-5 text-black/30" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
