import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PackagePlus, Sprout } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import { Input } from "../components/forms/Input";
import { apiGet, apiPost } from "../lib/api";
import { categories } from "../data/mockData";

const initialForm = {
  name: "",
  category: "Fruits and Vegetables",
  variety: "",
  grade: "Export Grade",
  country_of_origin: "Kenya",
  available_quantity: "",
  unit: "tons/week",
  price_min: "",
  price_max: "",
  minimum_order_quantity: "",
  description: "",
  image_key: "",
  status: "active",
};

export default function AddProduct() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const data = await apiGet("/companies?type=exporter");
        setCompanies(data);
        const userId = Number(localStorage.getItem("harvestlink_user_id"));
        const ownedCompany = data.find((company) => company.owner_id === userId);
        setCompanyId(String((ownedCompany || data[0])?.id || ""));
      } catch (error) {
        setMessage(`Exporter company lookup failed. ${error.message}`);
      }
    }
    loadCompanies();
  }, []);

  const selectedCompany = useMemo(
    () => companies.find((company) => String(company.id) === String(companyId)),
    [companies, companyId]
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toNumber(value) {
    return value === "" ? null : Number(value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      if (!selectedCompany) {
        throw new Error("Select an exporter company before publishing.");
      }

      await apiPost("/products", {
        ...form,
        company_id: selectedCompany.id,
        supplier_name: selectedCompany.name,
        available_quantity: Number(form.available_quantity),
        price_min: toNumber(form.price_min),
        price_max: toNumber(form.price_max),
        minimum_order_quantity: toNumber(form.minimum_order_quantity),
      });
      navigate("/products");
    } catch (error) {
      setMessage(`Product could not be saved. ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
        <Link to="/exporter-dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-harvest-green hover:text-harvest-leaf">
          <ArrowLeft size={16} />
          Exporter Dashboard
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.4fr]">
          <section className="rounded-3xl bg-harvest-green p-8 text-white shadow-soft">
            <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold">Exporter Product Setup</div>
            <h1 className="mt-4 text-4xl font-black">Add Product</h1>
            <p className="mt-3 text-white/80">Publish an export-ready listing with quantity, pricing, and order terms buyers can act on.</p>

            <div className="mt-8 rounded-3xl bg-white/10 p-5">
              <Sprout className="text-harvest-orange" />
              <div className="mt-4 text-sm font-bold text-white/70">Seller</div>
              <div className="mt-1 text-xl font-black">{selectedCompany?.name || "Choose exporter company"}</div>
              <div className="mt-1 text-sm text-white/70">{selectedCompany?.country || "Country appears after selection"}</div>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-harvest-soft text-harvest-green">
                <PackagePlus size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-harvest-green">Product Details</h2>
                <p className="text-sm text-gray-500">Fields marked by the form are used directly in marketplace listings.</p>
              </div>
            </div>

            {message && <div className="mt-5 rounded-2xl bg-harvest-soft p-3 text-sm text-gray-700">{message}</div>}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-gray-800">Exporter Company</span>
                <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-harvest-leaf">
                  <option value="">Select company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </label>
              <Input required label="Product Name" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Hass Avocados" />
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-800">Category</span>
                <select value={form.category} onChange={(e) => updateField("category", e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-harvest-leaf">
                  {categories.map((category) => <option key={category.name}>{category.name}</option>)}
                </select>
              </label>
              <Input label="Variety" value={form.variety} onChange={(e) => updateField("variety", e.target.value)} placeholder="Hass, Arabica, Roses" />
              <Input label="Grade" value={form.grade} onChange={(e) => updateField("grade", e.target.value)} placeholder="Export Grade" />
              <Input required label="Country of Origin" value={form.country_of_origin} onChange={(e) => updateField("country_of_origin", e.target.value)} placeholder="Kenya" />
              <Input required label="Available Quantity" type="number" min="0" step="0.01" value={form.available_quantity} onChange={(e) => updateField("available_quantity", e.target.value)} placeholder="20" />
              <Input required label="Unit" value={form.unit} onChange={(e) => updateField("unit", e.target.value)} placeholder="tons/week" />
              <Input label="Minimum Order Quantity" type="number" min="0" step="0.01" value={form.minimum_order_quantity} onChange={(e) => updateField("minimum_order_quantity", e.target.value)} placeholder="5" />
              <Input label="Price Min (USD)" type="number" min="0" step="0.01" value={form.price_min} onChange={(e) => updateField("price_min", e.target.value)} placeholder="1.40" />
              <Input label="Price Max (USD)" type="number" min="0" step="0.01" value={form.price_max} onChange={(e) => updateField("price_max", e.target.value)} placeholder="1.80" />
              <Input label="Image Keyword" value={form.image_key} onChange={(e) => updateField("image_key", e.target.value)} placeholder="avocado, coffee, flowers" />
              <Input label="Description" textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Describe packing, availability, certifications, and buyer notes." />
            </div>

            <button disabled={submitting} className="mt-6 w-full rounded-2xl bg-harvest-green px-5 py-3 font-black text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-gray-400">
              {submitting ? "Publishing..." : "Publish Product"}
            </button>
          </form>
        </div>
      </main>
    </PageShell>
  );
}
