import { Link } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import ProductCard from "../components/cards/ProductCard";
import { categories, products, stats } from "../data/mockData";
import { ArrowRight, BadgeCheck, Globe2, LockKeyhole, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <PageShell>
      <section className="bg-grid relative overflow-hidden bg-harvest-cream">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 lg:grid-cols-2 lg:px-6">
          <div>
            <div className="mb-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-harvest-green shadow-sm">Verified Suppliers • Global Buyers • Secure RFQs</div>
            <h1 className="text-5xl font-black tracking-tight text-harvest-green lg:text-7xl">
              Your Trusted Global <span className="text-harvest-orange">Agricultural Marketplace</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-700">
              Source high-quality agricultural products from verified suppliers across the world. From fresh produce and grains to spices, oils, nuts, and export-ready commodities.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/products" className="rounded-2xl bg-harvest-green px-6 py-3 font-bold text-white shadow-soft">Browse Products</Link>
              <Link to="/create-rfq" className="rounded-2xl border border-harvest-green bg-white px-6 py-3 font-bold text-harvest-green">Request a Quote</Link>
              <Link to="/supplier-verification" className="rounded-2xl border border-harvest-green bg-white px-6 py-3 font-bold text-harvest-green">Become a Supplier</Link>
            </div>
            <div className="mt-10 grid gap-4 text-sm md:grid-cols-4">
              {[
                [BadgeCheck, "Verified Suppliers"],
                [Globe2, "Global Sourcing"],
                [LockKeyhole, "Secure Trading"],
                [ShieldCheck, "Quality Assured"],
              ].map(([Icon, label]) => (
                <div key={label} className="flex items-center gap-2 font-semibold text-gray-700"><Icon className="text-harvest-leaf"/>{label}</div>
              ))}
            </div>
          </div>
          <div className="relative">
            <img className="rounded-[2rem] shadow-soft" src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80" alt="Farm produce" />
            <div className="absolute -bottom-6 left-6 right-6 rounded-3xl bg-white p-5 shadow-soft">
              <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                {stats.map(s => <div key={s.label}><div className="text-2xl font-black text-harvest-green">{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-harvest-green">Browse by Category</h2>
          <p className="mt-2 text-gray-600">Discover agricultural products across high-demand trade categories.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          {categories.map(cat => (
            <Link key={cat.name} to="/products" className="rounded-3xl border border-green-900/10 bg-white p-5 text-center shadow-sm hover:shadow-soft">
              <div className="text-4xl">{cat.emoji}</div>
              <div className="mt-3 text-sm font-bold">{cat.name}</div>
              <div className="text-xs text-gray-400">{cat.count} listings</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        <div className="rounded-[2rem] bg-white p-8 shadow-soft">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-4xl font-black text-harvest-green">Find the Right Suppliers Faster with <span className="text-harvest-orange">RFQ</span></h2>
              <p className="mt-4 text-gray-600">Post your requirements and receive competitive quotes from verified agricultural suppliers worldwide.</p>
              <Link to="/create-rfq" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-harvest-green px-6 py-3 font-bold text-white">Create an RFQ <ArrowRight size={18}/></Link>
            </div>
            <img className="rounded-3xl" src="https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1000&q=80" alt="Shipping port" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-harvest-green">Featured Products</h2>
            <p className="text-gray-600">Popular agricultural sourcing opportunities.</p>
          </div>
          <Link to="/products" className="font-bold text-harvest-leaf">View all</Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.slice(0,6).map(p => <ProductCard key={p.id} product={p}/>)}
        </div>
      </section>
    </PageShell>
  );
}
