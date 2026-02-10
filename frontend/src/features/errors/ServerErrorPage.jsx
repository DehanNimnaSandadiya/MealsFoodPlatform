import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export function ServerErrorPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <AlertCircle className="h-16 w-16 text-red-400" />
      <h1 className="mt-4 text-2xl font-semibold text-stone-900">Something went wrong</h1>
      <p className="mt-2 text-stone-600">We’re sorry. Please try again later.</p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700"
      >
        Go home
      </Link>
    </div>
  );
}
