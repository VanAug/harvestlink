import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageShell from "../layout/PageShell";
import ProductCard from "../cards/ProductCard";
import { suppliers as fallbackSuppliers, products as fallbackProducts } from "../../data/mockData";
import { BadgeCheck, Factory, Globe2, MapPin, ShieldCheck } from "lucide-react";
import { apiGet, mapProduct, mapSupplier } from "../../lib/api";

export default function SupplierProfile() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch company by ID from the API
        const company = await apiGet(`/companies/${id}`);
        if (company) {
          setSupplier(mapSupplier(company));
          // Fetch their products
          const apiProducts = await apiGet(`/products?company_id=${company.id}`).catch(() => []);
          setProducts(apiProducts.map((p) => mapProduct(p)));
        } else {
          setSupplier(null);
        }
      } catch (error) {
        // API unavailable — fallback to mock data
        const fb = fallbackSuppliers.find((s) => s.id === id) || null;
        setSupplier(fb);
        setProducts(fb ? fallbackProducts.slice(0, 4) : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <div className="animate-pulse text-lg font-bold text-gray-400">Loading supplier details...</div>
        </div>
      </PageShell>
    );
  }

  if (!supplier) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <p className="text-2xl font-black text-gray-400">Supplier Not Found</p>
          <Link to="/suppliers" className="mt-4 inline-block rounded-2xl bg-harvest-green px-6 py-3 font-bold text-white">
            Back to Suppliers
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="relative">
        <img src={supplier.image} alt={supplier.name} className="h-72 w-full object-cover" />
        <div className="absolute inset-0 bg-harvest-green/55" />
        <div className="absolute bottom-8 left-1/2 w-full max-w-7xl -translate-x-1/2 px-4 text-white lg:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-5xl font-black">{supplier.name}</h1>
            {supplier.verified && <BadgeCheck size={32} />}
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-3">
            <span>{supplier.type} • {supplier.country}</span>
            {supplier.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                <ShieldCheck size={14} /> Verified
              </span>
            )}
          </p>
        </div>
      </section>
      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-3 lg:px-6">
        <section className="space-y-8 lg:col-span-2">
          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-black text-harvest-green">About {supplier.name}</h2>
            <p className="mt-4 leading-8 text-gray-600">
              {supplier.raw?.description || `${supplier.name} is a verified agricultural supplier serving international buyers across ${supplier.markets}. The company specializes in quality sourcing, export readiness, and reliable supply capacity.`}
            </p>
            {supplier.raw?.website && (
              <a href={supplier.raw.website} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-harvest-green hover:underline">
                Visit Website →
              </a>
            )}
          </div>
          {products.length > 0 && (
            <div>
              <h2 className="mb-5 text-2xl font-black text-harvest-green">Product Catalog</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
        </section>
        <aside className="h-fit rounded-3xl bg-white p-7 shadow-soft">
          <h3 className="text-xl font-black text-harvest-green">Company Details</h3>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 text-gray-400" />
              <div><b>Location:</b> {supplier.country}{supplier.raw?.address ? ` — ${supplier.raw.address}` : ''}</div>
            </div>
            <div className="flex items-start gap-2">
              <Factory size={16} className="mt-0.5 text-gray-400" />
              <div><b>Capacity:</b> {supplier.capacity}</div>
            </div>
            <div className="flex items-start gap-2">
              <Globe2 size={16} className="mt-0.5 text-gray-400" />
              <div><b>Export Markets:</b> {supplier.markets}</div>
            </div>
            <div><b>Products:</b> {supplier.products.join(", ")}</div>
            <div><b>Status:</b> {supplier.verified ? 'Verified Supplier' : 'Pending Verification'}</div>
          </div>
          <Link to="/create-rfq" className="mt-6 block rounded-2xl bg-harvest-green px-5 py-3 text-center font-bold text-white">Send Inquiry</Link>
        </aside>
      </main>
    </PageShell>
  );
}
