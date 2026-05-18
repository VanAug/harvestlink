import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Package, MapPin, Calendar, Truck } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import { Input } from "../components/forms/Input";
import { apiGet, apiPost, apiPatch } from "../lib/api";

const statusSteps = ["pending", "picked_up", "in_transit", "out_for_delivery", "delivered"];
const statusColors = {
  pending: "bg-gray-200",
  picked_up: "bg-blue-200",
  in_transit: "bg-blue-400",
  out_for_delivery: "bg-orange-400",
  delivered: "bg-green-500",
};

export default function ShippingTracking() {
  const { dealId } = useParams();
  const [deal, setDeal] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [message, setMessage] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    status: "pending",
    location: "",
    notes: "",
  });

  async function load() {
    try {
      const dealData = await apiGet(`/deals/${dealId}`);
      setDeal(dealData);

      const trackingList = await apiGet(`/tracking?deal_id=${dealId}`);
      if (trackingList.length > 0) {
        setTracking(trackingList[0]);
        setForm({
          status: trackingList[0].status,
          location: trackingList[0].location || "",
          notes: trackingList[0].notes || "",
        });
      }
    } catch (error) {
      setMessage(`Failed to load data. ${error.message}`);
    }
  }

  useEffect(() => {
    load();
  }, [dealId]);

  async function createTracking(e) {
    e.preventDefault();
    try {
      const created = await apiPost(`/deals/${dealId}/tracking`, {
        deal_id: Number(dealId),
        tracking_number: form.tracking_number || undefined,
        carrier: form.carrier || undefined,
        estimated_delivery: form.estimated_delivery || undefined,
      });
      setTracking(created);
      setMessage("Tracking created successfully");
    } catch (error) {
      setMessage(`Failed to create tracking. ${error.message}`);
    }
  }

  async function updateTracking(e) {
    e.preventDefault();
    if (!tracking) return;
    try {
      const updated = await apiPatch(`/tracking/${tracking.id}`, {
        status: form.status,
        location: form.location,
        notes: form.notes,
      });
      setTracking(updated);
      setEditMode(false);
      setMessage("Tracking updated successfully");
    } catch (error) {
      setMessage(`Failed to update tracking. ${error.message}`);
    }
  }

  const currentStatusIndex = statusSteps.indexOf(form.status);

  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-4 py-12 lg:px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-harvest-green">Shipping & Delivery Tracking</h1>
          {deal && <p className="mt-2 text-gray-600">Deal #{deal.id} - {deal.product_name}</p>}
        </div>

        {message && (
          <div className="mb-6 rounded-[2rem] bg-blue-50 p-4 text-blue-900">
            {message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {tracking ? (
              <div className="rounded-[2rem] bg-white p-8 shadow-soft">
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-harvest-green mb-4">Shipment Status</h2>
                  
                  <div className="flex justify-between items-center mb-4">
                    {statusSteps.map((step, idx) => (
                      <div key={step} className="flex flex-col items-center flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-2 ${
                            idx <= currentStatusIndex ? statusColors[step] : "bg-gray-300"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="text-xs text-center text-gray-600 capitalize">{step.replace(/_/g, " ")}</div>
                      </div>
                    ))}
                  </div>

                  <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
                    <div
                      className="h-2 bg-harvest-green rounded-full transition-all duration-300"
                      style={{ width: `${((currentStatusIndex + 1) / statusSteps.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  {tracking.tracking_number && (
                    <div className="rounded-2xl bg-harvest-soft p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Package size={16} />
                        Tracking Number
                      </div>
                      <div className="font-bold">{tracking.tracking_number}</div>
                    </div>
                  )}
                  {tracking.carrier && (
                    <div className="rounded-2xl bg-harvest-soft p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Truck size={16} />
                        Carrier
                      </div>
                      <div className="font-bold">{tracking.carrier}</div>
                    </div>
                  )}
                  {tracking.location && (
                    <div className="rounded-2xl bg-harvest-soft p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <MapPin size={16} />
                        Current Location
                      </div>
                      <div className="font-bold">{tracking.location}</div>
                    </div>
                  )}
                  {tracking.estimated_delivery && (
                    <div className="rounded-2xl bg-harvest-soft p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Calendar size={16} />
                        Est. Delivery
                      </div>
                      <div className="font-bold">{tracking.estimated_delivery}</div>
                    </div>
                  )}
                  {tracking.actual_delivery && (
                    <div className="rounded-2xl bg-green-50 p-4">
                      <div className="flex items-center gap-2 text-sm text-green-600 mb-1">
                        <Calendar size={16} />
                        Delivered
                      </div>
                      <div className="font-bold text-green-700">{tracking.actual_delivery}</div>
                    </div>
                  )}
                </div>

                {tracking.notes && (
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <div className="text-sm font-bold text-gray-700 mb-2">Notes</div>
                    <div className="text-gray-600">{tracking.notes}</div>
                  </div>
                )}

                {editMode ? (
                  <form onSubmit={updateTracking} className="mt-6 space-y-4">
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 font-semibold"
                    >
                      {statusSteps.map((step) => (
                        <option key={step} value={step}>
                          {step.replace(/_/g, " ").toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <Input
                      label="Current Location"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g., Port of Singapore"
                    />
                    <Input
                      label="Notes"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      textarea
                      placeholder="Add any tracking notes"
                    />
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 rounded-2xl bg-harvest-green px-4 py-3 font-bold text-white hover:bg-green-700"
                      >
                        Save Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="flex-1 rounded-2xl border border-gray-300 px-4 py-3 font-bold hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="mt-6 rounded-2xl bg-harvest-green px-6 py-3 font-bold text-white hover:bg-green-700"
                  >
                    Update Tracking
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-[2rem] bg-white p-8 shadow-soft">
                <h2 className="text-2xl font-black text-harvest-green mb-4">Create Tracking</h2>
                <form onSubmit={createTracking} className="space-y-4">
                  <Input
                    label="Tracking Number"
                    placeholder="e.g., FEDEX123456"
                    onChange={(e) => setForm({ ...form, tracking_number: e.target.value })}
                  />
                  <Input
                    label="Carrier"
                    placeholder="e.g., FedEx, DHL, UPS"
                    onChange={(e) => setForm({ ...form, carrier: e.target.value })}
                  />
                  <Input
                    label="Estimated Delivery Date"
                    type="date"
                    onChange={(e) => setForm({ ...form, estimated_delivery: e.target.value })}
                  />
                  <button type="submit" className="w-full rounded-2xl bg-harvest-green px-6 py-3 font-bold text-white hover:bg-green-700">
                    Create Tracking
                  </button>
                </form>
              </div>
            )}
          </div>

          <aside className="rounded-[2rem] bg-harvest-soft p-6 h-fit">
            <h3 className="text-lg font-black text-harvest-green mb-4">Deal Summary</h3>
            {deal && (
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-600">Product</div>
                  <div className="font-bold">{deal.product_name}</div>
                </div>
                <div>
                  <div className="text-gray-600">Quantity</div>
                  <div className="font-bold">{deal.quantity} {deal.unit}</div>
                </div>
                <div>
                  <div className="text-gray-600">Amount</div>
                  <div className="font-bold">${deal.total_amount}</div>
                </div>
                <div>
                  <div className="text-gray-600">Destination</div>
                  <div className="font-bold">{deal.destination_country}</div>
                </div>
                <div>
                  <div className="text-gray-600">Delivery Terms</div>
                  <div className="font-bold">{deal.delivery_terms}</div>
                </div>
                <div>
                  <div className="text-gray-600">Status</div>
                  <div className="font-bold capitalize">{deal.status}</div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </PageShell>
  );
}
