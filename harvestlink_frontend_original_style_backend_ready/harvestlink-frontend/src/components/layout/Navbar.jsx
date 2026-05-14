import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { Leaf, LogOut, Menu, PackagePlus } from "lucide-react";
import { logout } from "../../lib/api";

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
  const [session, setSession] = useState(() => ({
    role: localStorage.getItem("harvestlink_role"),
    name: localStorage.getItem("harvestlink_full_name"),
    email: localStorage.getItem("harvestlink_email"),
  }));

  useEffect(() => {
    function refreshSession() {
      setSession({
        role: localStorage.getItem("harvestlink_role"),
        name: localStorage.getItem("harvestlink_full_name"),
        email: localStorage.getItem("harvestlink_email"),
      });
    }

    window.addEventListener("storage", refreshSession);
    window.addEventListener("harvestlink-auth-changed", refreshSession);
    return () => {
      window.removeEventListener("storage", refreshSession);
      window.removeEventListener("harvestlink-auth-changed", refreshSession);
    };
  }, []);

  const isLoggedIn = Boolean(session.role);
  const dashboardPath = session.role === "buyer"
    ? "/buyer-dashboard"
    : session.role === "admin"
      ? "/admin-dashboard"
      : session.role === "finance_partner"
        ? "/financing"
        : "/exporter-dashboard";
  const roleLabel = session.role === "finance_partner"
    ? "Finance Partner"
    : session.role ? session.role.charAt(0).toUpperCase() + session.role.slice(1) : "";

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
          {isLoggedIn ? (
            <>
              {session.role === "exporter" && (
                <Link to="/exporter/products/new" className="inline-flex items-center gap-2 rounded-xl bg-harvest-orange px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-orange-600">
                  <PackagePlus size={16} />
                  Add Product
                </Link>
              )}
              <Link to={dashboardPath} className="rounded-xl border border-harvest-green px-4 py-2 text-sm font-semibold text-harvest-green hover:bg-harvest-soft">
                <span className="block leading-tight">{session.name || session.email}</span>
                <span className="block text-xs font-bold text-gray-500">{roleLabel}</span>
              </Link>
              <button onClick={logout} className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-harvest-soft" aria-label="Logout">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-xl border border-harvest-green px-5 py-2 text-sm font-semibold text-harvest-green hover:bg-harvest-soft">Login</Link>
              <Link to="/register" className="rounded-xl bg-harvest-green px-5 py-2 text-sm font-semibold text-white shadow-soft hover:bg-green-900">Join Now</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {isLoggedIn && (
            <Link to={dashboardPath} className="rounded-xl border border-harvest-green px-3 py-2 text-xs font-bold text-harvest-green">
              {roleLabel}
            </Link>
          )}
          <button className="rounded-xl border p-2">
            <Menu />
          </button>
        </div>
      </div>
    </header>
  );
}
