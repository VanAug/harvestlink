import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, FileText, ShieldCheck, Trash2, UserCircle, MapPin } from "lucide-react";
import PageShell from "../layout/PageShell";
import { Input } from "../forms/Input";
import { apiDelete, apiGet, apiPatch, apiPost, apiPostMultipart } from "../../lib/api";

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

const certificationOptions = [
  "GlobalG.A.P",
  "HACCP",
  "Organic",
  "Fairtrade",
  "Rainforest Alliance",
  "UTZ",
  "ISO 22000",
  "BRCGS",
  "MPS",
  "Kosher",
  "Halal",
  "FSSC 22000",
  "SQF",
  "GFSI",
];

export default function ExporterProfile() {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(emptyCompany);
  const [documents, setDocuments] = useState([]);
  const [docForm, setDocForm] = useState({ document_type: requiredDocs[0], title: "", file_url: "", notes: "" });
  const [message, setMessage] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputRef = useRef(null);
  const userId = Number(localStorage.getItem("harvestlink_user_id"));
  const [countries, setCountries] = useState([]);
  const [showMarketsDropdown, setShowMarketsDropdown] = useState(false);
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);
  const [showCertDropdown, setShowCertDropdown] = useState(false);
  const userEmail = localStorage.getItem("harvestlink_email");

  const selectedExportMarketsArray = form.export_markets
    ? form.export_markets.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const selectedProductsArray = form.products_offered
    ? form.products_offered.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const selectedCertsArray = form.certifications
    ? form.certifications.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  function toggleExportMarket(name) {
    const current = selectedExportMarketsArray;
    const updated = current.includes(name)
      ? current.filter((market) => market !== name)
      : [...current, name];
    updateField('export_markets', updated.join(', '));
  }

  function removeExportMarket(name) {
    const updated = selectedExportMarketsArray.filter((market) => market !== name);
    updateField('export_markets', updated.join(', '));
  }

  function toggleProductCategory(name) {
    const current = selectedProductsArray;
    const updated = current.includes(name)
      ? current.filter((p) => p !== name)
      : [...current, name];
    updateField('products_offered', updated.join(', '));
  }

  function removeProductCategory(name) {
    const updated = selectedProductsArray.filter((p) => p !== name);
    updateField('products_offered', updated.join(', '));
  }

  function toggleCertification(name) {
    const current = selectedCertsArray;
    const updated = current.includes(name)
      ? current.filter((c) => c !== name)
      : [...current, name];
    updateField('certifications', updated.join(', '));
  }

  function removeCertification(name) {
    const updated = selectedCertsArray.filter((c) => c !== name);
    updateField('certifications', updated.join(', '));
  }

  async function load() {
    if (!userId) return;
    // Retry up to 5 times with 500ms delay to handle race condition after registration
    let exporter = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const companies = await apiGet(`/companies/owner/${userId}`);
      exporter = companies.find((item) => item.type === "exporter") || companies[0] || null;
      if (exporter) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (exporter) {
      setCompany(exporter);
      setForm({ ...emptyCompany, ...exporter });
      setDocuments(await apiGet(`/documents?owner_type=company&owner_id=${exporter.id}`));
    }
  }

  useEffect(() => {
    load().catch((error) => setMessage(`Profile could not load. ${error.message}`));
  }, []);

  useEffect(() => {
    async function loadCountries() {
      try {
        const data = await apiGet('/countries');
        setCountries(data);
      } catch (err) {
        // ignore
      }
    }
    loadCountries();
  }, []);

  async function requestVerificationEmail() {
    if (!userEmail) {
      setMessage("Verification email request failed. Please log in again.");
      return;
    }
    try {
      setMessage("");
      const data = await apiPost("/auth/email/verify-request", { email: userEmail });
      setMessage(`Verification link sent to ${data.email}. Check your inbox.`);
    } catch (error) {
      setMessage(`Could not send verification email. ${error.message}`);
    }
  }

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
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append("owner_type", "company");
        formData.append("owner_id", String(company.id));
        formData.append("document_type", docForm.document_type);
        formData.append("title", docForm.title);
        if (docForm.notes) formData.append("notes", docForm.notes);
        formData.append("file", file);
        await apiPostMultipart("/documents/upload", formData);
      } else {
        await apiPost("/documents", {
          owner_type: "company",
          owner_id: company.id,
          ...docForm,
        });
      }
      setDocForm({ document_type: requiredDocs[0], title: "", file_url: "", notes: "" });
      setSelectedFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setDocuments(await apiGet(`/documents?owner_type=company&owner_id=${company.id}`));
      setMessage("Verification document submitted.");
    } catch (error) {
      setMessage(`Document could not be submitted. ${error.message}`);
    }
  }

  async function deleteDocument(documentId) {
    if (!window.confirm("Delete this document?")) return;
    try {
      await apiDelete(`/documents/${documentId}`);
      setDocuments(await apiGet(`/documents?owner_type=company&owner_id=${company.id}`));
      setMessage("Document deleted.");
    } catch (error) {
      setMessage(`Unable to delete document. ${error.message}`);
    }
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div className="rounded-[2rem] bg-harvest-green p-8 text-white shadow-soft">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
                <UserCircle size={16} />
                Exporter Hub
              </div>
          <h1 className="mt-4 text-4xl font-black">{company?.name || 'Company Profile'}</h1>
          <p className="mt-2 max-w-3xl text-white/80">Create your exporter profile and submit the documents needed for verification.</p>
          {company && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold">
                <ShieldCheck size={18} />
                Verification: {company.verification_status || "pending"}
              </div>
              {company.verification_status !== "verified" && (
                <button
                  type="button"
                  onClick={requestVerificationEmail}
                  className="inline-flex items-center rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  Resend verification email
                </button>
              )}
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold">
                <MapPin size={18} />
                {company.address || company.country}
              </div>
            </div>
          )}
        </div>

        {message && <div className="mt-6 rounded-2xl bg-white p-4 text-sm font-bold text-harvest-green shadow-sm">{message}</div>}

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <form onSubmit={saveCompany} className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-2xl font-black text-harvest-green">Exporter Details</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input required label="Company Name" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Green Valley Avocados Ltd" />
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-800">Country</span>
                <select value={form.country} onChange={(e) => updateField("country", e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  {countries.length === 0 ? (
                    <option>Kenya</option>
                  ) : (
                    countries.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)
                  )}
                </select>
              </label>
              <Input label="Address" value={form.address || ""} onChange={(e) => updateField("address", e.target.value)} placeholder="Nairobi, Kenya" />
              <Input label="Website" value={form.website || ""} onChange={(e) => updateField("website", e.target.value)} placeholder="https://company.example" />
              {/* Products Offered - Tag Dropdown */}
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

              {/* Certifications - Tag Dropdown */}
              <div className="relative">
                <span className="mb-2 block text-sm font-bold text-gray-800">Certifications</span>
                <button
                  type="button"
                  onClick={() => setShowCertDropdown((current) => !current)}
                  className="w-full rounded-2xl border border-gray-200 p-3 text-left text-sm flex items-center justify-between bg-white"
                >
                  <span>
                    {selectedCertsArray.length > 0
                      ? `${selectedCertsArray.length} certification(s)`
                      : "Select certifications..."}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showCertDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {selectedCertsArray.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedCertsArray.map((item) => (
                      <span key={item} className="inline-flex items-center gap-1 rounded-full bg-harvest-green/10 px-3 py-1 text-xs font-bold text-harvest-green">
                        {item}
                        <button type="button" onClick={() => removeCertification(item)} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                )}
                {showCertDropdown && (
                  <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                    {certificationOptions.map((cert) => {
                      const isSelected = selectedCertsArray.includes(cert);
                      return (
                        <label
                          key={cert}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                            isSelected ? "bg-harvest-green/10 text-harvest-green" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCertification(cert)}
                            className="h-4 w-4 rounded border-gray-300 text-harvest-green focus:ring-harvest-green"
                          />
                          {cert}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <Input label="Export Capacity" value={form.export_capacity || ""} onChange={(e) => updateField("export_capacity", e.target.value)} placeholder="20 tons/week" />
              <div className="relative">
                <span className="mb-2 block text-sm font-bold text-gray-800">Export Markets</span>
                <button
                  type="button"
                  onClick={() => setShowMarketsDropdown((current) => !current)}
                  className="w-full rounded-2xl border border-gray-200 p-3 text-left text-sm flex items-center justify-between bg-white"
                >
                  <span>
                    {selectedExportMarketsArray.length > 0
                      ? `${selectedExportMarketsArray.length} market(s) selected`
                      : "Select export markets..."}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showMarketsDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {selectedExportMarketsArray.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedExportMarketsArray.map((market) => (
                      <span key={market} className="inline-flex items-center gap-1 rounded-full bg-harvest-green/10 px-3 py-1 text-xs font-bold text-harvest-green">
                        {market}
                        <button type="button" onClick={() => removeExportMarket(market)} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                )}
                {showMarketsDropdown && (
                  <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                    {countries.length === 0 ? (
                      <div className="p-3 text-sm text-gray-400">Loading countries...</div>
                    ) : (
                      countries.map((c) => {
                        const isSelected = selectedExportMarketsArray.includes(c.name);
                        return (
                          <label
                            key={c.code}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                              isSelected ? "bg-harvest-green/10 text-harvest-green" : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleExportMarket(c.name)}
                              className="h-4 w-4 rounded border-gray-300 text-harvest-green focus:ring-harvest-green"
                            />
                            {c.name}
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
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
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-gray-800">Upload Document</span>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center rounded-2xl bg-harvest-green px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600"
                  >
                    Browse file
                  </button>
                  <span className="truncate text-sm text-gray-500">
                    {selectedFileName || "No file selected"}
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name || "")}
                  className="sr-only"
                />
              </label>
              <Input label="File URL or Reference" value={docForm.file_url} onChange={(e) => setDocForm((current) => ({ ...current, file_url: e.target.value }))} placeholder="https://..." />
              <Input label="Notes" value={docForm.notes} onChange={(e) => setDocForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Expiry date, issuing body..." />
              <button className="w-full rounded-2xl bg-harvest-orange px-5 py-3 font-black text-white">Submit Document</button>
            </form>
            <div className="mt-6 space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="rounded-2xl bg-harvest-soft p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-black text-harvest-green"><FileText size={16} /> {doc.document_type}</div>
                    <button type="button" onClick={() => deleteDocument(doc.id)} className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">{doc.title}</div>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold text-harvest-green hover:underline">
                      View document
                    </a>
                  )}
                  {doc.notes && <div className="mt-2 text-sm text-gray-500">{doc.notes}</div>}
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
