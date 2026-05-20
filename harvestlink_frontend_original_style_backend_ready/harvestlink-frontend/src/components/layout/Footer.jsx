import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

const linkMap = {
  "Browse Products": "/products",
  "RFQ Market": "/rfqs",
  "Suppliers": "/suppliers",
  "Categories": "/products",
  "Create RFQ": "/create-rfq",
  "Buyer Verification": "/buyer-verification",
  "How to Buy": "/products",
  "Premium Services": "/pricing",
  "Become a Supplier": "/supplier-verification",
  "Supplier Verification": "/supplier-verification",
  "Pricing Plans": "/pricing",
  "Supplier Resources": "/supplier-verification",
  "About Us": "/",
  "Contact": "/",
  "Careers": "/",
  "News & Insights": "/",
};

export default function Footer() {
  const columns = [
    ["Marketplace", ["Browse Products", "RFQ Market", "Suppliers", "Categories"]],
    ["For Buyers", ["Create RFQ", "Buyer Verification", "How to Buy", "Premium Services"]],
    ["For Suppliers", ["Become a Supplier", "Supplier Verification", "Pricing Plans", "Supplier Resources"]],
    ["Company", ["About Us", "Contact", "Careers", "News & Insights"]],
  ];

  return (
    <footer className="bg-harvest-green text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-5 lg:px-6">
        <div className="lg:col-span-1">
          <Link to="/" className="mb-4 flex items-center gap-2">
            <Leaf />
            <span className="text-xl font-black">HARVESTLINK</span>
          </Link>
          <p className="text-sm text-green-100">Connecting global agricultural markets for a better tomorrow.</p>
        </div>
        {columns.map(([title, links]) => (
          <div key={title}>
            <h4 className="mb-4 font-bold">{title}</h4>
            <div className="space-y-2 text-sm text-green-100">
              {links.map(link => (
                <div key={link}>
                  <Link to={linkMap[link] || "/"} className="block hover:text-white transition-colors">
                    {link}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-5 text-center text-sm text-green-100">© 2026 HarvestLink. All rights reserved.</div>
    </footer>
  );
}