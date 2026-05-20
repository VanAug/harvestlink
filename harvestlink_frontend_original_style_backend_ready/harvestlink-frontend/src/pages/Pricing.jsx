import { Link } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import { isLoggedIn } from "../lib/api";

export default function Pricing() {
  const loggedIn = isLoggedIn();

  const plans = [
    {
      name: "Free",
      price: "$0",
      items: ["Basic profile", "Limited RFQ access", "3 product listings"],
      link: loggedIn ? "/" : "/register",
      cta: loggedIn ? "Your Current Plan" : "Get Started Free",
      primary: false,
    },
    {
      name: "Premium",
      price: "$49/mo",
      items: ["Unlimited listings", "Priority RFQs", "Supplier analytics", "Featured profile"],
      link: loggedIn ? "/buyer-dashboard" : "/register",
      cta: loggedIn ? "Upgrade Now" : "Start Free Trial",
      primary: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      items: ["Dedicated sourcing", "Bulk RFQs", "Trade support", "Account manager"],
      link: "/contact",
      cta: "Contact Sales",
      primary: false,
    },
  ];

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <div className="text-center">
          <h1 className="text-5xl font-black text-harvest-green">Pricing Plans</h1>
          <p className="mt-3 text-gray-600">Flexible plans for buyers, suppliers, and global trade teams.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className="rounded-[2rem] bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-black text-harvest-green">{plan.name}</h2>
              <div className="mt-4 text-4xl font-black">{plan.price}</div>
              <div className="mt-6 space-y-3 text-gray-700">
                {plan.items.map(i => <div key={i}>✅ {i}</div>)}
              </div>
              <Link
                to={plan.link}
                className={`mt-8 block w-full rounded-2xl px-5 py-3 text-center font-bold text-white bg-harvest-green hover:bg-green-700`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </PageShell>
  );
}