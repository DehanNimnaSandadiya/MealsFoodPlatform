import { SignUp } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../../components/BrandLogo";

const BRAND = "#006B3D";

export function SignUpPage() {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const afterSignUpUrl = base ? `${base}/role-redirect` : "/role-redirect";

  return (
    <div className="grid min-h-[calc(100vh-8rem)] md:grid-cols-2">
      {/* Left: branding */}
      <div className="relative hidden flex-col justify-between bg-black p-8 text-white md:flex md:p-10">
        <div>
          <Link to="/" className="inline-flex items-center gap-2" aria-label="meals">
            <BrandLogo size={40} className="shrink-0" />
          </Link>
          <p className="mt-1 text-sm text-white/70">good food good life.</p>
        </div>
        <div className="mt-12 flex-1">
          <div className="aspect-[4/3] max-h-80 w-full overflow-hidden rounded-lg bg-white/10">
            <img
              src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80"
              alt="Sustainable meals"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="mt-6 text-lg font-medium text-white">
            Fuel your studies with sustainable meals.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex flex-col justify-center bg-white px-6 py-8 md:px-12">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold text-black">Create an account</h1>
          <p className="mt-1 text-sm text-black/60">
            Join{" "}
            <span className="inline-flex align-middle">
              <BrandLogo size={18} className="inline-block" />
            </span>{" "}
            to order from home chefs near you
          </p>
          <div className="mt-8 [&_.cl-rootBox]:w-full [&_.cl-card]:shadow-none [&_.cl-card]:border [&_.cl-card]:border-black/10">
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              afterSignUpUrl={afterSignUpUrl}
              appearance={{
                variables: { colorPrimary: BRAND },
                elements: {
                  formButtonPrimary: { backgroundColor: BRAND },
                  footerActionLink: { color: BRAND },
                },
              }}
            />
          </div>
          <p className="mt-6 text-center text-sm text-black/60">
            Already have an account?{" "}
            <Link to="/sign-in" className="font-medium hover:underline" style={{ color: BRAND }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
