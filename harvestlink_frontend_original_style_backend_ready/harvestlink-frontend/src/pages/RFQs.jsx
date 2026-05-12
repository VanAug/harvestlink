import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import RFQCard from "../components/cards/RFQCard";
import { rfqs as fallbackRFQs } from "../data/mockData";
import { apiGet, mapRFQ } from "../lib/api";

export default function RFQs() {
  const [rfqs, setRfqs] = useState(fallbackRFQs);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet('/rfqs');
        setRfqs(data.map(mapRFQ));
      } catch (error) {
        console.warn('Using fallback RFQs because API is unavailable:', error.message);
      }
    }
    load();
  }, []);

  return (
    <PageShell>
      <section className="bg-harvest-cream">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-harvest-green shadow-sm">Buyer Demand</div>
              <h1 className="mt-4 text-5xl font-black text-harvest-green">RFQ Market</h1>
              <p className="mt-3 max-w-2xl text-gray-600">Respond to real buyer requests, submit offers, and convert demand into deal rooms.</p>
            </div>
            <Link to="/create-rfq" className="rounded-2xl bg-harvest-green px-6 py-3 text-center font-bold text-white shadow-soft">Create RFQ</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-2 lg:grid-cols-3 lg:px-6">
        {rfqs.map(r => <RFQCard key={r.id} rfq={r}/>) }
      </section>
    </PageShell>
  );
}
