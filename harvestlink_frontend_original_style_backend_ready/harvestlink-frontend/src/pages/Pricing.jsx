import PageShell from "../components/layout/PageShell";

export default function Pricing() {
  const plans = [
    ["Free", "$0", ["Basic profile", "Limited RFQ access", "3 product listings"]],
    ["Premium", "$49/mo", ["Unlimited listings", "Priority RFQs", "Supplier analytics", "Featured profile"]],
    ["Enterprise", "Custom", ["Dedicated sourcing", "Bulk RFQs", "Trade support", "Account manager"]],
  ];
  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <div className="text-center">
          <h1 className="text-5xl font-black text-harvest-green">Pricing Plans</h1>
          <p className="mt-3 text-gray-600">Flexible plans for buyers, suppliers, and global trade teams.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map(([name, price, items]) => (
            <div key={name} className="rounded-[2rem] bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-black text-harvest-green">{name}</h2>
              <div className="mt-4 text-4xl font-black">{price}</div>
              <div className="mt-6 space-y-3 text-gray-700">{items.map(i => <div key={i}>✅ {i}</div>)}</div>
              <button className="mt-8 w-full rounded-2xl bg-harvest-green px-5 py-3 font-bold text-white">Choose Plan</button>
            </div>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
