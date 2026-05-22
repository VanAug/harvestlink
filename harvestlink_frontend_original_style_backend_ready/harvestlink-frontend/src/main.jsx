import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import Home from "./pages/Home";
import Products from "./components/Products/Products";
import ProductDetail from "./components/Products/ProductDetail";
import Suppliers from "./pages/Suppliers";
import SupplierProfile from "./components/Profile/SupplierProfile";
import RFQs from "./components/RFQ/RFQs";
import RFQDetail from "./components/RFQ/RFQDetail";
import CreateRFQ from "./components/RFQ/CreateRFQ";
import AddProduct from "./components/Products/AddProduct";
import ExporterProducts from "./components/Products/ExporterProducts";
import ExporterProfile from "./components/Profile/ExporterProfile";
import BuyerProfile from "./components/Profile/BuyerProfile";
import Verification from "./pages/Verification";
import Dashboard from "./components/dashboard/Dashboard";
import Pricing from "./pages/Pricing";
import Login from "./components/Auth/Login";
import Registration from "./components/Auth/Registration";
import Deals from "./pages/Deals";
import Escrow from "./pages/Escrow";
import Financing from "./pages/Financing";
import ShippingTracking from "./pages/ShippingTracking";
import DeliveryReview from "./pages/DeliveryReview";
import PasswordReset from "./pages/PasswordReset";
import EmailVerification from "./components/Auth/EmailVerification";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const Protected = ({ children, roles }) => (
  <ProtectedRoute roles={roles}>{children}</ProtectedRoute>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/suppliers/:id" element={<SupplierProfile />} />
        <Route path="/rfqs" element={<RFQs />} />
        <Route path="/rfqs/:id" element={<RFQDetail />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/buyer-verification" element={<Verification type="buyer" />} />
        <Route path="/supplier-verification" element={<Verification type="supplier" />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/verify-email" element={<EmailVerification />} />

        {/* Protected routes — require login */}
        <Route path="/create-rfq" element={<Protected roles={["buyer"]}><CreateRFQ /></Protected>} />
        <Route path="/exporter/products/new" element={<Protected roles={["exporter"]}><AddProduct /></Protected>} />
        <Route path="/exporter/products/:id/edit" element={<Protected roles={["exporter"]}><AddProduct /></Protected>} />
        <Route path="/exporter/products" element={<Protected roles={["exporter"]}><ExporterProducts /></Protected>} />
        <Route path="/exporter/profile" element={<Protected roles={["exporter"]}><ExporterProfile /></Protected>} />
        <Route path="/buyer/profile" element={<Protected roles={["buyer"]}><BuyerProfile /></Protected>} />
        <Route path="/deals/:dealId/tracking" element={<Protected roles={["buyer","exporter","finance_partner","admin"]}><ShippingTracking /></Protected>} />
        <Route path="/deals/:dealId/review" element={<Protected roles={["buyer","exporter","finance_partner","admin"]}><DeliveryReview /></Protected>} />
        <Route path="/buyer-dashboard" element={<Protected roles={["buyer"]}><Dashboard role="buyer" /></Protected>} />
        <Route path="/supplier-dashboard" element={<Protected roles={["exporter"]}><Dashboard role="supplier" /></Protected>} />
        <Route path="/exporter-dashboard" element={<Protected roles={["exporter"]}><Dashboard role="exporter" /></Protected>} />
        <Route path="/admin-dashboard" element={<Protected roles={["admin"]}><Dashboard role="admin" /></Protected>} />
        <Route path="/deals" element={<Protected roles={["buyer","exporter","finance_partner","admin"]}><Deals /></Protected>} />
        <Route path="/escrow" element={<Protected roles={["buyer","exporter","finance_partner","admin"]}><Escrow /></Protected>} />
        <Route path="/financing" element={<Protected roles={["finance_partner"]}><Financing /></Protected>} />

        {/* 404 catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);