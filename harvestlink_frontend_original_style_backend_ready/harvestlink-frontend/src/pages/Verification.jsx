import PageShell from "../components/layout/PageShell";
import { Link } from "react-router-dom";
import { BadgeCheck, ShieldCheck, Sparkles, Users } from "lucide-react";

export default function Verification({ type = "buyer" }) {
  const isBuyer = type === "buyer";
  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">Trusted by 10,000+ Verified Buyers</div>
            <h1 className="text-5xl font-black text-harvest-green">{isBuyer ? "Verify Your Buyer Account" : "Verify Your Supplier Account"}</h1>
            <p className="mt-5 text-lg leading-8 text-gray-600">
              Get verified to unlock premium marketplace features, improve trust, and gain priority access to the best opportunities on HarvestLink.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                ["Priority supplier responses", BadgeCheck],
                ["Exclusive marketplace access", Sparkles],
                ["Verified account badge", ShieldCheck],
                ["Personalized support", Users]
              ].map(([text, Icon]) => <div key={text} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"><Icon className="text-harvest-leaf"/><span className="font-bold">{text}</span></div>)}
            </div>
          </div>
          <div className="rounded-[2rem] bg-white p-8 shadow-soft">
            <h2 className="text-3xl font-black text-harvest-green">{isBuyer ? "Verified Buyer" : "Verified Supplier"} Plan</h2>
            <div className="mt-5 text-6xl font-black text-harvest-green">$90</div>
            <p className="text-gray-500">One-time verification fee</p>
            <div className="mt-6 space-y-3 text-gray-700">
              {["Secure verification process","Money-back guarantee if not approved","Premium badge","Priority marketplace access","Profile trust score"].map(x => <div key={x}>✅ {x}</div>)}
            </div>
            <Link to="/register" className="mt-8 block rounded-2xl bg-harvest-orange px-6 py-4 text-center font-black text-white">Start Verification - $90 One-time Fee</Link>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
