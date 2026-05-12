import { Link } from "react-router-dom";
import { BadgeCheck, MapPin } from "lucide-react";

export default function ProductCard({ product }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-green-900/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className="relative h-44 overflow-hidden">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        <span className="absolute left-3 top-3 rounded-full bg-harvest-green px-3 py-1 text-xs font-bold text-white">{product.badge}</span>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-bold text-gray-950">{product.name}</h3>
          <p className="text-sm text-gray-500">{product.category}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin size={15}/>{product.country}</div>
        <div className="flex items-center gap-2 text-sm text-gray-600"><BadgeCheck size={15}/>{product.seller}</div>
        <div className="rounded-2xl bg-harvest-soft p-3 text-sm">
          <div><span className="font-semibold">Price:</span> {product.price}</div>
          <div><span className="font-semibold">MOQ:</span> {product.moq}</div>
        </div>
        <Link to={`/products/${product.id}`} className="block rounded-xl border border-harvest-leaf px-4 py-2 text-center text-sm font-bold text-harvest-leaf hover:bg-harvest-leaf hover:text-white">View Details</Link>
      </div>
    </div>
  );
}
