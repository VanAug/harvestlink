import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import { Input } from "../components/forms/Input";
import { login, register } from "../lib/api";

export default function Auth({ mode = "login" }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const [email, setEmail] = useState("exporter@greenvalley.co.ke");
  const [password, setPassword] = useState("password123");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("exporter");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = isLogin
        ? await login(email, password)
        : await register(fullName, email, password, role);
      if (data.role === "buyer") navigate("/buyer-dashboard");
      else if (data.role === "admin") navigate("/admin-dashboard");
      else if (data.role === "finance_partner") navigate("/financing");
      else navigate(isLogin ? "/exporter-dashboard" : "/exporter/profile");
    } catch (error) {
      setMessage(`${isLogin ? "Login" : "Registration"} failed. Check backend is running. ${error.message}`);
    }
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-lg px-4 py-16">
        <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-8 shadow-soft">
          <div className="inline-flex rounded-full bg-harvest-soft px-4 py-2 text-sm font-bold text-harvest-green">Demo password: password123</div>
          <h1 className="mt-4 text-4xl font-black text-harvest-green">{isLogin ? "Welcome Back" : "Create Account"}</h1>
          <p className="mt-2 text-gray-600">{isLogin ? "Login to manage marketplace, RFQs, deals, escrow, and financing." : "Join HarvestLink as a buyer, exporter, or finance partner."}</p>
          <div className="mt-8 space-y-4">
            {!isLogin && <Input required label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your name" />}
            <Input required label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            <Input required label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password123" />
            {!isLogin && (
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-2xl border border-gray-200 p-3">
                <option value="exporter">Exporter</option>
                <option value="buyer">Buyer</option>
                <option value="finance_partner">Finance Partner</option>
              </select>
            )}
            {message && <div className="rounded-2xl bg-harvest-soft p-3 text-sm text-gray-700">{message}</div>}
            <button className="w-full rounded-2xl bg-harvest-green px-5 py-3 font-black text-white">{isLogin ? "Login" : "Create Account"}</button>
          </div>
        </form>
      </main>
    </PageShell>
  );
}
