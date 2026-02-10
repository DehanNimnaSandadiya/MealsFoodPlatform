import { Outlet, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";

const BRAND = "#006B3D";

export function RootLayout({ children }) {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] text-black">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-black" aria-label="meals">
            <BrandLogo size={36} className="shrink-0" />
          </Link>
          <nav className="flex items-center gap-6">
            <SignedOut>
              <Link to="/sign-in" className="text-sm font-semibold text-black/80 hover:text-black">
                Sign in
              </Link>
              <Link
                to="/sign-up"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                style={{ backgroundColor: BRAND }}
              >
                Sign up
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {children ?? <Outlet />}
      </main>
      {!isLanding && (
      <footer className="border-t border-black/10 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 font-display font-bold text-black" aria-label="meals">
              <BrandLogo size={28} className="shrink-0" />
            </Link>
            <div className="flex gap-6 text-sm text-black/60">
              <Link to="/terms" className="hover:text-black">Terms</Link>
              <Link to="/privacy" className="hover:text-black">Privacy</Link>
              <Link to="/apply/seller" className="hover:text-black">For sellers</Link>
              <Link to="/apply/rider" className="hover:text-black">For riders</Link>
            </div>
          </div>
          <p className="mt-4 text-sm text-black/50">
            © {new Date().getFullYear()}{" "}
            <span className="inline-flex align-middle">
              <BrandLogo size={18} className="inline-block" />
            </span>
            . Good food, good life.
          </p>
        </div>
      </footer>
      )}
    </div>
  );
}
