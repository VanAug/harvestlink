import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, X } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import { Input } from "../components/forms/Input";
import { apiGet, apiPost, mapRFQ } from "../lib/api";

export default function RFQDetail() {
  const { id } = useParams();
  const [rfq, setRfq] = useState(null);
  const [offers, setOffers] = useState([]);
  const [company, setCompany] = useState(null);
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [selectedOffers, setSelectedOffers] = useState([]);
  const [form, setForm] = useState({
    price: "",
    quantity: "",
    delivery_terms: "FOB Mombasa",
    estimated_delivery_date: "",
    notes: "",
    document: "",
  });

  async function load() {
    const [apiRfq, apiOffers] = await Promise.all([
      apiGet(`/rfqs/${id}`),
      apiGet(`/rfqs/${id}/offers`),
    ]);
    setRfq(mapRFQ(apiRfq));
    setOffers(apiOffers);
    const userId = Number(localStorage.getItem("harvestlink_user_id"));
    if (userId) {
      const companies = await apiGet(`/companies/owner/${userId}`);
      setCompany(companies.find((item) => item.type === "exporter") || companies[0]);
    }
  }

  useEffect(() => {
    load().catch((error) => setMessage(`RFQ could not load. ${error.message}`));
  }, [id]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitOffer(e) {
    e.preventDefault();
    if (!company) {
      setMessage("Create an exporter company profile before submitting offers.");
      return;
    }
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
      if (form.document) {
        await apiPost("/documents", {
          owner_type: "offer",
          owner_id: offer.id,
          document_type: "Offer Document",
          title: form.document,
          notes: "Submitted with seller offer",
        });
      }
      setMessage("Offer submitted.");
      setForm({ price: "", quantity: "", delivery_terms: "FOB Mombasa", estimated_delivery_date: "", notes: "", document: "" });
      await load();
    } catch (error) {
      setMessage(`Offer could not be submitted. ${error.message}`);
    }
  }

  async function acceptOffer(offerId) {
    try {
      await apiPost(`/rfqs/${id}/offers/${offerId}/accept`, {});
      setMessage("Offer accepted! Creating deal...");
      setTimeout(() => {
        window.location.href = "/deals";
      }, 1500);
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

  function toggleOfferSelection(offerId) {
    setSelectedOffers((current) =>
      current.includes(offerId) ? current.filter((id) => id !== offerId) : [...current, offerId]
    );
  }

  const selectedOffersData = offers.filter((o) => selectedOffers.includes(o.id));
  const isBuyer = !company || company.type === "buyer";

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        {message && <div className="mb-6 rounded-2xl bg-white p-4 text-sm font-bold text-harvest-green shadow-sm">{message}</div>}
        <div className="grid gap-8 lg:grid-cols-3">
          <section className="space-y-8 lg:col-span-2">
            <div className="rounded-[2rem] bg-white p-8 shadow-soft">
              <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-700">{rfq?.status || "loading"}</span>
              <h1 className="mt-5 text-5xl font-black text-harvest-green">{rfq?.product || "RFQ"}</h1>
              <p className="mt-3 text-gray-600">{rfq?.location}</p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {Object.entries({ Quantity: rfq?.quantity, "Target Price": rfq?.target, "Valid Until": rfq?.validUntil, Incoterms: rfq?.incoterm }).map(([key, value]) => (
                  <div key={key} className="rounded-2xl bg-harvest-soft p-4">
                    <div className="text-xs text-gray-400">{key}</div>
                    <div className="font-black">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-harvest-green">Submitted Offers</h2>
                {isBuyer && selectedOffers.length > 0 && (
                  <button
                    onClick={() => setViewMode(viewMode === "list" ? "compare" : "list")}
                    className="rounded-xl bg-harvest-green px-4 py-2 text-sm font-bold text-white"
                  >
                    {viewMode === "list" ? "Compare Selected" : "Back to List"}
                  </button>
                )}
              </div>

              {viewMode === "compare" && selectedOffersData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left font-bold">Exporter</th>
                        {selectedOffersData.map((o) => (
                          <th key={o.id} className="px-4 py-3 text-left font-bold">
                            {o.exporter_name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-3 font-bold">Unit Price (USD)</td>
                        {selectedOffersData.map((o) => (
                          <td key={o.id} className="px-4 py-3">
                            ${o.price}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-3 font-bold">Quantity</td>
                        {selectedOffersData.map((o) => (
                          <td key={o.id} className="px-4 py-3">
                            {o.quantity}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-3 font-bold">Delivery Terms</td>
                        {selectedOffersData.map((o) => (
                          <td key={o.id} className="px-4 py-3">
                            {o.delivery_terms}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-3 font-bold">Est. Delivery</td>
                        {selectedOffersData.map((o) => (
                          <td key={o.id} className="px-4 py-3">
                            {o.estimated_delivery_date}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold">Action</td>
                        {selectedOffersData.map((o) => (
                          <td key={o.id} className="px-4 py-3">
                            {isBuyer && o.status === "submitted" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => acceptOffer(o.id)}
                                  className="rounded-lg bg-green-500 px-3 py-2 text-xs font-bold text-white hover:bg-green-600"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => rejectOffer(o.id)}
                                  className="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white hover:bg-red-600"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-3">
                  {offers.map((offer) => (
                    <div key={offer.id} className="rounded-2xl bg-harvest-soft p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {isBuyer && (
                            <input
                              type="checkbox"
                              checked={selectedOffers.includes(offer.id)}
                              onChange={() => toggleOfferSelection(offer.id)}
                              className="h-5 w-5 cursor-pointer"
                            />
                          )}
                          <div>
                            <b>{offer.exporter_name}</b>
                            <div className="text-sm text-gray-600">USD {offer.price} - {offer.quantity} units - {offer.delivery_terms}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-harvest-green">{offer.status}</span>
                          {isBuyer && offer.status === "submitted" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => acceptOffer(offer.id)}
                                className="rounded-lg bg-green-500 px-3 py-2 text-xs font-bold text-white hover:bg-green-600"
                                title="Accept offer"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => rejectOffer(offer.id)}
                                className="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white hover:bg-red-600"
                                title="Reject offer"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {offer.notes && <div className="mt-2 text-sm text-gray-600 italic">"{offer.notes}"</div>}
                    </div>
                  ))}
                  {!offers.length && <div className="rounded-2xl bg-harvest-soft p-4 text-sm text-gray-600">No offers submitted yet.</div>}
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-3xl bg-white p-7 shadow-soft">
            <h3 className="text-xl font-black text-harvest-green">Submit Offer</h3>
            {!company && <Link to="/exporter/profile" className="mt-3 block rounded-2xl bg-harvest-soft p-3 text-sm font-bold text-harvest-green">Create exporter profile first</Link>}
            <form onSubmit={submitOffer} className="mt-5 space-y-4">
              <Input required label="Unit Price (USD)" type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateField("price", e.target.value)} placeholder="1250" />
              <Input required label="Available Quantity" type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => updateField("quantity", e.target.value)} placeholder="20" />
              <Input required label="Incoterms / Delivery Terms" value={form.delivery_terms} onChange={(e) => updateField("delivery_terms", e.target.value)} placeholder="FOB Mombasa" />
              <Input required label="Estimated Delivery Date" type="date" value={form.estimated_delivery_date} onChange={(e) => updateField("estimated_delivery_date", e.target.value)} />
              <Input label="Offer Document Reference" value={form.document} onChange={(e) => updateField("document", e.target.value)} placeholder="proforma-invoice.pdf" />
              <Input label="Notes" textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Describe packing, certifications, lead time, and terms." />
              <button className="w-full rounded-2xl bg-harvest-orange px-5 py-3 font-bold text-white">Submit Offer</button>
            </form>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}
