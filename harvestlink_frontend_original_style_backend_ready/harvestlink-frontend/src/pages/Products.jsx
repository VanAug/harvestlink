import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/layout/PageShell";
import ProductCard from "../components/cards/ProductCard";
import { categories, products as fallbackProducts } from "../data/mockData";
import { apiGet, mapProduct } from "../lib/api";

export default function Products() {
  const [products, setProducts] = useState(fallbackProducts);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [apiProducts, companies] = await Promise.all([apiGet('/products'), apiGet('/companies')]);
        setProducts(apiProducts.map((p) => mapProduct(p, companies)));
      } catch (error) {
        console.warn('Using fallback products because API is unavailable:', error.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!query) return products;
    const q = query.toLowerCase();
    return products.filter((p) => [p.name, p.category, p.country, p.seller].join(' ').toLowerCase().includes(q));
  }, [products, query]);

  return (
    <PageShell>
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
          <div className="inline-flex rounded-full bg-harvest-soft px-4 py-2 text-sm font-bold text-harvest-green">Marketplace + Supplier Discovery</div>
          <h1 className="mt-4 text-5xl font-black text-harvest-green">Product Marketplace</h1>
          <p className="mt-3 max-w-2xl text-gray-600">Browse export-ready agricultural products from verified suppliers. Data is loaded from the HarvestLink backend, with demo fallbacks for presentation mode.</p>
          <div className="mt-8 flex flex-col gap-3 md:flex-row">
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 rounded-2xl border border-gray-200 px-5 py-3" placeholder="Search products, suppliers, country..." />
            <button className="rounded-2xl bg-harvest-green px-8 py-3 font-bold text-white">Search</button>
          </div>
        </div>
      </section>
      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-4 lg:px-6">
        <aside className="rounded-3xl bg-white p-5 shadow-sm">
          <h3 className="font-black text-harvest-green">Filters</h3>
          <div className="mt-5 space-y-5">
            <div>
              <label className="text-sm font-bold">Category</label>
              <div className="mt-3 space-y-2 text-sm text-gray-600">{categories.map(c => <label key={c.name} className="block"><input type="checkbox" className="mr-2"/> {c.name}</label>)}</div>
            </div>
            <div>
              <label className="text-sm font-bold">Country</label>
              <select className="mt-2 w-full rounded-xl border p-3"><option>All Countries</option><option>Kenya</option><option>Tanzania</option><option>Ethiopia</option><option>United Arab Emirates</option></select>
            </div>
            <div>
              <label className="text-sm font-bold">Trade Layer</label>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                {['Verified supplier','Escrow enabled','Financing eligible','Export ready'].map(c => <label key={c} className="block"><input type="checkbox" className="mr-2"/> {c}</label>)}
              </div>
            </div>
          </div>
        </aside>
        <section className="lg:col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-gray-500">{loading ? 'Loading products...' : `Showing ${filtered.length} products`}</p>
            <select className="rounded-xl border bg-white p-3 text-sm"><option>Sort by Latest</option><option>Lowest MOQ</option><option>Verified Suppliers</option></select>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(p => <ProductCard key={p.id} product={p}/>) }
          </div>
        </section>
      </main>
    </PageShell>
  );
}
