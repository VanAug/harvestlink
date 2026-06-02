import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeDollarSign, Building2, FileText, Globe2, Handshake, LockKeyhole, PackageCheck } from "lucide-react";
import DashboardHero from "./DashboardHero";
import MetricCard from "./MetricCard";
import { apiGet, mapRFQ } from "../../lib/api";

export default function ExporterDashboard({ metrics, rfqs, products, eligibility }) {
  const [myOfferedRfqs, setMyOfferedRfqs] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet("/exporter/rfqs-with-offers");
        setMyOfferedRfqs(data.map(mapRFQ));
      } catch (e) {
        // ignore — fallback to empty
      }
    }
    load();
  }, []);

  const actions = [
    { label: "Manage Products", to: "/exporter/products", primary: true },
    { label: "Company Profile", to: "/exporter/profile" },
    { label: "RFQ Matches", to: "/rfqs" },
    { label: "Deal Rooms", to: "/deals" },
    { label: "Marketplace", to: "/products" },
  ];

  return (
    <>
      <DashboardHero
        eyebrow="Trade Execution Dashboard"
        title="Exporter Dashboard"
        description="Manage product listings, respond to RFQs, track deals, and access working capital."
        actions={actions}
      />

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        {metrics.map(([label, value, Icon]) => <MetricCard key={label} label={label} value={value} icon={Icon} />)}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <section className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="flex items-center gap-2 text-xl font-black text-harvest-green"><FileText size={20} /> RFQ Opportunities</h2>
          <div className="mt-5 space-y-4">
            {rfqs.slice(0, 4).map((rfq) => (
              <Link key={rfq.id} to={`/rfqs/${rfq.id}`} className="block rounded-2xl bg-harvest-soft p-4 transition hover:shadow-sm">
                <b className="text-harvest-green">{rfq.product}</b>
                <div className="text-sm text-gray-600">{rfq.quantity} - {rfq.location} - {rfq.status}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-black text-harvest-green"><BadgeDollarSign size={20} /> Working Capital</h2>
          <p className="mt-2 text-sm text-gray-600">Based on completed deals, trade volume, and payment performance.</p>
          <div className="mt-5 rounded-3xl bg-harvest-soft p-5">
            <div className="text-sm font-bold text-gray-500">Eligible amount</div>
            <div className="mt-1 text-4xl font-black text-harvest-green">${eligibility?.financing_eligible_amount?.toLocaleString?.() || "20,000"}</div>
            <div className="mt-2 text-sm text-gray-600">Trade score: {eligibility?.trade_score || 78}</div>
          </div>
        </section>
      </div>

      {/* RFQs with offers section — shows RFQs this exporter has submitted offers for */}
      <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-xl font-black text-harvest-green"><Building2 size={20} /> My Submitted Offers</h2>
        {myOfferedRfqs.length > 0 ? (
          <div className="mt-5 space-y-4">
            {myOfferedRfqs.map((rfq) => (
              <Link key={rfq.id} to={`/rfqs/${rfq.id}`} className="block rounded-2xl bg-harvest-soft p-4 transition hover:shadow-sm">
                <b className="text-harvest-green">{rfq.product}</b>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                  <span>Buyer: {rfq.buyer_company_name}</span>
                  <span>·</span>
                  <span>{rfq.quantity}</span>
                  <span>·</span>
                  <span>{rfq.location}</span>
                  <span>·</span>
                  <span className="font-semibold">{rfq.status}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-harvest-soft p-5 text-sm text-gray-600">
            You haven't submitted any offers yet. Browse <Link to="/rfqs" className="font-bold text-harvest-green underline">RFQs</Link> to get started.
          </div>
        )}
      </section>

      <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-xl font-black text-harvest-green"><Globe2 size={20} /> Featured Listings</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {products.slice(0, 3).map((product) => (
            <div key={product.id} className="flex items-center gap-4 rounded-2xl bg-harvest-soft p-4 transition hover:shadow-sm">
              <img alt={product.name} src={product.image} className="h-14 w-14 rounded-xl object-cover" />
              <div>
                <b className="text-harvest-green">{product.name}</b>
                <div className="text-sm text-gray-600">{product.country} - {product.price}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export const exporterFallbackMetrics = [
  ["Active RFQs", "12", Handshake],
  ["Supplier Responses", "38", PackageCheck],
  ["Escrow Deals", "3", LockKeyhole],
  ["Capital Requests", "2", BadgeDollarSign],
];
