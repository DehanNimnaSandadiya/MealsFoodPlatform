import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import {
  UtensilsCrossed,
  LayoutDashboard,
  Store,
  ShoppingCart,
  History,
  MapPin,
  LogOut,
  Package,
  ListChecks,
  Sparkles,
  Banknote,
} from "lucide-react";
import { api } from "../lib/api";

const BRAND = "#006B3D";

function Sidebar({ logoLabel, navItems, footer }) {
  const location = useLocation();
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-black/5 bg-white shadow-sm">
      <div className="border-b border-black/5 p-5">
        <Link to="/" className="flex items-center gap-2">
          <UtensilsCrossed className="h-8 w-8" style={{ color: BRAND }} />
          <span className="font-display text-lg font-bold text-black">meals</span>
        </Link>
        <p className="mt-1 text-xs font-medium text-black/50">{logoLabel}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== "/student" && to !== "/rider" && to !== "/seller" && to !== "/admin" && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active ? "text-white shadow-sm" : "text-black/70 hover:bg-black/5"
              }`}
              style={active ? { backgroundColor: BRAND } : {}}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      {footer}
    </aside>
  );
}

const studentNav = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/shops", label: "Browse shops", icon: Store },
  { to: "/student/cart", label: "Cart", icon: ShoppingCart },
  { to: "/student/orders", label: "My orders", icon: History },
  { to: "/student/addresses", label: "Saved addresses", icon: MapPin },
];

export function StudentDashboardLayout() {
  const navigate = useNavigate();
  const footer = (
    <div className="border-t border-black/10 p-3">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-black/70 hover:bg-black/5"
      >
        <LogOut className="h-5 w-5" />
        Log out
      </button>
    </div>
  );
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-white">
      <Sidebar logoLabel="Student" navItems={studentNav} footer={footer} />
      <main className="min-w-0 flex-1 overflow-auto bg-[#fafafa] p-6">
        <Outlet />
      </main>
    </div>
  );
}

const riderNavWithPaths = [
  { to: "/rider", label: "Dashboard", icon: LayoutDashboard },
  { to: "/rider", label: "Available orders", icon: Package },
  { to: "/rider", label: "My deliveries", icon: ListChecks },
];

export function RiderDashboardLayout() {
  const navigate = useNavigate();
  const footer = (
    <div className="border-t border-black/10 p-3">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-black/70 hover:bg-black/5"
      >
        <LogOut className="h-5 w-5" />
        Log out
      </button>
    </div>
  );
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-white">
      <Sidebar logoLabel="Rider" navItems={riderNavWithPaths} footer={footer} />
      <main className="min-w-0 flex-1 overflow-auto bg-[#fafafa] p-6">
        <Outlet />
      </main>
    </div>
  );
}

const sellerNavWithPaths = [
    { to: "/seller", label: "Dashboard", icon: LayoutDashboard },
    { to: "/seller/shops", label: "My shops", icon: Store },
];

export function SellerDashboardLayout() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { data: insightsData } = useQuery({
    queryKey: ["seller-insights"],
    queryFn: () => api.get("/api/v1/seller/insights", getToken),
  });
  const firstInsight = insightsData?.data?.insights?.[0];
  const footer = (
    <>
      {firstInsight && (
        <div className="border-t border-black/10 p-3">
          <div className="rounded-lg p-3 text-sm text-white" style={{ backgroundColor: BRAND }}>
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4" />
              AI Insight
            </div>
            <p className="mt-1.5 line-clamp-2 text-white/95">{firstInsight}</p>
          </div>
        </div>
      )}
      <div className="border-t border-black/10 p-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-black/70 hover:bg-black/5"
        >
          <LogOut className="h-5 w-5" />
          Log out
        </button>
      </div>
    </>
  );
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-white">
      <Sidebar logoLabel="Seller" navItems={sellerNavWithPaths} footer={footer} />
      <main className="min-w-0 flex-1 overflow-auto bg-[#fafafa] p-6">
        <Outlet />
      </main>
    </div>
  );
}

const adminNav = [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard }];

export function AdminDashboardLayout() {
  const navigate = useNavigate();
  const footer = (
    <div className="border-t border-black/10 p-3">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-black/70 hover:bg-black/5"
      >
        <LogOut className="h-5 w-5" />
        Log out
      </button>
    </div>
  );
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-white">
      <Sidebar logoLabel="Admin" navItems={adminNav} footer={footer} />
      <main className="min-w-0 flex-1 overflow-auto bg-[#fafafa] p-6">
        <Outlet />
      </main>
    </div>
  );
}
