import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import { Input } from "../components/forms/Input";
import { apiDelete, apiGet, apiPatch, apiPost, apiPostMultipart } from "../lib/api";
import { LockKeyhole, MessageSquare, PackageCheck, Trash2, Truck, Star, MapPin } from "lucide-react";

export default function Deals() {
  const [company, setCompany] = useState(null);
  const [deals, setDeals] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [docForm, setDocForm] = useState({ document_type: "Invoice", title: "", file_url: "", notes: "" });
  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputRef = useRef(null);
  const [financing, setFinancing] = useState({ requested_amount: "", purpose: "" });
  const [notice, setNotice] = useState("");

  const userRole = localStorage.getItem("harvestlink_role");
  const isBuyer = userRole === "buyer";
  const isExporter = userRole === "exporter" || userRole === "supplier";

  const activeDeal = useMemo(() => deals.find((deal) => deal.id === activeId) || deals[0], [deals, activeId]);

  async function load() {
    const userId = Number(localStorage.getItem("harvestlink_user_id"));
    let selectedCompany = null;
    let path = "/deals";

    if (userId) {
      const companies = await apiGet(`/companies/owner/${userId}`);
      const userRole = localStorage.getItem("harvestlink_role");
      // Pick the company that matches the user's role (buyer selects buyer company, exporter selects exporter company)
      if (userRole === "buyer") {
        selectedCompany = companies.find((item) => item.type === "buyer") || companies[0] || null;
      } else if (userRole === "exporter" || userRole === "supplier") {
        selectedCompany = companies.find((item) => item.type === "exporter") || companies[0] || null;
      } else {
        selectedCompany = companies[0] || null;
      }
      if (selectedCompany) {
        setCompany(selectedCompany);
        // Filter deals based on the user's company role
        if (selectedCompany.type === "buyer") {
          path = `/deals?buyer_company_id=${selectedCompany.id}`;
        } else {
          path = `/deals?exporter_company_id=${selectedCompany.id}`;
        }
      }
    }

    const apiDeals = await apiGet(path);
    setDeals(apiDeals);
    const selected = apiDeals.find((deal) => deal.id === activeId) || apiDeals[0] || null;
    setActiveId(selected?.id ?? null);
    if (selected) {
      setMessages(await apiGet(`/deals/${selected.id}/messages`));
      setDocuments(await apiGet(`/documents?owner_type=deal&owner_id=${selected.id}`));
    } else {
      setMessages([]);
      setDocuments([]);
    }
  }

  useEffect(() => {
    load().catch((error) => setNotice(`Unable to load deals: ${error.message}`));
  }, []);

  async function selectDeal(dealId) {
    setActiveId(dealId);
    setMessages(await apiGet(`/deals/${dealId}/messages`));
    setDocuments(await apiGet(`/documents?owner_type=deal&owner_id=${dealId}`));
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!activeDeal || !company || !messageText) return;
    await apiPost(`/deals/${activeDeal.id}/messages`, {
      sender_company_id: company.id,
      sender_name: company.name,
      message: messageText,
    });
    setMessageText("");
    await selectDeal(activeDeal.id);
  }

  async function submitDocument(e) {
    e.preventDefault();
    if (!activeDeal || !docForm.title) return;
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("owner_type", "deal");
      formData.append("owner_id", String(activeDeal.id));
      formData.append("document_type", docForm.document_type);
      formData.append("title", docForm.title);
      if (docForm.notes) formData.append("notes", docForm.notes);
      formData.append("file", file);
      await apiPostMultipart("/documents/upload", formData);
    } else {
      await apiPost("/documents", {
        owner_type: "deal",
        owner_id: activeDeal.id,
        ...docForm,
      });
    }
    setDocForm({ document_type: "Invoice", title: "", file_url: "", notes: "" });
    setSelectedFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    await selectDeal(activeDeal.id);
  }

  async function deleteDocument(documentId) {
    if (!window.confirm("Delete this document?")) return;
    await apiDelete(`/documents/${documentId}`);
    await selectDeal(activeDeal.id);
  }

  async function updateStatus(status) {
    await apiPatch(`/deals/${activeDeal.id}/status`, { status });
    await load();
  }

  async function requestRelease() {
    const escrows = await apiGet("/escrow");
    const escrow = escrows.find((item) => item.deal_id === activeDeal.id);
    if (escrow) {
      await apiPatch(`/escrow/${escrow.id}/status?status=release_requested`, {});
    } else {
      await apiPatch(`/deals/${activeDeal.id}/status`, { status: "release_requested" });
    }
    await load();
  }

  async function requestFinancing(e) {
    e.preventDefault();
    if (!company || !activeDeal) return;
    await apiPost("/financing", {
      exporter_company_id: company.id,
      exporter_name: company.name,
      requested_amount: Number(financing.requested_amount),
      purpose: financing.purpose,
      linked_deal_id: activeDeal.id,
      currency: activeDeal.currency || "USD",
    });
    setFinancing({ requested_amount: "", purpose: "" });
    setNotice("Financing request submitted.");
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-soft">
          <div className="inline-flex rounded-full bg-harvest-soft px-4 py-2 text-sm font-bold text-harvest-green">
            {isBuyer ? "Buyer Deal Room" : isExporter ? "Exporter Deal Flow" : "Deal Room"}
          </div>
          <h1 className="mt-4 text-5xl font-black text-harvest-green">Deal Rooms</h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            {isBuyer 
              ? "View your active purchase orders, communicate with suppliers, track shipments, and manage escrow."
              : isExporter 
                ? "Manage messages, fulfillment documents, shipping updates, escrow release, and financing tied to active orders."
                : "Manage messages, fulfillment documents, shipping updates, escrow release, and financing tied to active orders."}
          </p>
          {notice && <div className="mt-5 rounded-2xl bg-harvest-soft p-3 text-sm font-bold text-harvest-green">{notice}</div>}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="space-y-4">
            {deals.length ? deals.map((deal) => (
              <button key={deal.id} onClick={() => selectDeal(deal.id)} className={`w-full rounded-3xl bg-white p-5 text-left shadow-sm hover:shadow-soft ${activeDeal?.id === deal.id ? "ring-2 ring-harvest-orange" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-harvest-green">{deal.product_name}</h3>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">{deal.status}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{deal.quantity} {deal.unit} - {deal.destination_country}</p>
                <p className="mt-2 font-black text-harvest-orange">{deal.currency} {deal.total_amount?.toLocaleString?.()}</p>
              </button>
            )) : (
              <div className="rounded-3xl bg-white p-6 text-center text-gray-600 shadow-sm">
                <p className="font-bold">No deal rooms found.</p>
                <p className="mt-2">Create or join a deal to start tracking messages, documents, and escrow.</p>
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-start">
              <div>
                <h2 className="text-3xl font-black text-harvest-green">{activeDeal ? activeDeal.product_name : "No deal selected"}</h2>
                <p className="mt-2 text-gray-600">{activeDeal ? `${activeDeal.quantity} ${activeDeal.unit} to ${activeDeal.destination_country}` : "Select a deal from the left to view messages, documents, and status updates."}</p>
              </div>
              <span className="rounded-full bg-harvest-green px-4 py-2 text-sm font-bold text-white">Escrow: {activeDeal?.escrow_status || "N/A"}</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-harvest-soft p-4"><PackageCheck className="text-harvest-orange" /><b className="mt-2 block">Amount</b><span>{activeDeal?.currency} {activeDeal?.total_amount?.toLocaleString?.()}</span></div>
              <div className="rounded-2xl bg-harvest-soft p-4"><Truck className="text-harvest-orange" /><b className="mt-2 block">Terms</b><span>{activeDeal?.delivery_terms}</span></div>
              <div className="rounded-2xl bg-harvest-soft p-4"><LockKeyhole className="text-harvest-orange" /><b className="mt-2 block">Escrow</b><span>{activeDeal?.escrow_status}</span></div>
              <div className="rounded-2xl bg-harvest-soft p-4"><MessageSquare className="text-harvest-orange" /><b className="mt-2 block">Messages</b><span>{messages.length}</span></div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button disabled={!activeDeal} onClick={() => activeDeal && updateStatus("in_fulfillment")} className="rounded-2xl bg-harvest-green px-4 py-2 text-sm font-black text-white disabled:opacity-50 disabled:cursor-not-allowed">Mark In Fulfillment</button>
              <button disabled={!activeDeal} onClick={() => activeDeal && updateStatus("shipped")} className="rounded-2xl bg-harvest-orange px-4 py-2 text-sm font-black text-white disabled:opacity-50 disabled:cursor-not-allowed">Mark Shipped</button>
              <button disabled={!activeDeal} onClick={requestRelease} className="rounded-2xl border border-harvest-green px-4 py-2 text-sm font-black text-harvest-green disabled:opacity-50 disabled:cursor-not-allowed">Request Escrow Release</button>
              <Link to={activeDeal ? `/deals/${activeDeal.id}/tracking` : "#"} className="rounded-2xl bg-blue-500 px-4 py-2 text-sm font-black text-white hover:bg-blue-600 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <MapPin size={16} />
                Track Shipment
              </Link>
              <Link to={activeDeal ? `/deals/${activeDeal.id}/review` : "#"} className="rounded-2xl bg-yellow-500 px-4 py-2 text-sm font-black text-white hover:bg-yellow-600 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <Star size={16} />
                Rate & Review
              </Link>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl bg-harvest-soft p-5">
                <h3 className="font-black text-harvest-green">Messages</h3>
                <div className="mt-4 max-h-72 space-y-3 overflow-auto">
                  {messages.map((item) => <div key={item.id} className="rounded-2xl bg-white p-4 text-sm text-gray-700"><b>{item.sender_name}</b><p>{item.message}</p></div>)}
                </div>
                <form onSubmit={sendMessage} className="mt-4 flex gap-2">
                  <input value={messageText} onChange={(e) => setMessageText(e.target.value)} className="min-w-0 flex-1 rounded-2xl border border-gray-200 px-4 py-3" placeholder={isBuyer ? "Message supplier..." : "Message buyer..."} />
                  <button className="rounded-2xl bg-harvest-green px-4 py-3 font-bold text-white">Send</button>
                </form>
              </div>

              <div className="rounded-3xl bg-harvest-soft p-5">
                <h3 className="font-black text-harvest-green">Fulfillment Documents</h3>
                <div className="mt-4 space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="rounded-2xl bg-white p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <b>{doc.document_type}</b>
                          <div className="text-gray-600">{doc.title}</div>
                        </div>
                        <button type="button" onClick={() => deleteDocument(doc.id)} className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold text-harvest-green hover:underline">
                          View document
                        </a>
                      )}
                      {doc.notes && <div className="text-sm text-gray-500">{doc.notes}</div>}
                    </div>
                  ))}
                </div>
                <form onSubmit={submitDocument} className="mt-4 space-y-3">
                  <select value={docForm.document_type} onChange={(e) => setDocForm((current) => ({ ...current, document_type: e.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    {["Invoice", "Packing List", "Certificate", "Bill of Lading", "Shipping Update"].map((type) => <option key={type}>{type}</option>)}
                  </select>
                  <Input required label="Title" value={docForm.title} onChange={(e) => setDocForm((current) => ({ ...current, title: e.target.value }))} placeholder="Commercial invoice #1024" />
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
                  <Input label="File URL or Reference" value={docForm.file_url} onChange={(e) => setDocForm((current) => ({ ...current, file_url: e.target.value }))} placeholder="invoice.pdf" />
                  <button className="w-full rounded-2xl bg-harvest-orange px-4 py-3 font-bold text-white">Add Document</button>
                </form>
              </div>
            </div>

            <form onSubmit={requestFinancing} className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-gray-100">
              <h3 className="font-black text-harvest-green">Request Financing For This Deal</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
                <Input required label="Amount" type="number" min="0" value={financing.requested_amount} onChange={(e) => setFinancing((current) => ({ ...current, requested_amount: e.target.value }))} placeholder="10000" />
                <Input required label="Purpose" value={financing.purpose} onChange={(e) => setFinancing((current) => ({ ...current, purpose: e.target.value }))} placeholder="Packaging and farmer aggregation for this order" />
                <button className="rounded-2xl bg-harvest-green px-5 py-3 font-black text-white">Submit</button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
