import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, FileText, Globe2, Handshake, LockKeyhole, Package, PackageCheck, ShoppingBag } from "lucide-react";
import PageShell from "../layout/PageShell";
import AdminDashboard from "./AdminDashboard";
import BuyerDashboard from "./BuyerDashboard";
import ExporterDashboard, { exporterFallbackMetrics } from "./ExporterDashboard";
import { products as fallbackProducts, rfqs as fallbackRFQs } from "../../data/mockData";
import { apiGet, mapProduct, mapRFQ } from "../../lib/api";

export default function Dashboard({ role = "buyer" }) {
  const [state, setState] = useState({
    products: fallbackProducts,
    rfqs: fallbackRFQs,
    myRfqs: [],
    myDeals: [],
    company: null,
    overview: null,
    eligibility: null,
    userName: "Trader",
    companies: [],
    companyDocs: [],
    users: [],
  });

  const isBuyer = role === "buyer";
  const isExporter = role === "exporter" || role === "supplier";
  const isAdmin = role === "admin";

  useEffect(() => {
    loadDashboard({ isBuyer, isAdmin, setState });
  }, [isBuyer, isAdmin]);

  const buyerMetrics = useMemo(() => [
    ["My Active RFQs", state.myRfqs.filter((rfq) => rfq.status === "open" || rfq.status === "Open").length, FileText],
    ["Total RFQs Posted", state.myRfqs.length, ShoppingBag],
    ["Active Orders", state.myDeals.length, Package],
    ["Market Listings", state.products.length, Globe2],
  ], [state.myDeals.length, state.myRfqs, state.products.length]);

  const exporterMetrics = state.overview ? [
    ["Products", state.overview.products, PackageCheck],
    ["RFQs", state.overview.rfqs, Handshake],
    ["Deals", state.overview.deals, LockKeyhole],
    ["Financing", state.overview.financing_requests, BadgeDollarSign],
  ] : exporterFallbackMetrics;

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        {isBuyer && (
          <BuyerDashboard
            userName={state.userName}
            company={state.company}
            metrics={buyerMetrics}
            myRfqs={state.myRfqs}
            myDeals={state.myDeals}
            products={state.products}
          />
        )}
        {isExporter && (
          <ExporterDashboard
            metrics={exporterMetrics}
            rfqs={state.rfqs}
            products={state.products}
            eligibility={state.eligibility}
          />
        )}
        {isAdmin && <AdminDashboard overview={state.overview} userName={state.userName} companies={state.companies} documents={state.companyDocs} users={state.users} />}
      </main>
    </PageShell>
  );
}

async function loadDashboard({ isBuyer, isAdmin, setState }) {
  const userId = Number(localStorage.getItem("harvestlink_user_id"));
  const userName = localStorage.getItem("harvestlink_full_name") || "Trader";

  try {
    const [apiProducts, companies, apiRfqs, overview, eligibility, companyDocs, users] = await Promise.all([
      apiGet("/products"),
      apiGet("/companies"),
      apiGet("/rfqs"),
      isAdmin ? apiGet("/admin/overview") : Promise.resolve(null),
      userId ? apiGet("/financing/eligibility/" + userId).catch(() => null) : Promise.resolve(null),
      isAdmin ? apiGet("/documents?owner_type=company") : Promise.resolve([]),
      isAdmin ? apiGet("/admin/users") : Promise.resolve([]),
    ]);

    const products = apiProducts.map((product) => mapProduct(product, companies));
    const rfqs = apiRfqs.map(mapRFQ);
    let buyerData = { company: null, myDeals: [], myRfqs: [] };

    if (isBuyer && userId) {
      buyerData = await loadBuyerData({ userId, apiRfqs });
    }

    setState({
      products,
      rfqs,
      companies,
      companyDocs,
      users,
      overview,
      eligibility,
      userName,
      ...buyerData,
    });
  } catch (error) {
    console.warn("Using fallback dashboard data because API is unavailable:", error.message);
    setState((current) => ({
      ...current,
      userName,
      myRfqs: isBuyer ? fallbackRFQs.slice(0, 2) : current.myRfqs,
      myDeals: isBuyer ? [] : current.myDeals,
    }));
  }
}

async function loadBuyerData({ userId, apiRfqs }) {
  const userCompanies = await apiGet(`/companies/owner/${userId}`);
  const company = userCompanies.find((item) => item.type === "buyer") || null;
  const allDeals = await apiGet("/deals").catch(() => []);
  const myDeals = company ? allDeals.filter((deal) => deal.buyer_company_id === company.id) : [];
  const myRfqs = company
    ? apiRfqs
        .filter((rfq) => rfq.buyer_company_id === company.id)
        .map((rfq) => ({ ...rfq, id: String(rfq.id), product: rfq.product_name }))
    : [];

  return { company, myDeals, myRfqs };
}
