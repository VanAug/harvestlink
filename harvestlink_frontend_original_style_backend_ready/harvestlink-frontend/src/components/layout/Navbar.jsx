import { Link, NavLink } from "react-router-dom";
import { Leaf, Menu } from "lucide-react";

const navItems = [
  ["Products", "/products"],
  ["RFQ Market", "/rfqs"],
  ["Suppliers", "/suppliers"],
  ["Deals", "/deals"],
  ["Escrow", "/escrow"],
  ["Financing", "/financing"],
  ["Pricing", "/pricing"],
  ["Buyer Verification", "/buyer-verification"],
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-green-900/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-harvest-green text-white">
            <Leaf size={22} />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-harvest-green">HARVEST<span className="text-harvest-orange">LINK</span></div>
            <div className="text-xs text-gray-500">Connecting Global Agriculture</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium lg:flex">
          {navItems.map(([label, path]) => (
            <NavLink key={path} to={path} className={({isActive}) => isActive ? "text-harvest-leaf" : "text-gray-700 hover:text-harvest-leaf"}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/login" className="rounded-xl border border-harvest-green px-5 py-2 text-sm font-semibold text-harvest-green hover:bg-harvest-soft">Login</Link>
          <Link to="/register" className="rounded-xl bg-harvest-green px-5 py-2 text-sm font-semibold text-white shadow-soft hover:bg-green-900">Join Now</Link>
        </div>

        <button className="rounded-xl border p-2 lg:hidden">
          <Menu />
        </button>
      </div>
    </header>
  );
}
