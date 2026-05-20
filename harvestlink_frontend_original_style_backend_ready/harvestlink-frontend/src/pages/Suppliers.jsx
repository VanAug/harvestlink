import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/layout/PageShell";
import SupplierCard from "../components/cards/SupplierCard";
import SkeletonCard from "../components/SkeletonCard";
import { suppliers as fallbackSuppliers } from "../data/mockData";
import { apiGet, mapSupplier } from "../lib/api";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState(fallbackSuppliers);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const companies = await apiGet('/companies?type=exporter');
        setSuppliers(companies.map(mapSupplier));
      } catch (error) {
        console.warn('Using fallback suppliers because API is unavailable:', error.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery) return suppliers;
    const q = searchQuery.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        s.products.some((p) => p.toLowerCase().includes(q))
    );
  }, [suppliers, searchQuery]);

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-harvest-green shadow-sm">Verified Exporters</div>
            <h1 className="mt-4 text-5xl font-black text-harvest-green">Supplier Discovery</h1>
            <p className="mt-3 max-w-2xl text-gray-600">Find verified exporters, review capacity, markets, certifications, and products offered.</p>
          </div>
          <input
            className="rounded-2xl border border-gray-200 px-5 py-3"
            placeholder="Search suppliers by name, country, or products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="mb-4 text-sm text-gray-500">
          {loading ? "Loading suppliers..." : `Showing ${filtered.length} suppliers`}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <SkeletonCard count={6} />
          ) : filtered.length > 0 ? (
            filtered.map((s) => <SupplierCard key={s.id} supplier={s} />)
          ) : (
            <div className="col-span-full rounded-2xl bg-gray-50 p-8 text-center">
              <p className="font-bold text-gray-500">No suppliers match your search</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 rounded-xl bg-harvest-green px-4 py-2 text-sm font-bold text-white"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}