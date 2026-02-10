import { Link } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "@clerk/clerk-react";
import {
  ArrowRight,
  MapPin,
  Clock,
  Shield,
  Store,
  Bike,
  Search,
  ShoppingBag,
} from "lucide-react";
import { BrandLogo } from "../../components/BrandLogo";

const BRAND = "#006B3D";

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Choose your food",
    description: "Browse home chefs and Rice & Curry spots near you.",
    icon: Search,
  },
  {
    step: "2",
    title: "Order & pay",
    description: "Checkout with wallet, card, or cash on delivery.",
    icon: ShoppingBag,
  },
  {
    step: "3",
    title: "Track & enjoy",
    description: "Real-time tracking and OTP-secured delivery.",
    icon: Clock,
  },
];

const CATEGORIES = [
  { name: "Veg", image: "/VegRiceandCurry.png", slug: "veg" },
  { name: "Non Veg", image: "/ChickenRiceandCurry.png", slug: "non-veg" },
  { name: "Special", image: "/SpecialRiceandCurry.png", slug: "special" },
];

export function LandingPage() {
  const { isSignedIn, getToken } = useAuth();
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get("/api/v1/auth/me", getToken),
    enabled: isSignedIn === true,
  });

  const role = data?.data?.role;
  const approvalStatus = data?.data?.approvalStatus;
  const showPending = (role === "SELLER" || role === "RIDER") && approvalStatus !== "APPROVED";

  return (
    <div className="min-h-screen bg-white">
      {/* Hero – full width */}
      <section className="relative min-h-[85vh] overflow-hidden bg-black md:min-h-[90vh]">
        <div className="absolute inset-0">
          <img
            src="/LandingImage.png"
            alt="Food delivery - Rice & Curry, takeout dishes from home chefs"
            className="h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-6xl flex-col justify-center px-4 py-20 text-white md:min-h-[90vh] md:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/80">
            Home chefs · Campus delivery
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Order from home chefs near you. Delivered fast.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/90">
            Authentic Rice & Curry, short eats, and more from approved kitchens. Support local, eat fresh.
          </p>

          <SignedOut>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/sign-in"
                className="btn-primary flex items-center gap-2 rounded-xl px-8 py-4 text-lg"
                style={{ backgroundColor: BRAND }}
              >
                Sign in to order
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/sign-up"
                className="btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                Sign up
              </Link>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              {showPending && (
                <Link
                  to="/pending"
                  className="rounded-xl border-2 border-red-400/60 bg-red-500/20 px-6 py-3 font-semibold text-white hover:bg-red-500/30"
                >
                  Check approval status
                </Link>
              )}
              <Link
                to={showPending ? "/pending" : "/role-redirect"}
                className="btn-primary flex items-center gap-2 rounded-xl px-8 py-4 text-lg"
                style={{ backgroundColor: BRAND }}
              >
                Go to dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
              {role === "STUDENT" && (
                <>
                  <Link to="/student/shops" className="btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/20">
                    Browse shops
                  </Link>
                </>
              )}
            </div>
          </SignedIn>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-black/5 bg-white py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-4 text-center md:justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" style={{ color: BRAND }} />
            <span className="font-medium text-black/80">Verified home chefs</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6" style={{ color: BRAND }} />
            <span className="font-medium text-black/80">Fast delivery</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6" style={{ color: BRAND }} />
            <span className="font-medium text-black/80">Campus & nearby</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#fafafa] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-widest" style={{ color: BRAND }}>
            How it works
          </p>
          <h2 className="mt-2 text-center font-display text-3xl font-bold text-black md:text-4xl">
            Order in three simple steps
          </h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon }) => (
              <div
                key={step}
                className="relative rounded-2xl border border-black/5 bg-white p-8 shadow-sm transition hover:shadow-md"
              >
                <div
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                  style={{ backgroundColor: BRAND }}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <span className="mt-6 block text-sm font-bold text-black/50">Step {step}</span>
                <h3 className="mt-1 text-xl font-bold text-black">{title}</h3>
                <p className="mt-2 text-black/70">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by category */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="font-display text-3xl font-bold text-black md:text-4xl">
            Browse by category
          </h2>
          <p className="mt-2 text-black/70">Find what you crave</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to="/student/shops"
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-black shadow-md transition hover:shadow-xl"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <span className="absolute bottom-4 left-4 right-4 font-semibold text-white">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              to="/student/shops"
              className="btn-primary inline-flex items-center gap-2"
              style={{ backgroundColor: BRAND }}
            >
              View all shops
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* For partners – Seller & Rider */}
      <section className="bg-black py-20 text-white md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-white/70">
            Join us
          </p>
          <h2 className="mt-2 text-center font-display text-3xl font-bold md:text-4xl">
            For home chefs & riders
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-white/80">
            Sell your home-cooked meals to students, or earn by delivering. Get approved and start in days.
          </p>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <Link
              to="/apply/seller"
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/5 p-8 transition hover:border-white/20 hover:bg-white/10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white transition group-hover:bg-[#006B3D]">
                <Store className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-xl font-bold">Become a seller</h3>
              <p className="mt-2 text-white/70">
                List your kitchen, set your menu, and reach students nearby. We handle payments and delivery.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 font-semibold" style={{ color: "#34d399" }}>
                Apply now <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link
              to="/apply/rider"
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/5 p-8 transition hover:border-white/20 hover:bg-white/10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white transition group-hover:bg-[#006B3D]">
                <Bike className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-xl font-bold">Become a rider</h3>
              <p className="mt-2 text-white/70">
                Deliver orders on your schedule. Earn per delivery with OTP-secured handoffs.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 font-semibold" style={{ color: "#34d399" }}>
                Apply now <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#fafafa] py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <h2 className="font-display text-3xl font-bold text-black md:text-4xl">
            Ready to order?
          </h2>
          <p className="mt-4 text-lg text-black/70">
            Sign in or create an account to browse shops and get food delivered.
          </p>
          <SignedOut>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/sign-up"
                className="btn-primary rounded-xl px-8 py-4 text-lg"
                style={{ backgroundColor: BRAND }}
              >
                Create account
              </Link>
              <Link to="/sign-in" className="btn-secondary">
                Sign in
              </Link>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="mt-8">
              <Link
                to="/role-redirect"
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg"
                style={{ backgroundColor: BRAND }}
              >
                Go to dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-white py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-black" aria-label="meals">
              <BrandLogo size={64} className="shrink-0" />
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-black/70">
              <Link to="/student/shops" className="hover:text-black">Order food</Link>
              <Link to="/apply/seller" className="hover:text-black">For sellers</Link>
              <Link to="/apply/rider" className="hover:text-black">For riders</Link>
              <Link to="/terms" className="hover:text-black">Terms</Link>
              <Link to="/privacy" className="hover:text-black">Privacy</Link>
            </nav>
          </div>
          <p className="mt-8 text-center text-sm text-black/50">
            © {new Date().getFullYear()}{" "}
            <span className="inline-flex align-middle">
              <BrandLogo size={22} className="inline-block" />
            </span>
            . Good food, good life.
          </p>
        </div>
      </footer>
    </div>
  );
}
