import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageShell from "../layout/PageShell";
import { Input } from "../forms/Input";
import { apiPost, register, apiGet } from "../../lib/api";

const productCategoryOptions = [
  "Fruits and Vegetables",
  "Coffee and Tea",
  "Flowers",
  "Herbs and Spices",
  "Nuts and Oil Seeds",
  "Cereals and Grains",
  "Dairy and Eggs",
  "Meat and Poultry",
  "Fish and Seafood",
  "Honey and Bee Products",
  "Essential Oils",
  "Handicrafts",
  "Textiles",
  "Other",
];

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
  const [productsOffered, setProductsOffered] = useState("");
  const [country, setCountry] = useState("Kenya");
  const [countries, setCountries] = useState([]);
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedProductsArray = productsOffered
    ? productsOffered.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  function toggleProductCategory(name) {
    const current = selectedProductsArray;
    const updated = current.includes(name)
      ? current.filter((p) => p !== name)
      : [...current, name];
    setProductsOffered(updated.join(', '));
  }

  function removeProductCategory(name) {
    const updated = selectedProductsArray.filter((p) => p !== name);
    setProductsOffered(updated.join(', '));
  }

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
      const companyPayload = {
        owner_id: data.user_id,
        name: companyName.trim(),
        type: role,
        country,
        description: `${roleLabel(role)} profile created during registration.`,
      };
      if (role === "exporter") {
        companyPayload.products_offered = productsOffered.trim() || "";
        companyPayload.export_markets = "";
      }
      await apiPost("/companies", companyPayload);
      navigate(nextPathForRole(data.role));
    } catch (error) {
      setMessage(`Registration failed. ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  // load countries for dropdown
  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet('/countries');
        setCountries(data);
        if (!country && data.length) setCountry(data[0].name);
      } catch (err) {
        // keep default
      }
    }
    load();
  }, []);

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
            {role === "exporter" && (
              <div className="relative">
                <span className="mb-2 block text-sm font-bold text-gray-800">Products Offered</span>
                <button
                  type="button"
                  onClick={() => setShowProductsDropdown((current) => !current)}
                  className="w-full rounded-2xl border border-gray-200 p-3 text-left text-sm flex items-center justify-between bg-white"
                >
                  <span>
                    {selectedProductsArray.length > 0
                      ? `${selectedProductsArray.length} product category(s)`
                      : "Select product categories..."}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showProductsDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {selectedProductsArray.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedProductsArray.map((item) => (
                      <span key={item} className="inline-flex items-center gap-1 rounded-full bg-harvest-green/10 px-3 py-1 text-xs font-bold text-harvest-green">
                        {item}
                        <button type="button" onClick={() => removeProductCategory(item)} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                )}
                {showProductsDropdown && (
                  <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                    {productCategoryOptions.map((cat) => {
                      const isSelected = selectedProductsArray.includes(cat);
                      return (
                        <label
                          key={cat}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                            isSelected ? "bg-harvest-green/10 text-harvest-green" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProductCategory(cat)}
                            className="h-4 w-4 rounded border-gray-300 text-harvest-green focus:ring-harvest-green"
                          />
                          {cat}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-800">Country</span>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 p-3"
              >
                {countries.length === 0 ? (
                  <option>Kenya</option>
                ) : (
                  countries.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)
                )}
              </select>
            </label>
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