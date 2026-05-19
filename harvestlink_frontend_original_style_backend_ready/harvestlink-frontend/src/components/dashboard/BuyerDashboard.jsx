import { Link } from "react-router-dom";
import { ArrowRight, Building2, FileText, Globe2, Package, ShieldCheck, ShoppingBag, UserCheck } from "lucide-react";
import DashboardHero from "./DashboardHero";
import MetricCard from "./MetricCard";

export default function BuyerDashboard({ userName, company, metrics, myRfqs, myDeals, products }) {
  const actions = [
    { label: "Post New RFQ", to: "/create-rfq", icon: FileText, primary: true },
    { label: "My Profile", to: "/buyer/profile", icon: Building2 },
    { label: "Browse Products", to: "/products", icon: Globe2 },
    { label: "RFQ Market", to: "/rfqs", icon: ShoppingBag },
    { label: "My Orders", to: "/deals", icon: Package },
  ];

  return (
    <>
      <DashboardHero
        eyebrow={<><UserCheck size={16} /> Welcome back, {userName}</>}
        title="Your Sourcing Dashboard"
        description="Track your RFQs, manage orders, and discover new suppliers all in one place."
        actions={actions}
      >
        {company && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold">
              <Building2 size={16} />
              {company.name}
            </span>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold">
              <ShieldCheck size={16} />
              {company.verification_status === "verified" ? "Verified Buyer" : company.verification_status}
            </span>
          </div>
        )}
      </DashboardHero>

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        {metrics.map(([label, value, Icon]) => <MetricCard key={label} label={label} value={value} icon={Icon} />)}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <section className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-harvest-green">My Recent RFQs</h2>
            <Link to="/create-rfq" className="text-sm font-bold text-harvest-leaf hover:underline">Create New</Link>
          </div>
          {myRfqs.length > 0 ? (
            <div className="mt-5 space-y-3">
              {myRfqs.slice(0, 3).map((rfq) => (
                <Link key={rfq.id} to={`/rfqs/${rfq.id}`} className="block rounded-2xl bg-harvest-soft p-4 transition hover:shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <b className="text-harvest-green">{rfq.product_name || rfq.product}</b>
                      <div className="flex flex-wrap gap-x-4 text-sm text-gray-600">
                        <span>{rfq.destination_country || rfq.location}</span>
                        <span>{rfq.quantity} {rfq.unit}</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">{rfq.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={FileText} title="No RFQs yet" text="Post your first RFQ to start receiving supplier quotes." action="Create RFQ" to="/create-rfq" />
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-harvest-green">Quick Actions</h2>
          <div className="mt-5 space-y-3">
            {actions.slice(0, 4).map(({ label, to, icon: Icon }) => (
              <Link key={label} to={to} className="flex items-center gap-3 rounded-2xl bg-harvest-soft p-4 font-bold text-harvest-green transition hover:bg-green-100">
                <Icon size={20} className="text-harvest-orange" />
                {label}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-harvest-green">My Active Orders</h2>
            <p className="text-sm text-gray-500">Ongoing deals and their current status.</p>
          </div>
          <Link to="/deals" className="text-sm font-bold text-harvest-leaf hover:underline">All Orders</Link>
        </div>
        {myDeals.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {myDeals.map((deal) => (
              <div key={deal.id} className="rounded-2xl border border-gray-100 p-4 transition hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-harvest-green">{deal.product_name}</h3>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">{deal.status}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 text-sm text-gray-500">
                  <span>{deal.quantity} {deal.unit}</span>
                  <span>{deal.destination_country}</span>
                  <span className="font-bold text-harvest-green">${deal.total_amount?.toLocaleString?.()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Package} title="No active orders" text="Orders appear here once you accept a supplier offer." action="Start Sourcing" to="/products" />
        )}
      </section>

      <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-harvest-green">Featured Products</h2>
            <p className="text-sm text-gray-500">Popular sourcing opportunities for buyers like you.</p>
          </div>
          <Link to="/products" className="text-sm font-bold text-harvest-leaf hover:underline">View All</Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {products.slice(0, 3).map((product) => (
            <Link key={product.id} to={`/products/${product.id}`} className="flex items-center gap-4 rounded-2xl bg-harvest-soft p-4 transition hover:shadow-sm">
              <img alt={product.name} src={product.image} className="h-14 w-14 rounded-xl object-cover" />
              <div>
                <b className="text-harvest-green">{product.name}</b>
                <div className="text-sm text-gray-600">{product.country} - {product.price}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function EmptyState({ icon: Icon, title, text, action, to }) {
  return (
    <div className="mt-5 rounded-2xl bg-harvest-soft p-6 text-center">
      <Icon size={32} className="mx-auto text-gray-300" />
      <p className="mt-2 font-bold text-gray-500">{title}</p>
      <p className="text-sm text-gray-400">{text}</p>
      <Link to={to} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-harvest-green px-4 py-2 text-sm font-bold text-white">
        {action} <ArrowRight size={14} />
      </Link>
    </div>
  );
}
