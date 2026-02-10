import { Link } from "react-router-dom";

export function TermsPage() {
  return (
    <div className="prose prose-stone max-w-none">
      <Link to="/" className="text-sm text-amber-600 hover:underline">
        ← Home
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-stone-900">Terms & Conditions</h1>
      <p className="mt-2 text-stone-600">
        This is a placeholder. Replace with your actual terms of service.
      </p>
      <p className="mt-4 text-sm text-stone-500">
        By using Meals you agree to use the platform for ordering Sri Lankan Rice & Curry from approved home-based sellers.
        Orders are subject to availability and delivery by approved riders. OTP verification is required for delivery completion.
      </p>
    </div>
  );
}
