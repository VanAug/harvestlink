import { useEffect, useState } from "react";
import PageShell from "../components/layout/PageShell";
import { apiGet } from "../lib/api";
import { LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";

export default function Escrow() {
  const [escrows, setEscrows] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        setEscrows(await apiGet('/escrow'));
      } catch (error) {
        console.warn('Using fallback escrow data because API is unavailable:', error.message);
      }
    }
    load();
  }, []);

  const fallback = [
    { id: 1, payment_reference: 'HL-ESC-00001', amount: 25000, currency: 'USD', fees: 375, status: 'funded' },
    { id: 2, payment_reference: 'HL-ESC-00002', amount: 14800, currency: 'USD', fees: 222, status: 'released' },
  ];

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <section className="rounded-[2rem] bg-white p-8 shadow-soft">
          <div className="inline-flex rounded-full bg-harvest-soft px-4 py-2 text-sm font-bold text-harvest-green">Trust Layer</div>
          <h1 className="mt-4 text-5xl font-black text-harvest-green">Escrow & Payments</h1>
          <p className="mt-3 max-w-2xl text-gray-600">Secure buyer funds, protect exporters, and keep trade transactions inside HarvestLink.</p>
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[[LockKeyhole, 'Funds held securely'], [ShieldCheck, 'Reduced payment risk'], [WalletCards, 'Payment history for financing']].map(([Icon, label]) => (
            <div key={label} className="rounded-3xl bg-white p-6 shadow-sm"><Icon className="text-harvest-orange"/><h3 className="mt-3 font-black text-harvest-green">{label}</h3></div>
          ))}
        </div>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-harvest-green">Escrow Transactions</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500"><tr><th className="p-3">Reference</th><th className="p-3">Amount</th><th className="p-3">Fees</th><th className="p-3">Status</th></tr></thead>
              <tbody>{(escrows.length ? escrows : fallback).map((e) => <tr key={e.id} className="border-t"><td className="p-3 font-bold">{e.payment_reference}</td><td className="p-3">{e.currency} {e.amount?.toLocaleString?.()}</td><td className="p-3">{e.currency} {e.fees?.toLocaleString?.()}</td><td className="p-3"><span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">{e.status}</span></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
