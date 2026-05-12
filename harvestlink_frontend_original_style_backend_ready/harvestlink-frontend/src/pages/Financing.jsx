import { useEffect, useState } from "react";
import PageShell from "../components/layout/PageShell";
import { apiGet } from "../lib/api";
import { BadgeDollarSign, BarChart3, CheckCircle2, ShieldCheck } from "lucide-react";

export default function Financing() {
  const [requests, setRequests] = useState([]);
  const [eligibility, setEligibility] = useState({ financing_eligible_amount: 20000, trade_score: 78, total_trade_value: 85000, total_deals: 8 });

  useEffect(() => {
    async function load() {
      try {
        const [financeRequests, score] = await Promise.all([apiGet('/financing'), apiGet('/financing/eligibility/1')]);
        setRequests(financeRequests);
        setEligibility(score);
      } catch (error) {
        console.warn('Using fallback financing data because API is unavailable:', error.message);
      }
    }
    load();
  }, []);

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <section className="overflow-hidden rounded-[2rem] bg-harvest-green text-white shadow-soft">
          <div className="grid gap-8 p-8 lg:grid-cols-2 lg:p-12">
            <div>
              <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold">Trade Finance Layer</div>
              <h1 className="mt-5 text-5xl font-black">Access working capital based on real trade activity.</h1>
              <p className="mt-4 max-w-xl text-white/80">HarvestLink uses completed deals, payment performance, buyer relationships, and trade volume to support financing eligibility.</p>
            </div>
            <div className="rounded-[2rem] bg-white p-6 text-harvest-green">
              <div className="text-sm font-bold text-gray-500">Estimated eligibility</div>
              <div className="mt-2 text-6xl font-black">${eligibility.financing_eligible_amount?.toLocaleString?.()}</div>
              <div className="mt-4 rounded-2xl bg-harvest-soft p-4 font-bold">Trade score: {eligibility.trade_score}</div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          {[
            ["Trade value", `$${eligibility.total_trade_value?.toLocaleString?.()}`, BadgeDollarSign],
            ["Total deals", eligibility.total_deals, CheckCircle2],
            ["Trade score", eligibility.trade_score, BarChart3],
            ["Risk layer", "Data-backed", ShieldCheck],
          ].map(([label, value, Icon]) => <div key={label} className="rounded-3xl bg-white p-6 shadow-sm"><Icon className="text-harvest-orange"/><div className="mt-3 text-3xl font-black text-harvest-green">{value}</div><div className="text-sm text-gray-500">{label}</div></div>)}
        </div>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-harvest-green">Financing Requests</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500"><tr><th className="p-3">Exporter</th><th className="p-3">Requested</th><th className="p-3">Eligible</th><th className="p-3">Score</th><th className="p-3">Status</th></tr></thead>
              <tbody>
                {(requests.length ? requests : [{id: 1, exporter_company_id: 1, requested_amount: 20000, eligible_amount: 8600, score: 78, status: 'under_review'}]).map((r) => (
                  <tr key={r.id} className="border-t"><td className="p-3">Company #{r.exporter_company_id}</td><td className="p-3">${r.requested_amount?.toLocaleString?.()}</td><td className="p-3">${r.eligible_amount?.toLocaleString?.()}</td><td className="p-3">{r.score}</td><td className="p-3"><span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">{r.status}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
