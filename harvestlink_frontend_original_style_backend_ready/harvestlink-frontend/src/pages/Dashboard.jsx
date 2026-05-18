import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import { products as fallbackProducts, rfqs as fallbackRFQs } from "../data/mockData";
import { apiGet, mapProduct, mapRFQ } from "../lib/api";
import { 
  BadgeDollarSign, FileText, Globe2, Handshake, 
  LockKeyhole, PackageCheck, ShoppingBag, TrendingUp,
  ArrowRight, MapPin, Clock, Star, Heart, Bell,
  Building2, UserCheck, Package, DollarSign, ShieldCheck
} from "lucide-react";

export default function Dashboard({ role = "buyer" }) {
  const isBuyer = role === "buyer";
  const isExporter = role === "exporter" || role === "supplier";
  const [products, setProducts] = useState(fallbackProducts);
  const [rfqs, setRfqs] = useState(fallbackRFQs);
  const [myRfqs, setMyRfqs] = useState([]);
  const [myDeals, setMyDeals] = useState([]);
  const [company, setCompany] = useState(null);
  const [overview, setOverview] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function load() {
      const userId = Number(localStorage.getItem("harvestlink_user_id"));
      const name = localStorage.getItem("harvestlink_full_name") || "Trader";
      setUserName(name);

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

        // Load buyer-specific data
        if (isBuyer && userId) {
          const userCompanies = await apiGet(`/companies/owner/${userId}`);
          const buyer = userCompanies.find((item) => item.type === "buyer") || null;
          setCompany(buyer);

          const allDeals = await apiGet('/deals').catch(() => []);
          const buyerDeals = buyer ? allDeals.filter(d => d.buyer_company_id === buyer.id) : [];
          setMyDeals(buyerDeals);

          const buyerRfqs = apiRfqs.filter(r => r.buyer_company_id === buyer?.id);
          const mappedBuyerRfqs = buyerRfqs.length > 0 
            ? buyerRfqs.map(r => ({ ...r, id: String(r.id), product: r.product_name }))
            : [];
          setMyRfqs(mappedBuyerRfqs);
        }
      } catch (error) {
        console.warn('Using fallback dashboard data because API is unavailable:', error.message);
        if (isBuyer) {
          setMyRfqs(fallbackRFQs.slice(0, 2));
          setMyDeals([]);
        }
      }
    }
    load();
  }, []);

  const buyerMetrics = [
    ["My Active RFQs", myRfqs.filter(r => r.status === "open" || r.status === "Open").length, FileText],
    ["Total RFQs Posted", myRfqs.length, ShoppingBag],
    ["Active Orders", myDeals.length, Package],
    ["Market Listings", products.length, Globe2],
  ];

  const exporterMetrics = overview ? [
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
        {/* BUYER DASHBOARD */}
        {isBuyer && (
          <>
            {/* Welcome Hero */}
            <div className="rounded-[2rem] bg-gradient-to-br from-harvest-green to-green-800 p-8 text-white shadow-soft">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
                    <UserCheck size={16} />
                    Welcome back, {userName}
                  </div>
                  <h1 className="mt-4 text-4xl font-black">Your Sourcing Dashboard</h1>
                  <p className="mt-2 max-w-3xl text-white/80">
                    Track your RFQs, manage orders, and discover new suppliers — all in one place.
                  </p>
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
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/create-rfq" className="inline-flex items-center gap-2 rounded-2xl bg-harvest-orange px-5 py-3 text-sm font-black text-white hover:bg-orange-600">
                  <FileText size={16} />
                  Post New RFQ
                </Link>
                <Link to="/buyer/profile" className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20">
                  <Building2 size={16} />
                  My Profile
                </Link>
                <Link to="/products" className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20">
                  <Globe2 size={16} />
                  Browse Products
                </Link>
                <Link to="/rfqs" className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20">
                  <ShoppingBag size={16} />
                  RFQ Market
                </Link>
                <Link to="/deals" className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20">
                  <Package size={16} />
                  My Orders
                </Link>
              </div>
            </div>

            {/* Buyer Stats */}
            <div className="mt-8 grid gap-5 md:grid-cols-4">
              {buyerMetrics.map(([label, value, Icon]) => (
                <div key={label} className="rounded-3xl bg-white p-6 shadow-sm">
                  <div className="mb-3 inline-flex rounded-xl bg-harvest-soft p-3 text-harvest-orange">
                    <Icon size={22} />
                  </div>
                  <div className="text-3xl font-black text-harvest-green">{value || 0}</div>
                  <div className="text-sm text-gray-500">{label}</div>
                </div>
              ))}
            </div>

            {/* Buyer Main Content */}
            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              {/* My RFQs */}
              <section className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-harvest-green">My Recent RFQs</h2>
                  <Link to="/buyer/profile" className="text-sm font-bold text-harvest-leaf hover:underline">View All</Link>
                </div>
                {myRfqs.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {myRfqs.slice(0, 3).map(r => (
                      <Link key={r.id} to={`/rfqs/${r.id}`} className="block rounded-2xl bg-harvest-soft p-4 transition hover:shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <b className="text-harvest-green">{r.product_name || r.product}</b>
                            <div className="flex flex-wrap gap-x-4 text-sm text-gray-600">
                              <span>{r.destination_country || r.location}</span>
                              <span>{r.quantity} {r.unit}</span>
                            </div>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                            (r.status === "open" || r.status === "Open") 
                              ? "bg-green-100 text-green-700" 
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl bg-harvest-soft p-6 text-center">
                    <FileText size={32} className="mx-auto text-gray-300" />
                    <p className="mt-2 font-bold text-gray-500">No RFQs yet</p>
                    <p className="text-sm text-gray-400">Post your first RFQ to start receiving supplier quotes.</p>
                    <Link to="/create-rfq" className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-harvest-green px-4 py-2 text-sm font-bold text-white">
                      Create RFQ <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </section>

              {/* Quick Actions */}
              <section className="space-y-4">
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-black text-harvest-green">Quick Actions</h2>
                  <div className="mt-5 space-y-3">
                    <Link to="/create-rfq" className="flex items-center gap-3 rounded-2xl bg-harvest-soft p-4 font-bold text-harvest-green transition hover:bg-green-100">
                      <FileText size={20} className="text-harvest-orange" />
                      Post an RFQ
                    </Link>
                    <Link to="/products" className="flex items-center gap-3 rounded-2xl bg-harvest-soft p-4 font-bold text-harvest-green transition hover:bg-green-100">
                      <Globe2 size={20} className="text-harvest-orange" />
                      Browse Products
                    </Link>
                    <Link to="/suppliers" className="flex items-center gap-3 rounded-2xl bg-harvest-soft p-4 font-bold text-harvest-green transition hover:bg-green-100">
                      <Building2 size={20} className="text-harvest-orange" />
                      Find Suppliers
                    </Link>
                    <Link to="/buyer-verification" className="flex items-center gap-3 rounded-2xl bg-harvest-soft p-4 font-bold text-harvest-green transition hover:bg-green-100">
                      <ShieldCheck size={20} className="text-harvest-orange" />
                      Get Verified
                    </Link>
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-black text-harvest-green">Need Help?</h2>
                  <p className="mt-2 text-sm text-gray-600">Get started with sourcing on HarvestLink.</p>
                  <div className="mt-4 space-y-2 text-sm">
                    <a href="#" className="block font-bold text-harvest-leaf hover:underline">How to create an RFQ →</a>
                    <a href="#" className="block font-bold text-harvest-leaf hover:underline">Understanding offers →</a>
                    <a href="#" className="block font-bold text-harvest-leaf hover:underline">Escrow payment guide →</a>
                  </div>
                </div>
              </section>
            </div>

            {/* My Active Orders Section */}
            <div className="mt-8">
              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-harvest-green">My Active Orders</h2>
                    <p className="text-sm text-gray-500">Ongoing deals and their current status.</p>
                  </div>
                  <Link to="/deals" className="text-sm font-bold text-harvest-leaf hover:underline">All Orders</Link>
                </div>
                {myDeals.length > 0 ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {myDeals.map(deal => (
                      <div key={deal.id} className="rounded-2xl border border-gray-100 p-4 transition hover:shadow-sm">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-harvest-green">{deal.product_name}</h3>
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">{deal.status}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 text-sm text-gray-500">
                          <span>{deal.quantity} {deal.unit}</span>
                          <span>→ {deal.destination_country}</span>
                          <span className="font-bold text-harvest-green">${deal.total_amount?.toLocaleString?.()}</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Link to={`/deals/${deal.id}/tracking`} className="rounded-xl bg-harvest-green px-3 py-2 text-xs font-bold text-white">Track</Link>
                          <Link to={`/deals/${deal.id}/review`} className="rounded-xl border px-3 py-2 text-xs font-bold text-gray-600">Review</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl bg-harvest-soft p-6 text-center">
                    <Package size={32} className="mx-auto text-gray-300" />
                    <p className="mt-2 font-bold text-gray-500">No active orders</p>
                    <p className="text-sm text-gray-400">Orders appear here once a supplier accepts your RFQ offer.</p>
                    <Link to="/products" className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-harvest-green px-4 py-2 text-sm font-bold text-harvest-green">
                      Start Sourcing <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </section>
            </div>

            {/* Featured Products */}
            <div className="mt-8">
              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-harvest-green">Featured Products</h2>
                    <p className="text-sm text-gray-500">Popular sourcing opportunities for buyers like you.</p>
                  </div>
                  <Link to="/products" className="text-sm font-bold text-harvest-leaf hover:underline">View All</Link>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {products.slice(0, 3).map(p => (
                    <Link key={p.id} to={`/products/${p.id}`} className="flex items-center gap-4 rounded-2xl bg-harvest-soft p-4 transition hover:shadow-sm">
                      <img alt={p.name} src={p.image} className="h-14 w-14 rounded-xl object-cover" />
                      <div>
                        <b className="text-harvest-green">{p.name}</b>
                        <div className="text-sm text-gray-600">{p.country} • {p.price}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

        {/* EXPORTER DASHBOARD */}
        {isExporter && (
          <>
            <div className="rounded-[2rem] bg-harvest-green p-8 text-white shadow-soft">
              <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold">Trade Execution Dashboard</div>
              <h1 className="mt-4 text-4xl font-black">Exporter Dashboard</h1>
              <p className="mt-2 max-w-3xl text-white/80">Manage your product listings, respond to RFQs, track deals, and access working capital.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/exporter/profile" className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20">Company Profile</Link>
                <Link to="/exporter/products" className="rounded-2xl bg-harvest-orange px-5 py-3 text-sm font-black text-white hover:bg-orange-600">Manage Products</Link>
                <Link to="/rfqs" className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20">RFQ Matches</Link>
                <Link to="/deals" className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20">Deal Rooms</Link>
                <Link to="/products" className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20">View Marketplace</Link>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-4">
              {exporterMetrics.map(([label, value, Icon]) => (
                <div key={label} className="rounded-3xl bg-white p-6 shadow-sm">
                  <Icon className="mb-3 text-harvest-orange" />
                  <div className="text-3xl font-black text-harvest-green">{value}</div>
                  <div className="text-sm text-gray-500">{label}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              <section className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="text-xl font-black text-harvest-green">RFQ Opportunities</h2>
                <div className="mt-5 space-y-4">
                  {rfqs.slice(0, 4).map(r => (
                    <Link key={r.id} to={`/rfqs/${r.id}`} className="block rounded-2xl bg-harvest-soft p-4 transition hover:shadow-sm">
                      <b className="text-harvest-green">{r.product}</b>
                      <div className="text-sm text-gray-600">{r.quantity} • {r.location} • {r.status}</div>
                    </Link>
                  ))}
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
                {products.slice(0,3).map(p => (
                  <div key={p.id} className="flex items-center gap-4 rounded-2xl bg-harvest-soft p-4 transition hover:shadow-sm">
                    <img alt={p.name} src={p.image} className="h-14 w-14 rounded-xl object-cover"/>
                    <div><b className="text-harvest-green">{p.name}</b><div className="text-sm text-gray-600">{p.country} • {p.price}</div></div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </PageShell>
  );
}
