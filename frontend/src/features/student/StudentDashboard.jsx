import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import {
  Search,
  Store,
  ShoppingCart,
  History,
  MapPin,
  ArrowRight,
  Clock,
  Star,
} from "lucide-react";

const BRAND = "#006B3D";
const DEFAULT_SHOP_IMAGE = "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80";

export function StudentDashboard() {
  const { data } = useQuery({
    queryKey: ["shops"],
    queryFn: () => api.get("/api/v1/shops"),
  });
  const shops = (data?.data ?? []).slice(0, 6);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Greeting + search */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-black md:text-3xl">
          Good food, delivered
        </h1>
        <p className="mt-1 text-black/60">Browse home chefs and order Rice & Curry to your door.</p>
        <Link
          to="/student/shops"
          className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-black/10 bg-white px-4 py-3 text-left text-black/60 transition hover:border-black/20 hover:bg-black/[0.02]"
        >
          <Search className="h-5 w-5 shrink-0 text-black/40" />
          <span>Search for shops or dishes...</span>
          <ArrowRight className="ml-auto h-5 w-5 text-black/40" />
        </Link>
      </div>

      {/* Quick actions */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          to="/student/shops"
          className="flex flex-col items-center rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ backgroundColor: BRAND }}>
            <Store className="h-6 w-6" />
          </div>
          <span className="mt-3 text-sm font-semibold text-black">Browse shops</span>
        </Link>
        <Link
          to="/student/cart"
          className="flex flex-col items-center rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/5">
            <ShoppingCart className="h-6 w-6 text-black" />
          </div>
          <span className="mt-3 text-sm font-semibold text-black">Cart</span>
        </Link>
        <Link
          to="/student/orders"
          className="flex flex-col items-center rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/5">
            <History className="h-6 w-6 text-black" />
          </div>
          <span className="mt-3 text-sm font-semibold text-black">My orders</span>
        </Link>
        <Link
          to="/student/addresses"
          className="flex flex-col items-center rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/5">
            <MapPin className="h-6 w-6 text-black" />
          </div>
          <span className="mt-3 text-sm font-semibold text-black">Addresses</span>
        </Link>
      </div>

      {/* Nearby / featured shops */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-black">Near you</h2>
          <Link
            to="/student/shops"
            className="text-sm font-semibold hover:underline"
            style={{ color: BRAND }}
          >
            See all
          </Link>
        </div>
        {shops.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-black/5 bg-white p-8 text-center">
            <Store className="mx-auto h-12 w-12 text-black/20" />
            <p className="mt-3 text-black/60">No shops available yet. Check back soon.</p>
            <Link
              to="/apply/seller"
              className="mt-3 inline-block text-sm font-semibold hover:underline"
              style={{ color: BRAND }}
            >
              Become a seller
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((s) => (
              <Link
                key={s.id}
                to={`/student/shops/${s.id}`}
                className="group overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-black/5">
                  <img
                    src={DEFAULT_SHOP_IMAGE}
                    alt=""
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  <span className="absolute right-2 top-2 rounded-lg bg-white/95 px-2 py-1 text-xs font-semibold shadow">
                    Open
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-black">{s.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-black/60">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    4.5 · Rice & Curry
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-black/50">
                    <Clock className="h-3.5 w-3.5" />
                    25–35 min
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Partner CTA */}
      <div className="mt-10 rounded-2xl border border-black/5 bg-white p-6">
        <p className="font-semibold text-black">Want to sell or deliver?</p>
        <p className="mt-1 text-sm text-black/60">Join as a home chef or rider and start earning.</p>
        <div className="mt-4 flex gap-4">
          <Link
            to="/apply/seller"
            className="text-sm font-semibold hover:underline"
            style={{ color: BRAND }}
          >
            Become a seller
          </Link>
          <Link
            to="/apply/rider"
            className="text-sm font-semibold hover:underline"
            style={{ color: BRAND }}
          >
            Become a rider
          </Link>
        </div>
      </div>
    </div>
  );
}
