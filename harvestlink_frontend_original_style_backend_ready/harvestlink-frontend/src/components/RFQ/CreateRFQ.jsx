import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../layout/PageShell";
import { Input, Select } from "../forms/Input";
import { apiGet, apiPost } from "../../lib/api";

export default function CreateRFQ() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    buyer_company_id: "",
    buyer_name: "",
    product_category: "Fruits",
    product_name: "",
    quantity: "",
    unit: "Metric Tons",
    destination_country: "",
    delivery_timeline: "",
    target_price: "",
    additional_notes: "",
  });
  const [message, setMessage] = useState("");
  const userId = Number(localStorage.getItem("harvestlink_user_id"));

  useEffect(() => {
    async function load() {
      if (!userId) return;
      const items = await apiGet(`/companies/owner/${userId}`);
      const buyers = items.filter((c) => c.type === "buyer");
      setCompanies(buyers);
      if (buyers.length > 0) {
        setForm((f) => ({
          ...f,
          buyer_company_id: buyers[0].id,
          buyer_name: buyers[0].name,
        }));
      }
    }
    load().catch((error) => setMessage(`Could not load companies. ${error.message}`));
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!form.buyer_company_id) {
      setMessage("Please select a buyer company.");
      return;
    }

    try {
      const payload = {
        buyer_company_id: Number(form.buyer_company_id),
        buyer_name: form.buyer_name,
        product_category: form.product_category,
        product_name: form.product_name,
        quantity: Number(form.quantity),
        unit: form.unit,
        destination_country: form.destination_country,
        delivery_timeline: form.delivery_timeline,
        target_price: form.target_price ? Number(form.target_price) : null,
        additional_notes: form.additional_notes,
      };

      const created = await apiPost("/rfqs", payload);
      setMessage("RFQ created successfully!");
      setTimeout(() => navigate(`/rfqs/${created.id}`), 1500);
    } catch (error) {
      setMessage(`RFQ could not be created. ${error.message}`);
    }
  }

  function handleCompanyChange(companyId) {
    const company = companies.find((c) => c.id === Number(companyId));
    setForm((f) => ({
      ...f,
      buyer_company_id: companyId,
      buyer_name: company?.name || "",
    }));
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-4 py-12 lg:px-6">
        <div className="mb-8">
          <h1 className="text-5xl font-black text-harvest-green">Create Request for Quote</h1>
          <p className="mt-3 text-gray-600">Get competitive quotes from verified suppliers. Fill out your requirements and HarvestLink will match you with relevant suppliers.</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-8 shadow-soft">
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Your Buyer Company</label>
            <select
              value={form.buyer_company_id}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-harvest-green"
              required
            >
              <option value="">-- Select a company --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {companies.length === 0 && (
              <p className="mt-2 text-sm text-red-600">No buyer company found. Please create one in your profile.</p>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Select
              label="Product Category"
              value={form.product_category}
              onChange={(e) => updateField("product_category", e.target.value)}
            >
              <option>Fruits</option>
              <option>Grains & Cereals</option>
              <option>Oils & Fats</option>
              <option>Spices</option>
              <option>Coffee & Tea</option>
              <option>Dairy</option>
              <option>Meat & Seafood</option>
              <option>Other</option>
            </Select>
            <Input
              label="Product Name"
              value={form.product_name}
              onChange={(e) => updateField("product_name", e.target.value)}
              placeholder="e.g., Organic Arabica Coffee"
              required
            />
            <Input
              label="Required Quantity"
              value={form.quantity}
              onChange={(e) => updateField("quantity", e.target.value)}
              placeholder="Enter quantity"
              type="number"
              required
            />
            <Select label="Unit" value={form.unit} onChange={(e) => updateField("unit", e.target.value)}>
              <option>Metric Tons</option>
              <option>KG</option>
              <option>Cartons</option>
              <option>Liters</option>
              <option>Bags</option>
            </Select>
            <Input
              label="Target Price Range"
              value={form.target_price}
              onChange={(e) => updateField("target_price", e.target.value)}
              placeholder="e.g. 750"
              type="number"
            />
            <Input
              label="Delivery Location"
              value={form.destination_country}
              onChange={(e) => updateField("destination_country", e.target.value)}
              placeholder="Destination country"
              required
            />
            <Input
              label="Delivery Timeline"
              value={form.delivery_timeline}
              onChange={(e) => updateField("delivery_timeline", e.target.value)}
              placeholder="e.g., 30 days after payment"
              required
            />
          </div>

          <Input
            label="Additional Requirements"
            value={form.additional_notes}
            onChange={(e) => updateField("additional_notes", e.target.value)}
            textarea
            placeholder="Specifications, quality requirements, packaging, shipping terms, payment preferences..."
          />

          {message && (
            <div className={`mt-6 rounded-[2rem] p-4 ${message.includes("successfully") ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"}`}>
              {message}
            </div>
          )}

          <button type="submit" className="mt-8 rounded-2xl bg-harvest-green px-8 py-4 font-black text-white hover:bg-green-700">
            Submit RFQ
          </button>
        </form>
      </main>
    </PageShell>
  );
}

