import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Package, Tag } from "lucide-react";

export default function RFQCard({ rfq }) {
  return (
    <div className="rounded-3xl border border-green-900/10 bg-white p-5 shadow-sm hover:shadow-soft">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-black text-harvest-green">{rfq.product}</h3>
          <p className="text-xs uppercase tracking-wide text-gray-400">{rfq.id}</p>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">{rfq.status}</span>
      </div>
      <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
        <div className="flex gap-2"><MapPin size={16}/> {rfq.location}</div>
        <div className="flex gap-2"><Package size={16}/> {rfq.quantity}</div>
        <div className="flex gap-2"><Tag size={16}/> {rfq.target}</div>
        <div className="flex gap-2"><CalendarDays size={16}/> {rfq.validUntil}</div>
      </div>
      <div className="mt-4 rounded-2xl bg-harvest-soft p-3 text-sm">
        <div><b>Certifications:</b> {rfq.certification}</div>
        <div><b>Incoterms:</b> {rfq.incoterm}</div>
      </div>
      <div className="mt-5 flex gap-3">
        <Link to={`/rfqs/${rfq.id}`} className="flex-1 rounded-xl border border-harvest-green px-4 py-2 text-center text-sm font-bold text-harvest-green">View Details</Link>
        <Link to="/register" className="flex-1 rounded-xl bg-harvest-orange px-4 py-2 text-center text-sm font-bold text-white">Submit Quote</Link>
      </div>
    </div>
  );
}
