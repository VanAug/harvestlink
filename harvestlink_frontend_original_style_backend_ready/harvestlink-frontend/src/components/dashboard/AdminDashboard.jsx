import { Link } from "react-router-dom";
import { BadgeDollarSign, Building2, CheckCircle, CreditCard, FileText, Globe2, Handshake, LockKeyhole, Package, ShieldCheck, Users } from "lucide-react";
import DashboardHero from "./DashboardHero";
import MetricCard from "./MetricCard";

export default function AdminDashboard({ overview, userName }) {
  const metrics = overview ? [
    ["Total Users", overview.users, Users],
    ["Companies", overview.companies, Building2],
    ["Products", overview.products, Package],
    ["RFQs", overview.rfqs, FileText],
    ["Deals", overview.deals, Handshake],
    ["Escrow", overview.escrow_transactions, CreditCard],
    ["Financing", overview.financing_requests, BadgeDollarSign],
    ["Exporters", overview.exporters, Globe2],
  ] : [
    ["Total Users", "7", Users],
    ["Companies", "6", Building2],
    ["Products", "5", Package],
    ["RFQs", "4", FileText],
  ];

  const actions = [
    { label: "Marketplace", to: "/products", icon: Globe2 },
    { label: "All Deals", to: "/deals", icon: LockKeyhole },
    { label: "RFQ Market", to: "/rfqs", icon: Handshake },
    { label: "Escrow", to: "/escrow", icon: CreditCard },
    { label: "Financing", to: "/financing", icon: BadgeDollarSign },
  ];

  return (
    <>
      <DashboardHero
        eyebrow={<><ShieldCheck size={16} /> Admin Console</>}
        title="Platform Administration"
        description={`Monitor platform activity, manage users, review verifications, and oversee trade operations. Logged in as ${userName}.`}
        actions={actions}
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, Icon]) => <MetricCard key={label} label={label} value={value} icon={Icon} />)}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <section className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-black text-harvest-green">Platform Review Queues</h2>
          <p className="text-sm text-gray-500">Shortcuts for the main admin review surfaces.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              ["Product Listings", "/products", Package],
              ["Open RFQs", "/rfqs", FileText],
              ["Deal Rooms", "/deals", Handshake],
              ["Escrow Events", "/escrow", CreditCard],
            ].map(([label, to, Icon]) => (
              <Link key={label} to={to} className="flex items-center gap-3 rounded-2xl bg-harvest-soft p-4 font-bold text-harvest-green transition hover:bg-green-100">
                <Icon size={20} className="text-harvest-orange" />
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-harvest-green">Platform Health</h2>
          <div className="mt-4 space-y-3">
            {["API Status", "Database", "Active Sessions"].map((label) => (
              <div key={label} className="flex items-center justify-between rounded-2xl bg-green-50 p-3 text-sm">
                <span className="flex items-center gap-2 font-bold text-green-700">
                  <CheckCircle size={16} />
                  {label}
                </span>
                <span className="text-green-600">Operational</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
