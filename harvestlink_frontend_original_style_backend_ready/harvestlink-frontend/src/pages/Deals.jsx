import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/layout/PageShell";
import { Input } from "../components/forms/Input";
import { apiGet, apiPatch, apiPost } from "../lib/api";
import { LockKeyhole, MessageSquare, PackageCheck, Truck } from "lucide-react";

const fallbackDeals = [
  { id: 1, product_name: "Hass Avocados", quantity: 20, unit: "tons", total_amount: 25000, currency: "USD", destination_country: "UAE", delivery_terms: "FOB Mombasa", status: "funds_in_escrow", escrow_status: "funded" },
  { id: 2, product_name: "Fresh Cut Flowers", quantity: 40, unit: "boxes", total_amount: 14800, currency: "USD", destination_country: "Netherlands", delivery_terms: "CIF Rotterdam", status: "completed", escrow_status: "released" },
];

export default function Deals() {
  const [company, setCompany] = useState(null);
  const [deals, setDeals] = useState(fallbackDeals);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [docForm, setDocForm] = useState({ document_type: "Invoice", title: "", file_url: "", notes: "" });
  const [financing, setFinancing] = useState({ requested_amount: "", purpose: "" });
  const [notice, setNotice] = useState("");

  const activeDeal = useMemo(() => deals.find((deal) => deal.id === activeId) || deals[0], [deals, activeId]);

  async function load() {
    const userId = Number(localStorage.getItem("harvestlink_user_id"));
    let exporter = null;
    if (userId) {
      const companies = await apiGet(`/companies/owner/${userId}`);
      exporter = companies.find((item) => item.type === "exporter") || companies[0];
      setCompany(exporter);
    }
    const apiDeals = await apiGet(exporter ? `/deals?exporter_company_id=${exporter.id}` : "/deals");
    setDeals(apiDeals.length ? apiDeals : fallbackDeals);
    const selected = apiDeals.find((deal) => deal.id === activeId) || apiDeals[0] || fallbackDeals[0];
    setActiveId(selected?.id);
    if (selected) {
      setMessages(await apiGet(`/deals/${selected.id}/messages`));
      setDocuments(await apiGet(`/documents?owner_type=deal&owner_id=${selected.id}`));
    }
  }

  useEffect(() => {
    load().catch((error) => setNotice(`Using fallback deals because API is unavailable: ${error.message}`));
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
    await apiPost("/documents", {
      owner_type: "deal",
      owner_id: activeDeal.id,
      ...docForm,
    });
    setDocForm({ document_type: "Invoice", title: "", file_url: "", notes: "" });
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
          <div className="inline-flex rounded-full bg-harvest-soft px-4 py-2 text-sm font-bold text-harvest-green">Exporter Deal Flow</div>
          <h1 className="mt-4 text-5xl font-black text-harvest-green">Deal Rooms</h1>
          <p className="mt-3 max-w-2xl text-gray-600">Manage messages, fulfillment documents, shipping updates, escrow release, and financing tied to active orders.</p>
          {notice && <div className="mt-5 rounded-2xl bg-harvest-soft p-3 text-sm font-bold text-harvest-green">{notice}</div>}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="space-y-4">
            {deals.map((deal) => (
              <button key={deal.id} onClick={() => selectDeal(deal.id)} className={`w-full rounded-3xl bg-white p-5 text-left shadow-sm hover:shadow-soft ${activeDeal?.id === deal.id ? "ring-2 ring-harvest-orange" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-harvest-green">{deal.product_name}</h3>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">{deal.status}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{deal.quantity} {deal.unit} - {deal.destination_country}</p>
                <p className="mt-2 font-black text-harvest-orange">{deal.currency} {deal.total_amount?.toLocaleString?.()}</p>
              </button>
            ))}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-start">
              <div>
                <h2 className="text-3xl font-black text-harvest-green">{activeDeal?.product_name}</h2>
                <p className="mt-2 text-gray-600">{activeDeal?.quantity} {activeDeal?.unit} to {activeDeal?.destination_country}</p>
              </div>
              <span className="rounded-full bg-harvest-green px-4 py-2 text-sm font-bold text-white">Escrow: {activeDeal?.escrow_status}</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-harvest-soft p-4"><PackageCheck className="text-harvest-orange" /><b className="mt-2 block">Amount</b><span>{activeDeal?.currency} {activeDeal?.total_amount?.toLocaleString?.()}</span></div>
              <div className="rounded-2xl bg-harvest-soft p-4"><Truck className="text-harvest-orange" /><b className="mt-2 block">Terms</b><span>{activeDeal?.delivery_terms}</span></div>
              <div className="rounded-2xl bg-harvest-soft p-4"><LockKeyhole className="text-harvest-orange" /><b className="mt-2 block">Escrow</b><span>{activeDeal?.escrow_status}</span></div>
              <div className="rounded-2xl bg-harvest-soft p-4"><MessageSquare className="text-harvest-orange" /><b className="mt-2 block">Messages</b><span>{messages.length}</span></div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => updateStatus("in_fulfillment")} className="rounded-2xl bg-harvest-green px-4 py-2 text-sm font-black text-white">Mark In Fulfillment</button>
              <button onClick={() => updateStatus("shipped")} className="rounded-2xl bg-harvest-orange px-4 py-2 text-sm font-black text-white">Mark Shipped</button>
              <button onClick={requestRelease} className="rounded-2xl border border-harvest-green px-4 py-2 text-sm font-black text-harvest-green">Request Escrow Release</button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl bg-harvest-soft p-5">
                <h3 className="font-black text-harvest-green">Messages</h3>
                <div className="mt-4 max-h-72 space-y-3 overflow-auto">
                  {messages.map((item) => <div key={item.id} className="rounded-2xl bg-white p-4 text-sm text-gray-700"><b>{item.sender_name}</b><p>{item.message}</p></div>)}
                </div>
                <form onSubmit={sendMessage} className="mt-4 flex gap-2">
                  <input value={messageText} onChange={(e) => setMessageText(e.target.value)} className="min-w-0 flex-1 rounded-2xl border border-gray-200 px-4 py-3" placeholder="Message buyer..." />
                  <button className="rounded-2xl bg-harvest-green px-4 py-3 font-bold text-white">Send</button>
                </form>
              </div>

              <div className="rounded-3xl bg-harvest-soft p-5">
                <h3 className="font-black text-harvest-green">Fulfillment Documents</h3>
                <div className="mt-4 space-y-2">
                  {documents.map((doc) => <div key={doc.id} className="rounded-2xl bg-white p-3 text-sm"><b>{doc.document_type}</b><div className="text-gray-600">{doc.title}</div></div>)}
                </div>
                <form onSubmit={submitDocument} className="mt-4 space-y-3">
                  <select value={docForm.document_type} onChange={(e) => setDocForm((current) => ({ ...current, document_type: e.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    {["Invoice", "Packing List", "Certificate", "Bill of Lading", "Shipping Update"].map((type) => <option key={type}>{type}</option>)}
                  </select>
                  <Input required label="Title" value={docForm.title} onChange={(e) => setDocForm((current) => ({ ...current, title: e.target.value }))} placeholder="Commercial invoice #1024" />
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
