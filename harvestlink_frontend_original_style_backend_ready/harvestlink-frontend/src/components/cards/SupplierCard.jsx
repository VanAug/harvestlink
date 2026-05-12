import { Link } from "react-router-dom";
import { BadgeCheck, Factory, Globe2 } from "lucide-react";

export default function SupplierCard({ supplier }) {
  return (
    <div className="rounded-3xl border border-green-900/10 bg-white p-5 shadow-sm hover:shadow-soft">
      <img src={supplier.image} alt={supplier.name} className="mb-4 h-44 w-full rounded-2xl object-cover" />
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-black text-harvest-green">{supplier.name}</h3>
        {supplier.verified && <BadgeCheck className="text-harvest-leaf" size={20}/>}
      </div>
      <p className="text-sm text-gray-500">{supplier.type} • {supplier.country}</p>
      <div className="mt-4 space-y-2 text-sm text-gray-700">
        <div className="flex gap-2"><Factory size={16}/> Capacity: {supplier.capacity}</div>
        <div className="flex gap-2"><Globe2 size={16}/> Markets: {supplier.markets}</div>
      </div>
      <Link to={`/suppliers/${supplier.id}`} className="mt-5 block rounded-xl bg-harvest-green px-4 py-2 text-center text-sm font-bold text-white">View Supplier</Link>
    </div>
  );
}
