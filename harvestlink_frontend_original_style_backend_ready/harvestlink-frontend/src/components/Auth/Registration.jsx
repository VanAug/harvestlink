import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageShell from "../layout/PageShell";
import { Input } from "../forms/Input";
import { apiPost, register } from "../../lib/api";

const roleOptions = [
  { value: "buyer", label: "Buyer" },
  { value: "exporter", label: "Exporter" },
  { value: "finance_partner", label: "Finance Partner" },
];

export default function Registration() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("buyer");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("Kenya");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function nextPathForRole(role) {
    if (role === "buyer") return "/buyer/profile";
    if (role === "admin") return "/admin-dashboard";
    if (role === "finance_partner") return "/financing";
    return "/exporter/profile";
  }

  function roleLabel(role) {
    return roleOptions.find((option) => option.value === role)?.label || "User";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }
      if (!companyName.trim()) {
        throw new Error("Company name is required.");
      }

      const data = await register(fullName, email, password, role);
      await apiPost("/companies", {
        owner_id: data.user_id,
        name: companyName.trim(),
        type: role,
        country,
        description: `${roleLabel(role)} profile created during registration.`,
        buying_interests: role === "buyer" ? "Add buying interests in profile" : undefined,
        preferred_destinations: role === "buyer" ? country : undefined,
        products_offered: role === "exporter" ? "Add products in exporter profile" : undefined,
        export_markets: role === "exporter" ? country : undefined,
      });
      navigate(nextPathForRole(data.role));
    } catch (error) {
      setMessage(`Registration failed. ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-2xl px-4 py-16">
        <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-8 shadow-soft">
          <div className="inline-flex rounded-full bg-harvest-soft px-4 py-2 text-sm font-bold text-harvest-green">
            Create your account and company profile
          </div>
          <h1 className="mt-4 text-4xl font-black text-harvest-green">Create Account</h1>
          <p className="mt-2 text-gray-600">
            Register as a buyer, exporter, or finance partner. Your company profile will be created immediately.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                required
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
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
              placeholder="Create a password"
            />
            <Input
              required
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
            />
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-800">Account Type</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 p-3"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <Input
              required
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company or business name"
            />
            <Input
              required
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Kenya"
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
            {submitting ? "Please wait..." : "Create Account"}
          </button>

          <div className="mt-5 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link className="font-bold text-harvest-green" to="/login">
              Login
            </Link>
          </div>
        </form>
      </main>
    </PageShell>
  );
}