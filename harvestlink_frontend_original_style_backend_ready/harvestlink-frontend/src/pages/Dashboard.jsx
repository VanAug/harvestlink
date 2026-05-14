import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import { products as fallbackProducts, rfqs as fallbackRFQs } from "../data/mockData";
import { apiGet, mapProduct, mapRFQ } from "../lib/api";
import { BadgeDollarSign, Handshake, LockKeyhole, PackageCheck } from "lucide-react";

export default function Dashboard({ role = "buyer" }) {
  const isBuyer = role === "buyer";
  const isExporter = role === "exporter" || role === "supplier";
  const [products, setProducts] = useState(fallbackProducts);
  const [rfqs, setRfqs] = useState(fallbackRFQs);
  const [overview, setOverview] = useState(null);
  const [eligibility, setEligibility] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [apiProducts, companies, apiRfqs, adminOverview, finance] = await Promise.all([
          apiGet('/products'),
          apiGet('/companies'),
          apiGet('/rfqs'),
          apiGet('/admin/overview'),
          apiGet('/financing/eligibility/1'),
        ]);
        setProducts(apiProducts.map((p) => mapProduct(p, companies)));
        setRfqs(apiRfqs.map(mapRFQ));
        setOverview(adminOverview);
        setEligibility(finance);
      } catch (error) {
        console.warn('Using fallback dashboard data because API is unavailable:', error.message);
      }
    }
    load();
  }, []);

  const metrics = overview ? [
    ["Products", overview.products, PackageCheck],
    ["RFQs", overview.rfqs, Handshake],
    ["Deals", overview.deals, LockKeyhole],
    ["Financing", overview.financing_requests, BadgeDollarSign],
  ] : [
    ["Active RFQs", "12", Handshake],
    ["Supplier Responses", "38", PackageCheck],
    ["Escrow Deals", "3", LockKeyhole],
    ["Capital Requests", "2", BadgeDollarSign],
  ];

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div className="rounded-[2rem] bg-harvest-green p-8 text-white shadow-soft">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold">Trade Execution Dashboard</div>
          <h1 className="mt-4 text-4xl font-black">{isBuyer ? "Buyer Dashboard" : isExporter ? "Exporter Dashboard" : "Admin Dashboard"}</h1>
          <p className="mt-2 max-w-3xl text-white/80">Manage marketplace activity, RFQs, deal rooms, escrow payments, and working capital eligibility.</p>
          {isExporter && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/exporter/profile" className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20">Company Profile</Link>
              <Link to="/exporter/products" className="rounded-2xl bg-harvest-orange px-5 py-3 text-sm font-black text-white hover:bg-orange-600">Manage Products</Link>
              <Link to="/rfqs" className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20">RFQ Matches</Link>
              <Link to="/deals" className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20">Deal Rooms</Link>
              <Link to="/products" className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20">View Marketplace</Link>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          {metrics.map(([label, value, Icon]) => (
            <div key={label} className="rounded-3xl bg-white p-6 shadow-sm">
              <Icon className="mb-3 text-harvest-orange" />
              <div className="text-3xl font-black text-harvest-green">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <section className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-black text-harvest-green">{isBuyer ? "Recent RFQs" : "RFQ Opportunities"}</h2>
            <div className="mt-5 space-y-4">
              {rfqs.slice(0, 4).map(r => <div key={r.id} className="rounded-2xl bg-harvest-soft p-4"><b>{r.product}</b><div className="text-sm text-gray-600">{r.quantity} • {r.location} • {r.status}</div></div>)}
            </div>
          </section>
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-harvest-green">Working Capital</h2>
            <p className="mt-2 text-sm text-gray-600">Based on completed deals, trade volume, and payment performance.</p>
            <div className="mt-5 rounded-3xl bg-harvest-soft p-5">
              <div className="text-sm font-bold text-gray-500">Eligible amount</div>
              <div className="mt-1 text-4xl font-black text-harvest-green">${eligibility?.financing_eligible_amount?.toLocaleString?.() || '20,000'}</div>
              <div className="mt-2 text-sm text-gray-600">Trade score: {eligibility?.trade_score || 78}</div>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-harvest-green">Featured Listings</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {products.slice(0,3).map(p => <div key={p.id} className="flex items-center gap-4 rounded-2xl bg-harvest-soft p-4"><img alt={p.name} src={p.image} className="h-14 w-14 rounded-xl object-cover"/><div><b>{p.name}</b><div className="text-sm text-gray-600">{p.country} • {p.price}</div></div></div>)}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
