import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Building2, FileText, Globe2, Heart, ShoppingBag, 
  BadgeCheck, Clock, Package, TrendingUp, ArrowRight,
  Settings, UserCircle, ShieldCheck, MapPin, DollarSign, Trash2
} from "lucide-react";
import PageShell from "../layout/PageShell";
import { Input } from "../forms/Input";
import { apiDelete, apiGet, apiPatch, apiPost, apiPostMultipart } from "../../lib/api";
import { products as fallbackProducts, rfqs as fallbackRFQs } from "../../data/mockData";

const emptyCompany = {
  name: "",
  country: "Kenya",
  address: "",
  website: "",
  description: "",
  buying_interests: "",
  preferred_destinations: "",
};

const verificationDocs = [
  "Business License",
  "Company Registration",
  "Tax Certificate",
  "Bank Reference",
];

export default function BuyerProfile() {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(emptyCompany);
  const [message, setMessage] = useState("");
  const [countries, setCountries] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [myRfqs, setMyRfqs] = useState([]);
  const [myDeals, setMyDeals] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [docForm, setDocForm] = useState({ document_type: verificationDocs[0], title: "", file_url: "", notes: "" });
  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputRef = useRef(null);
  const [stats, setStats] = useState({ totalRfqs: 0, activeRfqs: 0, totalDeals: 0, savedProducts: 0 });
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const userId = Number(localStorage.getItem("harvestlink_user_id"));
  const userEmail = localStorage.getItem("harvestlink_email");

  const selectedDestArray = form.preferred_destinations
    ? form.preferred_destinations.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const selectedDestCount = selectedDestArray.length;

  function toggleDestination(name) {
    const current = selectedDestArray;
    const updated = current.includes(name)
      ? current.filter(d => d !== name)
      : [...current, name];
    updateField('preferred_destinations', updated.join(', '));
  }

  function removeDestination(name) {
    const updated = selectedDestArray.filter(d => d !== name);
    updateField('preferred_destinations', updated.join(', '));
  }

  async function load() {
    if (!userId) return;
    try {
      // Retry up to 5 times with 500ms delay to handle race condition after registration
      let buyer = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const companies = await apiGet(`/companies/owner/${userId}`);
        buyer = companies.find((item) => item.type === "buyer") || null;
        if (buyer) break;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (buyer) {
        setCompany(buyer);
        setForm({ ...emptyCompany, ...buyer });
        setDocuments(await apiGet(`/documents?owner_type=company&owner_id=${buyer.id}`));
      }

      // Load buyer's own RFQs
      const allRfqs = await apiGet('/rfqs').catch(() => []);
      const buyerRfqs = buyer ? allRfqs.filter(r => 
        r.buyer_company_id === buyer.id || r.buyer_name === buyer.name
      ) : [];
      
      // Map RFQs to our format
      const mappedRfqs = buyerRfqs.length > 0 
        ? buyerRfqs.map(r => ({
            id: String(r.id),
            product: r.product_name || r.product,
            status: r.status || "Open",
            location: r.destination_country || r.location,
            quantity: r.quantity ? `${r.quantity} ${r.unit}` : "",
            target_price: r.target_price ? `$${r.target_price}` : "",
          }))
        : [];

      setMyRfqs(mappedRfqs);

      // Load buyer's deals
      const allDeals = await apiGet('/deals').catch(() => []);
      const buyerDeals = buyer ? allDeals.filter(d => d.buyer_company_id === buyer.id) : [];
      setMyDeals(buyerDeals);

      // Stats — only real data, no fallback
      setStats({
        totalRfqs: mappedRfqs.length,
        activeRfqs: mappedRfqs.filter(r => r.status === "Open" || r.status === "open").length,
        totalDeals: buyerDeals.length,
        savedProducts: watchlist.length,
      });

      // Recent products — empty for new users
      setRecentProducts([]);

    } catch (error) {
      setMessage(`Profile could not load. ${error.message}`);
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
      const payload = { ...form, owner_id: userId, type: "buyer" };
      const saved = company
        ? await apiPatch(`/companies/${company.id}`, payload)
        : await apiPost("/companies", payload);
      setCompany(saved);
      setForm({ ...emptyCompany, ...saved });
      setMessage("Buyer profile saved.");
      setDocuments(await apiGet(`/documents?owner_type=company&owner_id=${saved.id}`));
    } catch (error) {
      setMessage(`Profile could not be saved. ${error.message}`);
    }
  }

  async function submitDocument(e) {
    e.preventDefault();
    if (!company) {
      setMessage("Save your company profile before uploading verification documents.");
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
      setDocForm({ document_type: verificationDocs[0], title: "", file_url: "", notes: "" });
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

  const tabs = [
    { id: "profile", label: "Company Profile", icon: Building2 },
    { id: "activity", label: "My Activity", icon: TrendingUp },
    { id: "saved", label: "Saved Products", icon: Heart },
    { id: "settings", label: "Account Settings", icon: Settings },
  ];

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        {/* Hero Header */}
        <div className="rounded-[2rem] bg-gradient-to-br from-harvest-green to-green-800 p-8 text-white shadow-soft">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
                <UserCircle size={16} />
                Buyer Hub
              </div>
              <h1 className="mt-4 text-4xl font-black">
                {company?.name || "Your Buyer Account"}
              </h1>
              <p className="mt-2 max-w-3xl text-white/80">
                Manage your sourcing profile, track RFQs, view deals, and discover suppliers.
              </p>
              {company && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold">
                    <ShieldCheck size={16} />
                    {company.verification_status === "verified" ? "Verified Buyer" : "Verification: " + (company.verification_status || "pending")}
                  </span>
                  {company.verification_status !== "verified" && (
                    <button
                      type="button"
                      onClick={requestVerificationEmail}
                      className="inline-flex items-center rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
                    >
                      Resend verification email
                    </button>
                  )}
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold">
                    <MapPin size={16} />
                    {company.country}
                  </span>
                </div>
              )}
            </div>
            {!company && (
              <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                <p className="text-sm text-white/80">Set up your buyer profile to start creating RFQs and sourcing products.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["Active RFQs", stats.activeRfqs, FileText, "bg-blue-50 text-blue-600"],
            ["Total RFQs", stats.totalRfqs, ShoppingBag, "bg-green-50 text-green-600"],
            ["Active Deals", stats.totalDeals, Package, "bg-orange-50 text-orange-600"],
            ["Saved Items", stats.savedProducts, Heart, "bg-pink-50 text-pink-600"],
          ].map(([label, value, Icon, color]) => (
            <div key={label} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className={`inline-flex rounded-xl ${color} p-2`}>
                <Icon size={20} />
              </div>
              <div className="mt-3 text-2xl font-black text-harvest-green">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions for Buyers */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/create-rfq" className="inline-flex items-center gap-2 rounded-2xl bg-harvest-green px-5 py-3 font-bold text-white shadow-sm hover:bg-green-700">
            <FileText size={18} />
            Create New RFQ
          </Link>
          <Link to="/products" className="inline-flex items-center gap-2 rounded-2xl border border-harvest-green px-5 py-3 font-bold text-harvest-green hover:bg-harvest-soft">
            <Globe2 size={18} />
            Browse Products
          </Link>
          <Link to="/suppliers" className="inline-flex items-center gap-2 rounded-2xl border border-harvest-green px-5 py-3 font-bold text-harvest-green hover:bg-harvest-soft">
            <Building2 size={18} />
            Find Suppliers
          </Link>
          <Link to="/rfqs" className="inline-flex items-center gap-2 rounded-2xl border border-harvest-green px-5 py-3 font-bold text-harvest-green hover:bg-harvest-soft">
            <ShoppingBag size={18} />
            RFQ Market
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-t-xl px-5 py-3 text-sm font-bold transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-harvest-green shadow-sm"
                    : "text-gray-500 hover:text-harvest-green hover:bg-gray-50"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* TAB: Profile */}
          {activeTab === "profile" && (
            <div className="grid gap-8 lg:grid-cols-3">
              <form onSubmit={saveCompany} className="rounded-[2rem] bg-white p-8 shadow-soft lg:col-span-2">
                <h2 className="text-2xl font-black text-harvest-green">Company Information</h2>
                <p className="mt-2 text-sm text-gray-500">
                  This information is shared with exporters when you submit RFQs.
                </p>
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <Input
                    label="Company Name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Your company name"
                    required
                  />
                  <label>
                    <span className="mb-2 block text-sm font-bold text-gray-800">Country</span>
                    <select value={form.country} onChange={(e) => updateField("country", e.target.value)} className="w-full rounded-2xl border border-gray-200 p-3" required>
                      {countries.length === 0 ? (
                        <option>Kenya</option>
                      ) : (
                        countries.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)
                      )}
                    </select>
                  </label>
                  <Input
                    label="Address"
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Business address"
                  />
                  <Input
                    label="Website"
                    value={form.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://example.com"
                  />
                  <Input
                    label="Buying Interests"
                    value={form.buying_interests}
                    onChange={(e) => updateField("buying_interests", e.target.value)}
                    textarea
                    placeholder="What products or commodities are you looking to source? (e.g., Avocados, Coffee, Grains)"
                  />
                  <div>
                    <span className="mb-2 block text-sm font-bold text-gray-800">Preferred Destinations</span>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowDestDropdown(!showDestDropdown)}
                        className="w-full rounded-2xl border border-gray-200 p-3 text-left text-sm flex items-center justify-between bg-white"
                      >
                        <span>{selectedDestCount > 0 ? `${selectedDestCount} destination(s) selected` : "Select destinations..."}</span>
                        <svg className={`w-4 h-4 transition-transform ${showDestDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {selectedDestCount > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedDestArray.map((dest) => (
                            <span key={dest} className="inline-flex items-center gap-1 rounded-full bg-harvest-green/10 px-3 py-1 text-xs font-bold text-harvest-green">
                              {dest}
                              <button
                                type="button"
                                onClick={() => removeDestination(dest)}
                                className="hover:text-red-500"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      {showDestDropdown && (
                        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                          {countries.length === 0 ? (
                            <div className="p-3 text-sm text-gray-400">Loading countries...</div>
                          ) : (
                            countries.map((c) => {
                              const isSelected = selectedDestArray.includes(c.name);
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
                                    onChange={() => toggleDestination(c.name)}
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
                  </div>
                  <Input
                    label="Company Description"
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    textarea
                    placeholder="Tell exporters about your company, your industry, and what you're looking for."
                  />
                </div>
                <button className="mt-8 rounded-2xl bg-harvest-green px-8 py-4 font-black text-white hover:bg-green-700">
                  Save Profile
                </button>
              </form>

              <aside className="space-y-6">
                <div className="rounded-3xl bg-white p-6 shadow-soft">
                  <h3 className="flex items-center gap-2 text-lg font-black text-harvest-green">
                    <BadgeCheck size={20} className="text-harvest-orange" />
                    Profile Tips
                  </h3>
                  <ul className="mt-4 space-y-3 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-harvest-green">✓</span>
                      A complete profile gets 3x more supplier responses
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-harvest-green">✓</span>
                      List specific products and quantities you need
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-harvest-green">✓</span>
                      Add preferred sourcing regions for better matches
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-harvest-green">✓</span>
                      Get verified to access premium suppliers
                    </li>
                  </ul>
                  <Link to="/buyer-verification" className="mt-4 flex items-center gap-2 text-sm font-bold text-harvest-orange hover:underline">
                    Get Verified <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-soft">
                  <h3 className="text-lg font-black text-harvest-green">Verification Documents</h3>
                  <p className="mt-2 text-sm text-gray-500">Upload documents to complete your buyer verification.</p>
                  <form onSubmit={submitDocument} className="mt-4 space-y-4">
                    <select
                      value={docForm.document_type}
                      onChange={(e) => setDocForm((current) => ({ ...current, document_type: e.target.value }))}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3"
                    >
                      {verificationDocs.map((doc) => <option key={doc}>{doc}</option>)}
                    </select>
                    <Input
                      required
                      label="Document Title"
                      value={docForm.title}
                      onChange={(e) => setDocForm((current) => ({ ...current, title: e.target.value }))}
                      placeholder="Purchase order #1234"
                    />
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
                    <Input
                      label="Notes"
                      value={docForm.notes}
                      onChange={(e) => setDocForm((current) => ({ ...current, notes: e.target.value }))}
                      placeholder="Expiry date, issuing body, or reference"
                    />
                    <button className="w-full rounded-2xl bg-harvest-orange px-5 py-3 font-black text-white">
                      Submit Document
                    </button>
                  </form>
                  <div className="mt-6 space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="rounded-2xl bg-harvest-soft p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-black text-harvest-green">{doc.document_type}</div>
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
                  </div>
                </div>

                {company && (
                  <div className="rounded-3xl bg-white p-6 shadow-soft">
                    <h3 className="text-lg font-black text-harvest-green">Quick Stats</h3>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Member Since</span>
                        <span className="font-bold">2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total RFQs Posted</span>
                        <span className="font-bold">{stats.totalRfqs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Active Deals</span>
                        <span className="font-bold">{stats.totalDeals}</span>
                      </div>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          )}

          {/* TAB: My Activity */}
          {activeTab === "activity" && (
            <div className="space-y-8">
              {/* My RFQs */}
              <section className="rounded-[2rem] bg-white p-8 shadow-soft">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-2xl font-black text-harvest-green">My RFQs</h2>
                    <p className="text-sm text-gray-500">Track your sourcing requests and responses from suppliers.</p>
                  </div>
                  <Link to="/create-rfq" className="inline-flex items-center gap-2 rounded-2xl bg-harvest-green px-5 py-3 text-sm font-bold text-white hover:bg-green-700">
                    <FileText size={16} />
                    New RFQ
                  </Link>
                </div>
                <div className="mt-6 space-y-4">
                  {myRfqs.length > 0 ? (
                    myRfqs.map((rfq) => (
                      <div key={rfq.id} className="rounded-2xl border border-gray-100 bg-harvest-soft p-5 transition hover:shadow-sm">
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-black text-harvest-green">{rfq.product}</h3>
                              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                                rfq.status === "Open" || rfq.status === "open" 
                                  ? "bg-green-100 text-green-700" 
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {rfq.status}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                              <span>📍 {rfq.location}</span>
                              <span>📦 {rfq.quantity}</span>
                              {rfq.target_price && <span>💰 {rfq.target_price}</span>}
                            </div>
                          </div>
                          <Link
                            to={`/rfqs/${rfq.id}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-harvest-green shadow-sm hover:bg-harvest-soft"
                          >
                            View Offers <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-gray-50 p-8 text-center">
                      <FileText size={40} className="mx-auto text-gray-300" />
                      <p className="mt-3 font-bold text-gray-500">No RFQs yet</p>
                      <p className="mt-1 text-sm text-gray-400">Create your first Request for Quote to start sourcing.</p>
                      <Link to="/create-rfq" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-harvest-green px-5 py-3 text-sm font-bold text-white">
                        Create Your First RFQ
                      </Link>
                    </div>
                  )}
                </div>
                {myRfqs.length > 0 && (
                  <Link to="/rfqs" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-harvest-leaf hover:underline">
                    Browse all RFQs in market <ArrowRight size={14} />
                  </Link>
                )}
              </section>

              {/* My Deals */}
              <section className="rounded-[2rem] bg-white p-8 shadow-soft">
                <h2 className="text-2xl font-black text-harvest-green">My Orders & Deals</h2>
                <p className="text-sm text-gray-500">Ongoing and completed purchase orders.</p>
                {myDeals.length > 0 ? (
                  <div className="mt-6 space-y-4">
                    {myDeals.map((deal) => (
                      <div key={deal.id} className="rounded-2xl border border-gray-100 p-5">
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-black text-harvest-green">{deal.product_name}</h3>
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                                {deal.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                              {deal.quantity} {deal.unit} • {deal.destination_country} • ${deal.total_amount?.toLocaleString?.()}
                            </p>
                          </div>
                          <Link to={`/deals/${deal.id}/tracking`} className="inline-flex items-center gap-2 rounded-xl bg-harvest-green px-4 py-2 text-sm font-bold text-white">
                            Track <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-gray-50 p-8 text-center">
                    <Package size={40} className="mx-auto text-gray-300" />
                    <p className="mt-3 font-bold text-gray-500">No orders yet</p>
                    <p className="mt-1 text-sm text-gray-400">Your purchase orders and deals will appear here once an offer is accepted.</p>
                    <Link to="/products" className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-harvest-green px-5 py-3 text-sm font-bold text-harvest-green">
                      Start Shopping
                    </Link>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB: Saved Products */}
          {activeTab === "saved" && (
            <section className="rounded-[2rem] bg-white p-8 shadow-soft">
              <h2 className="text-2xl font-black text-harvest-green">Recommended Products</h2>
              <p className="text-sm text-gray-500">Products that match your buying interests and recent activity.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {recentProducts.map((product) => (
                  <Link key={product.id} to={`/products/${product.id}`} className="group rounded-2xl border border-gray-100 bg-white p-4 transition hover:shadow-md">
                    <div className="relative">
                      <img src={product.image} alt={product.name} className="h-36 w-full rounded-xl object-cover" />
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setWatchlist(prev => 
                            prev.includes(product.id) 
                              ? prev.filter(id => id !== product.id) 
                              : [...prev, product.id]
                          );
                        }}
                        className="absolute right-2 top-2 rounded-full bg-white p-2 shadow transition hover:scale-110"
                      >
                        <Heart 
                          size={16} 
                          className={watchlist.includes(product.id) ? "fill-red-500 text-red-500" : "text-gray-400"} 
                        />
                      </button>
                    </div>
                    <h3 className="mt-3 font-bold text-gray-800 group-hover:text-harvest-green">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.country}</p>
                    <p className="mt-2 text-sm font-bold text-harvest-green">{product.price}</p>
                  </Link>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link to="/products" className="inline-flex items-center gap-2 rounded-2xl bg-harvest-green px-6 py-3 font-bold text-white">
                  Browse All Products <ArrowRight size={18} />
                </Link>
              </div>
            </section>
          )}

          {/* TAB: Account Settings */}
          {activeTab === "settings" && (
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="rounded-[2rem] bg-white p-8 shadow-soft lg:col-span-2">
                <h2 className="text-2xl font-black text-harvest-green">Account Settings</h2>
                <p className="mt-2 text-sm text-gray-500">Manage your HarvestLink account preferences.</p>
                
                <div className="mt-8 space-y-6">
                  <div className="rounded-2xl bg-harvest-soft p-5">
                    <h3 className="font-bold text-harvest-green">Account Information</h3>
                    <div className="mt-3 space-y-2 text-sm text-gray-600">
                      <p><strong>Email:</strong> {localStorage.getItem("harvestlink_email") || "Not set"}</p>
                      <p><strong>Name:</strong> {localStorage.getItem("harvestlink_full_name") || "Not set"}</p>
                      <p><strong>Role:</strong> Buyer</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-harvest-soft p-5">
                    <h3 className="font-bold text-harvest-green">Verification Status</h3>
                    <div className="mt-3 flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        company?.verification_status === "verified"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {company?.verification_status === "verified" ? "Verified" : "Pending Verification"}
                      </span>
                      {company?.verification_status !== "verified" && (
                        <Link to="/buyer-verification" className="text-sm font-bold text-harvest-orange hover:underline">
                          Get Verified Now
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-harvest-soft p-5">
                    <h3 className="font-bold text-harvest-green">Preferences</h3>
                    <div className="mt-3 space-y-3 text-sm text-gray-600">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
                        Email notifications for new RFQ offers
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
                        Email notifications for deal updates
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
                        Weekly supplier matching digest
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-3xl bg-white p-6 shadow-soft">
                  <h3 className="text-lg font-black text-harvest-green">Need Help?</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Our support team is available to help you with sourcing, account issues, or platform questions.
                  </p>
                  <button className="mt-4 w-full rounded-2xl border border-harvest-green px-5 py-3 font-bold text-harvest-green hover:bg-harvest-soft">
                    Contact Support
                  </button>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-soft">
                  <h3 className="text-lg font-black text-harvest-green">Security</h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <Link to="/password-reset" className="flex items-center gap-2 font-bold text-harvest-green hover:underline">
                      <ArrowRight size={14} />
                      Change Password
                    </Link>
                    <Link to="/verify-email" className="flex items-center gap-2 font-bold text-harvest-green hover:underline">
                      <ArrowRight size={14} />
                      Verify Email
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>

        {message && (
          <div className="mt-6 rounded-[2rem] bg-blue-50 p-4 text-blue-900">
            {message}
          </div>
        )}
      </main>
    </PageShell>
  );
}