import { useEffect, useState } from "react";
import PageShell from "../components/layout/PageShell";
import SupplierCard from "../components/cards/SupplierCard";
import { suppliers as fallbackSuppliers } from "../data/mockData";
import { apiGet, mapSupplier } from "../lib/api";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState(fallbackSuppliers);

  useEffect(() => {
    async function load() {
      try {
        const companies = await apiGet('/companies?type=exporter');
        setSuppliers(companies.map(mapSupplier));
      } catch (error) {
        console.warn('Using fallback suppliers because API is unavailable:', error.message);
      }
    }
    load();
  }, []);

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-harvest-green shadow-sm">Verified Exporters</div>
            <h1 className="mt-4 text-5xl font-black text-harvest-green">Supplier Discovery</h1>
            <p className="mt-3 max-w-2xl text-gray-600">Find verified exporters, review capacity, markets, certifications, and products offered.</p>
          </div>
          <input className="rounded-2xl border border-gray-200 px-5 py-3" placeholder="Search suppliers..." />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map(s => <SupplierCard key={s.id} supplier={s}/>) }
        </div>
      </section>
    </PageShell>
  );
}
