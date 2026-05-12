import { useParams } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import { rfqs } from "../data/mockData";
import { Input } from "../components/forms/Input";

export default function RFQDetail() {
  const { id } = useParams();
  const rfq = rfqs.find(r => r.id === id) || rfqs[0];
  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <section className="space-y-8 lg:col-span-2">
            <div className="rounded-[2rem] bg-white p-8 shadow-soft">
              <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-700">{rfq.status}</span>
              <h1 className="mt-5 text-5xl font-black text-harvest-green">{rfq.product}</h1>
              <p className="mt-3 text-gray-600">{rfq.location}</p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {Object.entries({Quantity: rfq.quantity, "Target Price": rfq.target, "Valid Until": rfq.validUntil, Incoterms: rfq.incoterm}).map(([k,v]) => (
                  <div key={k} className="rounded-2xl bg-harvest-soft p-4"><div className="text-xs text-gray-400">{k}</div><div className="font-black">{v}</div></div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black text-harvest-green">Buyer Requirements</h2>
              <p className="mt-4 leading-8 text-gray-600">Supplier should provide export-ready product, competitive pricing, documentation support, and reliable delivery terms. Certifications required: {rfq.certification}.</p>
            </div>
          </section>
          <aside className="rounded-3xl bg-white p-7 shadow-soft">
            <h3 className="text-xl font-black text-harvest-green">Submit Quote</h3>
            <div className="mt-5 space-y-4">
              <Input label="Your Price" placeholder="e.g. USD 850 / MT" />
              <Input label="Available Quantity" placeholder="e.g. 500 MT" />
              <Input label="Delivery Timeline" placeholder="e.g. 21 days" />
              <Input label="Message" textarea placeholder="Describe your offer..." />
              <button className="w-full rounded-2xl bg-harvest-orange px-5 py-3 font-bold text-white">Submit Quote</button>
            </div>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}
