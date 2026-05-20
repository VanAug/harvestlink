import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageShell from "../layout/PageShell";
import { Input } from "../forms/Input";
import { login } from "../../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("exporter@greenvalley.co.ke");
  const [password, setPassword] = useState("password123");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function nextPathForRole(role) {
    if (role === "buyer") return "/buyer-dashboard";
    if (role === "admin") return "/admin-dashboard";
    if (role === "finance_partner") return "/financing";
    return "/exporter-dashboard";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const data = await login(email, password);
      navigate(nextPathForRole(data.role));
    } catch (error) {
      setMessage(`Login failed. ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-lg px-4 py-16">
        <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-8 shadow-soft">
          <div className="inline-flex rounded-full bg-harvest-soft px-4 py-2 text-sm font-bold text-harvest-green">
            Demo password: password123
          </div>
          <h1 className="mt-4 text-4xl font-black text-harvest-green">Welcome Back</h1>
          <p className="mt-2 text-gray-600">
            Login to manage marketplace, RFQs, deals, escrow, and financing.
          </p>

          <div className="mt-8 space-y-4">
            <Input
              required
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
            <Input
              required
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
            />
          </div>

          {message && (
            <div className="mt-5 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
              {message}
            </div>
          )}

          <button
            disabled={submitting}
            className="mt-6 w-full rounded-2xl bg-harvest-green px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {submitting ? "Please wait..." : "Login"}
          </button>

          <div className="mt-5 text-center text-sm text-gray-600">
            New to HarvestLink?{" "}
            <Link className="font-bold text-harvest-green" to="/register">
              Create an account
            </Link>
          </div>
        </form>
      </main>
    </PageShell>
  );
}