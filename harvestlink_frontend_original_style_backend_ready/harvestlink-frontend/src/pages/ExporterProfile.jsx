import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, FileText, ShieldCheck } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import { Input } from "../components/forms/Input";
import { apiGet, apiPatch, apiPost } from "../lib/api";

const emptyCompany = {
  name: "",
  country: "Kenya",
  address: "",
  website: "",
  description: "",
  products_offered: "",
  certifications: "",
  export_capacity: "",
  export_markets: "",
};

const requiredDocs = [
  "Business License",
  "Export Certificate",
  "Tax Document",
  "Product Certification",
];

export default function ExporterProfile() {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(emptyCompany);
  const [documents, setDocuments] = useState([]);
  const [docForm, setDocForm] = useState({ document_type: requiredDocs[0], title: "", file_url: "", notes: "" });
  const [message, setMessage] = useState("");
  const userId = Number(localStorage.getItem("harvestlink_user_id"));

  async function load() {
    if (!userId) return;
    const companies = await apiGet(`/companies/owner/${userId}`);
    const exporter = companies.find((item) => item.type === "exporter") || companies[0];
    if (exporter) {
      setCompany(exporter);
      setForm({ ...emptyCompany, ...exporter });
      setDocuments(await apiGet(`/documents?owner_type=company&owner_id=${exporter.id}`));
    }
  }

  useEffect(() => {
    load().catch((error) => setMessage(`Profile could not load. ${error.message}`));
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveCompany(e) {
    e.preventDefault();
    setMessage("");
    try {
      const payload = { ...form, owner_id: userId, type: "exporter" };
      const saved = company
        ? await apiPatch(`/companies/${company.id}`, payload)
        : await apiPost("/companies", payload);
      setCompany(saved);
      setForm({ ...emptyCompany, ...saved });
      setMessage("Exporter profile saved.");
    } catch (error) {
      setMessage(`Profile could not be saved. ${error.message}`);
    }
  }

  async function submitDocument(e) {
    e.preventDefault();
    if (!company) {
      setMessage("Save your company profile before adding verification documents.");
      return;
    }
    try {
      await apiPost("/documents", {
        owner_type: "company",
        owner_id: company.id,
        ...docForm,
      });
      setDocForm({ document_type: requiredDocs[0], title: "", file_url: "", notes: "" });
      setDocuments(await apiGet(`/documents?owner_type=company&owner_id=${company.id}`));
      setMessage("Verification document submitted.");
    } catch (error) {
      setMessage(`Document could not be submitted. ${error.message}`);
    }
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div className="rounded-[2rem] bg-harvest-green p-8 text-white shadow-soft">
          <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold">Exporter Verification</div>
          <h1 className="mt-4 text-4xl font-black">Company Profile</h1>
          <p className="mt-2 max-w-3xl text-white/80">Create your exporter profile and submit the documents needed for verification.</p>
          {company && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold">
              <ShieldCheck size={18} />
              Verification: {company.verification_status}
            </div>
          )}
        </div>

        {message && <div className="mt-6 rounded-2xl bg-white p-4 text-sm font-bold text-harvest-green shadow-sm">{message}</div>}

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <form onSubmit={saveCompany} className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-2xl font-black text-harvest-green">Exporter Details</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input required label="Company Name" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Green Valley Avocados Ltd" />
              <Input required label="Country" value={form.country} onChange={(e) => updateField("country", e.target.value)} placeholder="Kenya" />
              <Input label="Address" value={form.address || ""} onChange={(e) => updateField("address", e.target.value)} placeholder="Nairobi, Kenya" />
              <Input label="Website" value={form.website || ""} onChange={(e) => updateField("website", e.target.value)} placeholder="https://company.example" />
              <Input label="Products Offered" value={form.products_offered || ""} onChange={(e) => updateField("products_offered", e.target.value)} placeholder="Avocados, herbs, macadamia" />
              <Input label="Certifications" value={form.certifications || ""} onChange={(e) => updateField("certifications", e.target.value)} placeholder="GlobalG.A.P, HACCP" />
              <Input label="Export Capacity" value={form.export_capacity || ""} onChange={(e) => updateField("export_capacity", e.target.value)} placeholder="20 tons/week" />
              <Input label="Export Markets" value={form.export_markets || ""} onChange={(e) => updateField("export_markets", e.target.value)} placeholder="UAE, Netherlands, Saudi Arabia" />
              <div className="md:col-span-2">
                <Input label="Company Description" textarea value={form.description || ""} onChange={(e) => updateField("description", e.target.value)} placeholder="Describe your operation, sourcing, packing, and export readiness." />
              </div>
            </div>
            <button className="mt-6 rounded-2xl bg-harvest-green px-6 py-3 font-black text-white">Save Profile</button>
          </form>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-harvest-green">Verification Docs</h2>
            <form onSubmit={submitDocument} className="mt-5 space-y-4">
              <select value={docForm.document_type} onChange={(e) => setDocForm((current) => ({ ...current, document_type: e.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3">
                {requiredDocs.map((doc) => <option key={doc}>{doc}</option>)}
              </select>
              <Input required label="Document Title" value={docForm.title} onChange={(e) => setDocForm((current) => ({ ...current, title: e.target.value }))} placeholder="2026 export certificate" />
              <Input label="File URL or Reference" value={docForm.file_url} onChange={(e) => setDocForm((current) => ({ ...current, file_url: e.target.value }))} placeholder="https://..." />
              <Input label="Notes" value={docForm.notes} onChange={(e) => setDocForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Expiry date, issuing body..." />
              <button className="w-full rounded-2xl bg-harvest-orange px-5 py-3 font-black text-white">Submit Document</button>
            </form>
            <div className="mt-6 space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="rounded-2xl bg-harvest-soft p-4">
                  <div className="flex items-center gap-2 font-black text-harvest-green"><FileText size={16} /> {doc.document_type}</div>
                  <div className="mt-1 text-sm text-gray-600">{doc.title}</div>
                </div>
              ))}
              {requiredDocs.every((doc) => documents.some((item) => item.document_type === doc)) && (
                <div className="flex items-center gap-2 rounded-2xl bg-green-100 p-4 text-sm font-bold text-green-700">
                  <BadgeCheck size={18} />
                  All required document types submitted
                </div>
              )}
            </div>
            <Link to="/exporter/products" className="mt-5 block rounded-2xl border border-harvest-green px-5 py-3 text-center font-black text-harvest-green">Manage Products</Link>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
