import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { 
  Leaf, LogOut, Menu, PackagePlus, FileText, 
  ChevronDown, User, LayoutDashboard, UserCircle,
  ShoppingBag, Package, Building2
} from "lucide-react";
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
  const navigate = useNavigate();
  const [session, setSession] = useState(() => ({
    role: localStorage.getItem("harvestlink_role"),
    name: localStorage.getItem("harvestlink_full_name"),
    email: localStorage.getItem("harvestlink_email"),
  }));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isLoggedIn = Boolean(session.role);
  const isBuyer = session.role === "buyer";
  const isExporter = session.role === "exporter" || session.role === "supplier";

  const dashboardPath = session.role === "buyer"
    ? "/buyer-dashboard"
    : session.role === "admin"
      ? "/admin-dashboard"
      : session.role === "finance_partner"
        ? "/financing"
        : "/exporter-dashboard";

  const roleLabel = session.role === "finance_partner"
    ? "Finance Partner"
    : session.role
      ? session.role.charAt(0).toUpperCase() + session.role.slice(1)
      : "";

  const buyerMenuItems = [
    { label: "Dashboard", path: "/buyer-dashboard", icon: LayoutDashboard },
    { label: "My Profile", path: "/buyer/profile", icon: UserCircle },
    { label: "Create RFQ", path: "/create-rfq", icon: FileText },
    { label: "My Orders", path: "/deals", icon: ShoppingBag },
  ];

  const exporterMenuItems = [
    { label: "Dashboard", path: "/exporter-dashboard", icon: LayoutDashboard },
    { label: "My Profile", path: "/exporter/profile", icon: UserCircle },
    { label: "My Products", path: "/exporter/products", icon: Package },
    { label: "Deal Rooms", path: "/deals", icon: Building2 },
  ];

  const menuItems = isBuyer ? buyerMenuItems : isExporter ? exporterMenuItems : [];

  function handleLogout() {
    logout();
    setDropdownOpen(false);
    setMobileOpen(false);
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-green-900/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-harvest-green text-white">
            <Leaf size={22} />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-harvest-green">HARVEST<span className="text-harvest-orange">LINK</span></div>
            <div className="text-xs text-gray-500">Connecting Global Agriculture</div>
          </div>
        </Link>

        {/* Desktop Navigation - Original structure preserved */}
        <nav className="hidden items-center gap-7 text-sm font-medium lg:flex">
          {navItems.map(([label, path]) => (
            <NavLink key={path} to={path} className={({isActive}) => isActive ? "text-harvest-leaf" : "text-gray-700 hover:text-harvest-leaf"}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Right Side */}
        <div className="hidden items-center gap-3 lg:flex">
          {isLoggedIn ? (
            <div className="relative flex items-center gap-3" ref={dropdownRef}>
              {/* Exporter quick-add */}
              {isExporter && (
                <Link to="/exporter/products" className="inline-flex items-center gap-2 rounded-xl bg-harvest-orange px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-orange-600">
                  <PackagePlus size={16} />
                  Products
                </Link>
              )}
              {/* Buyer quick-add */}
              {isBuyer && (
                <Link to="/create-rfq" className="inline-flex items-center gap-2 rounded-xl bg-harvest-orange px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-orange-600">
                  <FileText size={16} />
                  Post RFQ
                </Link>
              )}
              {/* Role menu dropdown */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-harvest-green px-4 py-2 text-sm font-semibold text-harvest-green hover:bg-harvest-soft"
              >
                <User size={16} />
                <span className="max-w-[120px] truncate">{session.name || session.email}</span>
                <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              <button onClick={handleLogout} className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-harvest-soft" aria-label="Logout">
                <LogOut size={18} />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-gray-100 bg-white py-2 shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <div className="text-sm font-bold text-harvest-green">{session.name || "User"}</div>
                    <div className="text-xs text-gray-500">{roleLabel}</div>
                  </div>
                  <div className="py-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-harvest-soft hover:text-harvest-green"
                        >
                          <Icon size={16} className="text-gray-400" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                  <div className="border-t border-gray-100 pt-2">
                    <Link
                      to={dashboardPath}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-harvest-soft hover:text-harvest-green"
                    >
                      <LayoutDashboard size={16} className="text-gray-400" />
                      Go to Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="rounded-xl border border-harvest-green px-5 py-2 text-sm font-semibold text-harvest-green hover:bg-harvest-soft">Login</Link>
              <Link to="/register" className="rounded-xl bg-harvest-green px-5 py-2 text-sm font-semibold text-white shadow-soft hover:bg-green-900">Join Now</Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          {isLoggedIn && (
            <Link to={dashboardPath} className="rounded-xl border border-harvest-green px-3 py-2 text-xs font-bold text-harvest-green">
              {roleLabel}
            </Link>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-xl border p-2">
            <Menu />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white lg:hidden">
          <div className="space-y-1 px-4 py-4">
            {isLoggedIn && (
              <>
                <div className="mb-2 px-4 py-2">
                  <div className="text-sm font-bold text-harvest-green">{session.name || "User"}</div>
                  <div className="text-xs text-gray-500">{roleLabel}</div>
                </div>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-harvest-soft"
                    >
                      <Icon size={16} className="text-gray-400" />
                      {item.label}
                    </Link>
                  );
                })}
                <hr className="my-2" />
              </>
            )}
            {navItems.map(([label, path]) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={({isActive}) => `block rounded-xl px-4 py-3 text-sm ${isActive ? "bg-harvest-soft text-harvest-green font-bold" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {label}
              </NavLink>
            ))}
            {isLoggedIn && (
              <hr className="my-2" />
            )}
            {isLoggedIn ? (
              <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50">
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block rounded-xl bg-harvest-green px-4 py-3 text-center text-sm font-bold text-white">Login</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="block rounded-xl border border-harvest-green px-4 py-3 text-center text-sm font-bold text-harvest-green">Join Now</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}