import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export function AccessDeniedPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <ShieldAlert className="h-16 w-16 text-amber-500" />
      <h1 className="mt-4 text-2xl font-semibold text-stone-900">Access denied</h1>
      <p className="mt-2 text-stone-600">You don’t have permission to view this page.</p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700"
      >
        Go home
      </Link>
    </div>
  );
}
