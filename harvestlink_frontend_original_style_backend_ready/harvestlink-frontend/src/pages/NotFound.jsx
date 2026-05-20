import { Link } from "react-router-dom";
import { Leaf, Home } from "lucide-react";
import PageShell from "../components/layout/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-harvest-soft">
          <Leaf size={40} className="text-harvest-green" />
        </div>
        <h1 className="text-8xl font-black text-harvest-green">404</h1>
        <p className="mt-4 text-xl font-bold text-gray-700">Page not found</p>
        <p className="mt-2 text-gray-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-harvest-green px-6 py-3 font-bold text-white shadow-soft hover:bg-green-700"
        >
          <Home size={18} />
          Back to Home
        </Link>
      </main>
    </PageShell>
  );
}