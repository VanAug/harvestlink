import { useEffect, useState } from "react";
import PageShell from "../components/layout/PageShell";
import { apiGet } from "../lib/api";
import { LockKeyhole, MessageSquare, PackageCheck, Truck } from "lucide-react";

const fallbackDeals = [
  { id: 1, product_name: 'Hass Avocados', quantity: 20, unit: 'tons', total_amount: 25000, currency: 'USD', destination_country: 'UAE', delivery_terms: 'FOB Mombasa', status: 'funds_in_escrow', escrow_status: 'funded' },
  { id: 2, product_name: 'Fresh Cut Flowers', quantity: 40, unit: 'boxes', total_amount: 14800, currency: 'USD', destination_country: 'Netherlands', delivery_terms: 'CIF Rotterdam', status: 'completed', escrow_status: 'released' },
];

export default function Deals() {
  const [deals, setDeals] = useState(fallbackDeals);
  const [messages, setMessages] = useState([]);
  const activeDeal = deals[0];

  useEffect(() => {
    async function load() {
      try {
        const apiDeals = await apiGet('/deals');
        setDeals(apiDeals);
        if (apiDeals[0]) setMessages(await apiGet(`/deals/${apiDeals[0].id}/messages`));
      } catch (error) {
        console.warn('Using fallback deals because API is unavailable:', error.message);
      }
    }
    load();
  }, []);

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-soft">
          <div className="inline-flex rounded-full bg-harvest-soft px-4 py-2 text-sm font-bold text-harvest-green">Deal Flow</div>
          <h1 className="mt-4 text-5xl font-black text-harvest-green">Deal Rooms</h1>
          <p className="mt-3 max-w-2xl text-gray-600">Manage negotiation, trade terms, escrow status, fulfillment, and buyer/exporter communication in one place.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="space-y-4">
            {deals.map((deal) => (
              <button key={deal.id} className="w-full rounded-3xl bg-white p-5 text-left shadow-sm hover:shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-harvest-green">{deal.product_name}</h3>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">{deal.status}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{deal.quantity} {deal.unit} • {deal.destination_country}</p>
                <p className="mt-2 font-black text-harvest-orange">{deal.currency} {deal.total_amount?.toLocaleString?.()}</p>
              </button>
            ))}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-start">
              <div>
                <h2 className="text-3xl font-black text-harvest-green">{activeDeal?.product_name}</h2>
                <p className="mt-2 text-gray-600">{activeDeal?.quantity} {activeDeal?.unit} to {activeDeal?.destination_country}</p>
              </div>
              <span className="rounded-full bg-harvest-green px-4 py-2 text-sm font-bold text-white">Escrow: {activeDeal?.escrow_status}</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-harvest-soft p-4"><PackageCheck className="text-harvest-orange"/><b className="mt-2 block">Amount</b><span>{activeDeal?.currency} {activeDeal?.total_amount?.toLocaleString?.()}</span></div>
              <div className="rounded-2xl bg-harvest-soft p-4"><Truck className="text-harvest-orange"/><b className="mt-2 block">Terms</b><span>{activeDeal?.delivery_terms}</span></div>
              <div className="rounded-2xl bg-harvest-soft p-4"><LockKeyhole className="text-harvest-orange"/><b className="mt-2 block">Escrow</b><span>{activeDeal?.escrow_status}</span></div>
              <div className="rounded-2xl bg-harvest-soft p-4"><MessageSquare className="text-harvest-orange"/><b className="mt-2 block">Messages</b><span>{messages.length || 3}</span></div>
            </div>

            <div className="mt-6 rounded-3xl bg-harvest-soft p-5">
              <h3 className="font-black text-harvest-green">Messages</h3>
              <div className="mt-4 space-y-3">
                {(messages.length ? messages : [
                  { id: 1, message: 'We need 20 tons shipped within 14 days.' },
                  { id: 2, message: 'Confirmed. We can supply export-grade Hass avocados.' },
                  { id: 3, message: 'Please proceed with escrow invoice.' },
                ]).map((m) => <div key={m.id} className="rounded-2xl bg-white p-4 text-sm text-gray-700">{m.message}</div>)}
              </div>
            </div>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
