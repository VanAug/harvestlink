import { useParams, Link } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import ProductCard from "../components/cards/ProductCard";
import { suppliers, products } from "../data/mockData";
import { BadgeCheck } from "lucide-react";

export default function SupplierProfile() {
  const { id } = useParams();
  const supplier = suppliers.find(s => s.id === id) || suppliers[0];
  return (
    <PageShell>
      <section className="relative">
        <img src={supplier.image} className="h-72 w-full object-cover" />
        <div className="absolute inset-0 bg-harvest-green/55" />
        <div className="absolute bottom-8 left-1/2 w-full max-w-7xl -translate-x-1/2 px-4 text-white lg:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-5xl font-black">{supplier.name}</h1>
            <BadgeCheck size={32}/>
          </div>
          <p className="mt-2">{supplier.type} • {supplier.country} • {supplier.years} in business</p>
        </div>
      </section>
      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-3 lg:px-6">
        <section className="space-y-8 lg:col-span-2">
          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-black text-harvest-green">About Supplier</h2>
            <p className="mt-4 leading-8 text-gray-600">{supplier.name} is a verified agricultural supplier serving international buyers across {supplier.markets}. The company specializes in quality sourcing, export readiness, and reliable supply capacity.</p>
          </div>
          <div>
            <h2 className="mb-5 text-2xl font-black text-harvest-green">Product Catalog</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {products.slice(0,4).map(p => <ProductCard key={p.id} product={p}/>)}
            </div>
          </div>
        </section>
        <aside className="h-fit rounded-3xl bg-white p-7 shadow-soft">
          <h3 className="text-xl font-black text-harvest-green">Company Details</h3>
          <div className="mt-5 space-y-4 text-sm">
            <div><b>Location:</b> {supplier.country}</div>
            <div><b>Capacity:</b> {supplier.capacity}</div>
            <div><b>Export Markets:</b> {supplier.markets}</div>
            <div><b>Products:</b> {supplier.products.join(", ")}</div>
            <div><b>Status:</b> Verified Supplier</div>
          </div>
          <Link to="/create-rfq" className="mt-6 block rounded-2xl bg-harvest-green px-5 py-3 text-center font-bold text-white">Send Inquiry</Link>
        </aside>
      </main>
    </PageShell>
  );
}
