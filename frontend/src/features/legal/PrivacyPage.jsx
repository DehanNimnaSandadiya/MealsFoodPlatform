import { Link } from "react-router-dom";

export function PrivacyPage() {
  return (
    <div className="prose prose-stone max-w-none">
      <Link to="/" className="text-sm text-amber-600 hover:underline">
        ← Home
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-stone-900">Privacy Policy</h1>
      <p className="mt-2 text-stone-600">
        This is a placeholder. Replace with your actual privacy policy.
      </p>
      <p className="mt-4 text-sm text-stone-500">
        We collect account and order data to provide the service. Rider contact and delivery details are shared only as needed for delivery.
        We do not sell your data. Email is used for OTP and order notifications.
      </p>
    </div>
  );
}
