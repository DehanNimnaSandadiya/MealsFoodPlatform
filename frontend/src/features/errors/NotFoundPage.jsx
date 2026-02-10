import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <FileQuestion className="h-16 w-16 text-stone-300" />
      <h1 className="mt-4 text-2xl font-semibold text-stone-900">Page not found</h1>
      <p className="mt-2 text-stone-600">The page you’re looking for doesn’t exist.</p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700"
      >
        Go home
      </Link>
    </div>
  );
}
