import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageShell from "../layout/PageShell";
import { products as fallbackProducts } from "../../data/mockData";
import { apiGet, mapProduct } from "../../lib/api";
import { BadgeCheck, Globe2, Truck, ShieldCheck } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [apiProduct, companies] = await Promise.all([
          apiGet(`/products/${id}`),
          apiGet('/companies'),
        ]);
        setProduct(mapProduct(apiProduct, companies));
      } catch (error) {
        console.warn('Using fallback product because API is unavailable:', error.message);
        const fallback = fallbackProducts.find(p => p.id === id) || fallbackProducts[0];
        setProduct(fallback);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <PageShell>
        <main className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
          <div className="grid gap-10 lg:grid-cols-2 animate-pulse">
            <div className="h-[480px] w-full rounded-[2rem] bg-gray-200" />
            <div className="space-y-5">
              <div className="h-8 w-1/3 rounded-full bg-gray-200" />
              <div className="h-12 w-3/4 rounded-full bg-gray-200" />
              <div className="h-6 w-1/2 rounded-full bg-gray-200" />
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="h-20 rounded-2xl bg-gray-200" />
                <div className="h-20 rounded-2xl bg-gray-200" />
                <div className="h-20 rounded-2xl bg-gray-200" />
                <div className="h-20 rounded-2xl bg-gray-200" />
              </div>
            </div>
          </div>
        </main>
      </PageShell>
    );
  }

  if (!product) {
    return (
      <PageShell>
        <main className="mx-auto max-w-7xl px-4 py-12 text-center lg:px-6">
          <h1 className="text-4xl font-black text-harvest-green">Product not found</h1>
          <Link to="/products" className="mt-6 inline-block rounded-2xl bg-harvest-green px-6 py-3 font-bold text-white">
            Browse Products
          </Link>
        </main>
      </PageShell>
    );
  }

  const supplierLink = product.supplierId
    ? `/suppliers/${product.supplierId}`
    : '/suppliers';

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <img src={product.image} alt={product.name} className="h-[480px] w-full rounded-[2rem] object-cover shadow-soft" />
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[1,2,3,4].map(i => <img key={i} src={product.image} className="h-24 rounded-2xl object-cover" />)}
            </div>
          </div>
          <div>
            <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-700">{product.badge}</span>
            <h1 className="mt-5 text-5xl font-black text-harvest-green">{product.name}</h1>
            <p className="mt-3 text-lg text-gray-600">{product.category} • Origin: {product.country}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["Price", product.price],
                ["MOQ", product.moq],
                ["Availability", product.availability],
                ["Supplier", product.seller],
              ].map(([k,v]) => <div key={k} className="rounded-2xl bg-white p-4 shadow-sm"><div className="text-xs text-gray-400">{k}</div><div className="font-black">{v}</div></div>)}
            </div>
            <div className="mt-8 flex gap-3">
              <Link to="/create-rfq" className="rounded-2xl bg-harvest-green px-6 py-3 font-bold text-white">Request Quote</Link>
              <Link to={supplierLink} className="rounded-2xl border border-harvest-green px-6 py-3 font-bold text-harvest-green">View Supplier</Link>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <section className="space-y-8 lg:col-span-2">
            <div className="rounded-3xl bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black text-harvest-green">Product Description</h2>
              <p className="mt-4 leading-8 text-gray-600">Premium export-quality {product.name} sourced from verified suppliers. Suitable for wholesalers, importers, food processors, supermarkets, and international distributors.</p>
            </div>
            <div className="rounded-3xl bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black text-harvest-green">Specifications</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {["Grade A export quality","Multiple packaging options","Seasonal and contract supply","FOB, CIF and EXW available","Organic options available","Quality inspection supported"].map(x => <div key={x} className="rounded-2xl bg-harvest-soft p-4 font-semibold">{x}</div>)}
              </div>
            </div>
          </section>
          <aside className="rounded-3xl bg-white p-7 shadow-soft">
            <h3 className="text-xl font-black text-harvest-green">Supplier Preview</h3>
            <p className="mt-2 font-bold">{product.seller}</p>
            <p className="text-sm text-gray-500">{product.country} • Verified Exporter</p>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex gap-2"><BadgeCheck className="text-harvest-leaf"/> Verified Supplier</div>
              <div className="flex gap-2"><Globe2 className="text-harvest-leaf"/> Export Markets Available</div>
              <div className="flex gap-2"><Truck className="text-harvest-leaf"/> Logistics Support</div>
              <div className="flex gap-2"><ShieldCheck className="text-harvest-leaf"/> Quality Assured</div>
            </div>
            <Link to="/create-rfq" className="mt-6 block rounded-2xl bg-harvest-orange px-5 py-3 text-center font-bold text-white">Contact Supplier</Link>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}