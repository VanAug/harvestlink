import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Suppliers from "./pages/Suppliers";
import SupplierProfile from "./pages/SupplierProfile";
import RFQs from "./pages/RFQs";
import RFQDetail from "./pages/RFQDetail";
import CreateRFQ from "./pages/CreateRFQ";
import AddProduct from "./pages/AddProduct";
import ExporterProducts from "./pages/ExporterProducts";
import ExporterProfile from "./pages/ExporterProfile";
import Verification from "./pages/Verification";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import Deals from "./pages/Deals";
import Escrow from "./pages/Escrow";
import Financing from "./pages/Financing";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/suppliers/:id" element={<SupplierProfile />} />
        <Route path="/rfqs" element={<RFQs />} />
        <Route path="/rfqs/:id" element={<RFQDetail />} />
        <Route path="/create-rfq" element={<CreateRFQ />} />
        <Route path="/exporter/products/new" element={<AddProduct />} />
        <Route path="/exporter/products/:id/edit" element={<AddProduct />} />
        <Route path="/exporter/products" element={<ExporterProducts />} />
        <Route path="/exporter/profile" element={<ExporterProfile />} />
        <Route path="/buyer-verification" element={<Verification type="buyer" />} />
        <Route path="/supplier-verification" element={<Verification type="supplier" />} />
        <Route path="/buyer-dashboard" element={<Dashboard role="buyer" />} />
        <Route path="/supplier-dashboard" element={<Dashboard role="supplier" />} />
        <Route path="/exporter-dashboard" element={<Dashboard role="exporter" />} />
        <Route path="/admin-dashboard" element={<Dashboard role="admin" />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/escrow" element={<Escrow />} />
        <Route path="/financing" element={<Financing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
