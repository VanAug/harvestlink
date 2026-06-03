import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, Paperclip, X } from "lucide-react";
import PageShell from "../layout/PageShell";
import { Input } from "../forms/Input";
import { apiGet, apiPost, apiPostMultipart, mapRFQ } from "../../lib/api";

export default function RFQDetail() {
  const { id } = useParams();
  const [rfq, setRfq] = useState(null);
  const [offers, setOffers] = useState([]);
  const [company, setCompany] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    price: "",
    quantity: "",
    delivery_terms: "FOB Mombasa",
    estimated_delivery_date: "",
    notes: "",
  });

  // Offer document upload
  const [docFile, setDocFile] = useState(null);
  const [docFileName, setDocFileName] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const fileRef = useRef(null);

  async function load() {
    const [apiRfq, apiOffers] = await Promise.all([
      apiGet(`/rfqs/${id}`),
      apiGet(`/rfqs/${id}/offers`),
    ]);
    setRfq(mapRFQ(apiRfq));
    setOffers(apiOffers);
    const userId = Number(localStorage.getItem("harvestlink_user_id"));
    const userRole = localStorage.getItem("harvestlink_role");
    if (userId) {
      const companies = await apiGet(`/companies/owner/${userId}`);
      if (userRole === "exporter" || userRole === "supplier") {
        setCompany(companies.find((item) => item.type === "exporter") || null);
      } else if (userRole === "buyer") {
        setCompany(companies.find((item) => item.type === "buyer") || null);
      } else {
        setCompany(null);
      }
    }
  }

  useEffect(() => {
    load().catch((error) => setMessage(`RFQ could not load. ${error.message}`));
  }, [id]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleDocFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFile(file);
    setDocFileName(file.name);
    // Auto-fill title from filename if empty
    if (!docTitle) setDocTitle(file.name.replace(/\.[^.]+$/, ""));
  }

  function clearDocFile() {
    setDocFile(null);
    setDocFileName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submitOffer(e) {
    e.preventDefault();
    if (!company) {
      setMessage("Create an exporter company profile before submitting offers.");
      return;
    }
    setSubmitting(true);
    try {
      const offer = await apiPost(`/rfqs/${id}/offers`, {
        exporter_company_id: company.id,
        exporter_name: company.name,
        price: Number(form.price),
        quantity: Number(form.quantity),
        delivery_terms: form.delivery_terms,
        estimated_delivery_date: form.estimated_delivery_date,
        notes: form.notes,
      });

      // Upload offer document as a real file if provided
      if (docFile && offer?.id) {
        const formData = new FormData();
        formData.append("owner_type", "offer");
        formData.append("owner_id", String(offer.id));
        formData.append("document_type", "Offer Document");
        formData.append("title", docTitle || docFileName || "Offer Document");
        formData.append("file", docFile);
        await apiPostMultipart("/documents/upload", formData);
      }

      setMessage("Offer submitted successfully.");
      setForm({ price: "", quantity: "", delivery_terms: "FOB Mombasa", estimated_delivery_date: "", notes: "" });
      clearDocFile();
      setDocTitle("");
      await load();
    } catch (error) {
      setMessage(`Offer could not be submitted. ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function acceptOffer(offerId) {
    try {
      await apiPost(`/rfqs/${id}/offers/${offerId}/accept`, {});
      setMessage("Offer accepted! Creating deal room...");
      setTimeout(() => { window.location.href = "/deals"; }, 1500);
    } catch (error) {
      setMessage(`Offer could not be accepted. ${error.message}`);
    }
  }

  async function rejectOffer(offerId) {
    try {
      await apiPost(`/rfqs/${id}/offers/${offerId}/reject`, {});
      setMessage("Offer rejected.");
      await load();
    } catch (error) {
      setMessage(`Offer could not be rejected. ${error.message}`);
    }
  }

  const userRole = localStorage.getItem("harvestlink_role");
  const isExporter = userRole === "exporter" || userRole === "supplier";
  const isBuyer = userRole === "buyer";
  const offersTitle = isExporter ? "Submitted Offers" : isBuyer ? "Received Offers" : "Offers";
  // Only the buyer who created the RFQ can accept/reject offers
  const isRfqCreator = isBuyer && company && rfq?.buyer_company_id === company.id;

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        {message && (
          <div className="mb-6 rounded-2xl bg-white p-4 text-sm font-bold text-harvest-green shadow-sm">
            {message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="space-y-8 lg:col-span-2">
            {/* RFQ details card */}
            <div className="rounded-[2rem] bg-white p-8 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-700">
                  {rfq?.status || "loading"}
                </span>
                {rfq?.buyer_company_name && (
                  <span className="rounded-full bg-blue-100 px-4 py-2 text-xs font-bold text-blue-700">
                    {rfq.buyer_company_name}
                  </span>
                )}
              </div>
              <h1 className="mt-5 text-5xl font-black text-harvest-green">{rfq?.product || "RFQ"}</h1>
              <p className="mt-3 text-gray-600">{rfq?.location}</p>
              <div className="mt-5 rounded-2xl bg-harvest-soft p-4 text-sm">
                <span className="font-bold">Buyer: </span>
                <span className="text-gray-700">{rfq?.buyer_company_name || "Loading..."}</span>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {Object.entries({
                  Quantity: rfq?.quantity,
                  "Target Price": rfq?.target,
                  "Valid Until": rfq?.validUntil,
                  Incoterms: rfq?.incoterm,
                }).map(([key, value]) => (
                  <div key={key} className="rounded-2xl bg-harvest-soft p-4">
                    <div className="text-xs text-gray-400">{key}</div>
                    <div className="font-black">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Offers list */}
            <div className="rounded-3xl bg-white p-7 shadow-sm">
              <h2 className="mb-5 text-2xl font-black text-harvest-green">{offersTitle}</h2>
              <div className="space-y-3">
                {offers.map((offer) => (
                  <div key={offer.id} className="rounded-2xl bg-harvest-soft p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <b>{offer.exporter_name}</b>
                        <div className="text-sm text-gray-600">
                          USD {offer.price} · {offer.quantity} units · {offer.delivery_terms}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-harvest-green">
                          {isRfqCreator && offer.status === "submitted" ? "Pending" : offer.status}
                        </span>
                        {isRfqCreator && offer.status === "submitted" && (
                          <div className="flex gap-1">
                            <button onClick={() => acceptOffer(offer.id)} className="rounded-lg bg-green-500 px-3 py-2 text-xs font-bold text-white hover:bg-green-600" title="Accept offer"><Check size={14} /></button>
                            <button onClick={() => rejectOffer(offer.id)} className="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white hover:bg-red-600" title="Reject offer"><X size={14} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                    {offer.notes && (
                      <div className="mt-2 text-sm italic text-gray-600">"{offer.notes}"</div>
                    )}
                  </div>
                ))}
                {!offers.length && (
                  <div className="rounded-2xl bg-harvest-soft p-4 text-sm text-gray-600">
                    No offers submitted yet.
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="rounded-3xl bg-white p-7 shadow-soft">
            {isExporter ? (
              <>
                <h3 className="text-xl font-black text-harvest-green">Submit Offer</h3>
                <form onSubmit={submitOffer} className="mt-5 space-y-4">
                  <Input
                    required
                    label="Unit Price (USD)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    placeholder="1250"
                  />
                  <Input
                    required
                    label="Available Quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.quantity}
                    onChange={(e) => updateField("quantity", e.target.value)}
                    placeholder="20"
                  />
                  <Input
                    required
                    label="Incoterms / Delivery Terms"
                    value={form.delivery_terms}
                    onChange={(e) => updateField("delivery_terms", e.target.value)}
                    placeholder="FOB Mombasa"
                  />
                  <Input
                    required
                    label="Estimated Delivery Date"
                    type="date"
                    value={form.estimated_delivery_date}
                    onChange={(e) => updateField("estimated_delivery_date", e.target.value)}
                  />
                  <Input
                    label="Notes"
                    textarea
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Describe packing, certifications, lead time, and terms."
                  />

                  {/* Real file upload for offer document */}
                  <div>
                    <span className="mb-2 block text-sm font-bold text-gray-800">
                      Offer Document <span className="font-normal text-gray-400">(optional)</span>
                    </span>
                    {docFile ? (
                      <div className="flex items-center justify-between rounded-2xl border border-harvest-green bg-harvest-soft px-4 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Paperclip size={14} className="text-harvest-green" />
                          <span className="max-w-[140px] truncate font-semibold text-harvest-green">
                            {docFileName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={clearDocFile}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-500 hover:border-harvest-green hover:text-harvest-green"
                      >
                        <Paperclip size={16} />
                        Attach document (PDF, JPG, DOCX)
                      </button>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleDocFileChange}
                      className="sr-only"
                    />
                    {docFile && (
                      <Input
                        label="Document title"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="Proforma Invoice"
                        className="mt-3"
                      />
                    )}
                  </div>

                  <button
                    disabled={submitting}
                    className="w-full rounded-2xl bg-harvest-orange px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Submitting..." : "Submit Offer"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h3 className="text-xl font-black text-harvest-green">Offer Responses</h3>
                <p className="mt-3 text-sm text-gray-600">
                  This RFQ is visible to exporters for sourcing. If you are a buyer, review the
                  received offers above.
                </p>
                <p className="mt-4 rounded-2xl bg-harvest-soft p-3 text-sm text-gray-700">
                  Exporters can submit offers by creating or selecting an exporter company profile.
                </p>
                <Link
                  to="/exporter/profile"
                  className="mt-5 inline-flex rounded-2xl bg-harvest-green px-5 py-3 text-sm font-bold text-white"
                >
                  Create exporter profile
                </Link>
              </>
            )}
          </aside>
        </div>
      </main>
    </PageShell>
  );
}