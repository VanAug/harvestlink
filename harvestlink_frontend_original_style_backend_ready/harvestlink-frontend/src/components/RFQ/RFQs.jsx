import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../layout/PageShell";
import RFQCard from "../cards/RFQCard";
import SkeletonCard from "../SkeletonCard";
import { rfqs as fallbackRFQs } from "../../data/mockData";
import { apiGet, mapRFQ } from "../../lib/api";

const STATUS_OPTIONS = ["all", "open", "awarded", "closed"];

export default function RFQs() {
  const [rfqs, setRfqs] = useState(fallbackRFQs);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet("/rfqs");
        setRfqs(data.map(mapRFQ));
      } catch (error) {
        console.warn("Using fallback RFQs because API is unavailable:", error.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(rfqs.map((r) => r.category || r.product_category).filter(Boolean))];
    return ["all", ...cats];
  }, [rfqs]);

  const filtered = useMemo(() => {
    let results = rfqs;

    if (status !== "all") {
      results = results.filter((r) => r.status === status);
    }

    if (selectedCategory !== "all") {
      results = results.filter(
        (r) => (r.category || r.product_category) === selectedCategory
      );
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter((r) =>
        [r.product, r.product_name, r.location, r.destination_country, r.buyer_name]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return results;
  }, [rfqs, status, selectedCategory, query]);

  return (
    <PageShell>
      <section className="bg-harvest-cream">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-harvest-green shadow-sm">
                Buyer Demand
              </div>
              <h1 className="mt-4 text-5xl font-black text-harvest-green">RFQ Market</h1>
              <p className="mt-3 max-w-2xl text-gray-600">
                Respond to real buyer requests, submit offers, and convert demand into deal rooms.
              </p>
            </div>
            <Link
              to="/create-rfq"
              className="rounded-2xl bg-harvest-green px-6 py-3 text-center font-bold text-white shadow-soft"
            >
              Create RFQ
            </Link>
          </div>

          {/* Search + filters */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm outline-none focus:border-harvest-green"
              placeholder="Search product, destination, buyer..."
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-harvest-green"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-harvest-green"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All categories" : c}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            {loading ? "Loading RFQs..." : `${filtered.length} RFQ${filtered.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-2 lg:grid-cols-3 lg:px-6">
        {loading ? (
          <SkeletonCard count={6} />
        ) : filtered.length === 0 ? (
          <div className="col-span-3 rounded-3xl bg-white p-10 text-center text-gray-500 shadow-sm">
            <p className="text-lg font-bold">No RFQs match your filters.</p>
            <p className="mt-2 text-sm">Try adjusting your search or status filter.</p>
          </div>
        ) : (
          filtered.map((r) => <RFQCard key={r.id} rfq={r} />)
        )}
      </section>
    </PageShell>
  );
}
