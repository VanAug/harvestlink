import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeDollarSign,
  Building2,
  CheckCircle,
  ChevronDown,
  CreditCard,
  FileText,
  Globe2,
  Handshake,
  LockKeyhole,
  Package,
  Search,
  ShieldCheck,
  Users,
  X,
  Check,
  Image,
} from "lucide-react";
import DashboardHero from "./DashboardHero";
import MetricCard from "./MetricCard";
import { apiGet, apiPatch } from "../../lib/api";

export default function AdminDashboard({
  overview,
  userName,
  companies = [],
  documents = [],
  users = [],
}) {
  const [companyList, setCompanyList] = useState(companies);
  const [userList, setUserList] = useState(users);
  const [userSearch, setUserSearch] = useState("");
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editingRoleValue, setEditingRoleValue] = useState("");
  const [rejectState, setRejectState] = useState({ companyId: null, reason: "" });

  useEffect(() => {
    setCompanyList(companies);
  }, [companies]);

  useEffect(() => {
    setUserList(users);
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return userList;
    const query = userSearch.toLowerCase();
    return userList.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.role?.toLowerCase().includes(query)
    );
  }, [userList, userSearch]);

  const documentsByCompany = useMemo(
    () =>
      documents.reduce((map, document) => {
        const ownerId = document.owner_id;
        map[ownerId] = map[ownerId] || [];
        map[ownerId].push(document);
        return map;
      }, {}),
    [documents]
  );

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState("verification-review");
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const actionMenuItems = [
    {
      label: "Verification Review",
      key: "verification-review",
      icon: ShieldCheck,
      type: "section",
    },
    {
      label: "Product Moderation",
      key: "product-moderation",
      icon: Package,
      type: "section",
    },
    {
      label: "User Management",
      key: "platform-users",
      icon: Users,
      type: "section",
    },
    { label: "RFQ Market", to: "/rfqs", icon: Handshake, type: "nav" },
    { label: "Deal Rooms", to: "/deals", icon: LockKeyhole, type: "nav" },
    { label: "Escrow", to: "/escrow", icon: CreditCard, type: "nav" },
    { label: "Financing Queue", to: "/financing", icon: BadgeDollarSign, type: "nav" },
  ];

  const pendingCompanies = companyList.filter(
    (company) => company.verification_status !== "verified"
  );
  const verifiedCompanies = companyList.filter(
    (company) => company.verification_status === "verified"
  );

  const [pendingProducts, setPendingProducts] = useState([]);
  const [moderatingProductId, setModeratingProductId] = useState(null);

  useEffect(() => {
    async function loadPendingProducts() {
      try {
        const data = await apiGet('/admin/products/pending');
        setPendingProducts(data);
      } catch (e) {
        // ignore
      }
    }
    loadPendingProducts();
  }, []);

  async function approveProduct(productId) {
    try {
      const updated = await apiPatch(`/admin/products/${productId}/approve`, {});
      setPendingProducts((current) => current.filter((p) => p.id !== updated.id));
      window.alert(`Product "${updated.name}" approved.`);
    } catch (error) {
      window.alert(`Unable to approve product: ${error.message}`);
    }
  }

  async function rejectProduct(productId) {
    try {
      const updated = await apiPatch(`/admin/products/${productId}/reject`, {});
      setPendingProducts((current) => current.filter((p) => p.id !== updated.id));
      window.alert(`Product "${updated.name}" rejected.`);
    } catch (error) {
      window.alert(`Unable to reject product: ${error.message}`);
    }
  }

  async function updateCompanyVerification(companyId, status, rejectionReason) {
    try {
      const payload = { verification_status: status };
      if (rejectionReason) payload.rejection_reason = rejectionReason;
      const updatedCompany = await apiPatch(
        `/admin/companies/${companyId}/verification`,
        payload
      );
      setCompanyList((current) =>
        current.map((company) =>
          company.id === updatedCompany.id ? updatedCompany : company
        )
      );
      if (!rejectionReason) {
        window.alert(
          `Verification status for ${updatedCompany.name} set to ${updatedCompany.verification_status}.`
        );
      }
    } catch (error) {
      window.alert(`Unable to update verification status: ${error.message}`);
    }
  }

  async function saveUserRole(userId) {
    try {
      const updated = await apiPatch(`/admin/users/${userId}/role`, {
        role: editingRoleValue,
      });
      setUserList((current) =>
        current.map((u) => (u.id === updated.id ? updated : u))
      );
      setEditingRoleId(null);
      setEditingRoleValue("");
    } catch (error) {
      window.alert(`Unable to update user role: ${error.message}`);
    }
  }

  function openRejectDialog(companyId) {
    setRejectState({ companyId, reason: "" });
  }

  function closeRejectDialog() {
    setRejectState({ companyId: null, reason: "" });
  }

  async function confirmReject() {
    const { companyId, reason } = rejectState;
    if (!reason.trim()) {
      window.alert("Please provide a rejection reason.");
      return;
    }
    await updateCompanyVerification(companyId, "rejected", reason.trim());
    closeRejectDialog();
  }

  const userHeaders = ["ID", "Name", "Email", "Role", "Status"];

  const metrics = overview
    ? [
        ["Total Users", overview.users, Users],
        ["Companies", overview.companies, Building2],
        ["Products", overview.products, Package],
        ["RFQs", overview.rfqs, FileText],
        ["Deals", overview.deals, Handshake],
        ["Escrow", overview.escrow_transactions, CreditCard],
        ["Financing", overview.financing_requests, BadgeDollarSign],
        ["Exporters", overview.exporters, Globe2],
      ]
    : [
        ["Total Users", "7", Users],
        ["Companies", "6", Building2],
        ["Products", "5", Package],
        ["RFQs", "4", FileText],
      ];

  const actions = [
    { label: "Marketplace", to: "/products", icon: Globe2 },
    { label: "All Deals", to: "/deals", icon: LockKeyhole },
    { label: "RFQ Market", to: "/rfqs", icon: Handshake },
    { label: "Escrow", to: "/escrow", icon: CreditCard },
  ];

  return (
    <>
      <DashboardHero
        eyebrow={
          <>
            <ShieldCheck size={16} /> Admin Console
          </>
        }
        title="Platform Administration"
        description={`Monitor platform activity, manage users, review verifications, and oversee trade operations. Logged in as ${userName}.`}
        actions={actions}
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, Icon]) => (
          <MetricCard key={label} label={label} value={value} icon={Icon} />
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <section className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-black text-harvest-green">
            Platform Review Queues
          </h2>
          <p className="text-sm text-gray-500">
            Shortcuts for the main admin review surfaces.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              ["Product Listings", "/products", Package],
              ["Open RFQs", "/rfqs", FileText],
              ["Deal Rooms", "/deals", Handshake],
              ["Escrow Events", "/escrow", CreditCard],
            ].map(([label, to, Icon]) => (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-3 rounded-2xl bg-harvest-soft p-4 font-bold text-harvest-green transition hover:bg-green-100"
              >
                <Icon size={20} className="text-harvest-orange" />
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-harvest-green">
            Platform Health
          </h2>
          <div className="mt-4 space-y-3">
            {[
              ["API Status", "Operational"],
              ["Database", "Operational"],
              ["Active Sessions", "Normal"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-2xl bg-green-50 p-3 text-sm"
              >
                <span className="flex items-center gap-2 font-bold text-green-700">
                  <CheckCircle size={16} />
                  {label}
                </span>
                <span className="text-green-600">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex justify-center">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-2xl bg-harvest-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Admin actions
              <ChevronDown size={16} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                {actionMenuItems.map(({ label, type, key, to, icon: ItemIcon }) =>
                  type === "section" ? (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setSelectedQueue(key);
                        setDropdownOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                        selectedQueue === key
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <ItemIcon size={16} className="text-harvest-orange" />
                      {label}
                    </button>
                  ) : (
                    <Link
                      key={label}
                      to={to}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <ItemIcon size={16} className="text-harvest-orange" />
                      {label}
                    </Link>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Review Queue */}
      {selectedQueue === "verification-review" && (
        <section id="verification-review" className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-harvest-green">
              Verification Review Queue
            </h2>
            <p className="text-sm text-gray-500">
              Review submitted company documents, then approve or reject with a
              reason.
            </p>
          </div>
          <div className="text-sm text-slate-500">
            {pendingCompanies.length} companies awaiting review •{" "}
            {verifiedCompanies.length} verified profiles
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {pendingCompanies.length === 0 ? (
            <div className="rounded-3xl border border-green-200 bg-green-50 p-6 text-green-700">
              No companies require verification review at this time.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingCompanies.map((company) => (
                <div
                  key={company.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-900">
                        {company.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {company.type} • {company.country}
                      </p>
                      {company.verification_status === "rejected" &&
                        company.rejection_reason && (
                          <p className="mt-1 text-xs font-semibold text-red-600">
                            Rejected: {company.rejection_reason}
                          </p>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          company.verification_status === "verified"
                            ? "bg-green-100 text-green-800"
                            : company.verification_status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {company.verification_status}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCompanyVerification(company.id, "verified")
                        }
                        className="rounded-full bg-harvest-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => openRejectDialog(company.id)}
                        className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {documentsByCompany[company.id]?.map((document) => (
                      <a
                        key={document.id}
                        href={document.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-3xl border border-slate-200 bg-white p-4 transition hover:border-harvest-green"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {document.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {document.document_type}
                        </p>
                        {document.notes ? (
                          <p className="mt-2 text-xs text-slate-500">
                            {document.notes}
                          </p>
                        ) : null}
                        <div className="mt-3 flex items-center gap-3">
                          <p className="text-xs text-slate-500">
                            Status: {document.status}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              document.file_url &&
                              document.file_url.includes("/uploads/documents/")
                                ? "bg-blue-50 text-blue-700"
                                : "bg-indigo-50 text-indigo-700"
                            }`}
                          >
                            {document.file_url &&
                            document.file_url.includes("/uploads/documents/")
                              ? "Local"
                              : "Blob"}
                          </span>
                        </div>
                      </a>
                    ))}
                    {!documentsByCompany[company.id] && (
                      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-100 p-4 text-sm text-slate-500">
                        No document uploads found for this company.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {verifiedCompanies.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Verified Companies
                  </h3>
                  <p className="text-sm text-slate-500">
                    Revoke verification if a verified profile needs review.
                  </p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                  {verifiedCompanies.length} verified
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {verifiedCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {company.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {company.type} • {company.country}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateCompanyVerification(company.id, "pending")
                        }
                        className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                      >
                        Revoke Verification
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      )}

      {/* Product Moderation Queue */}
      {selectedQueue === "product-moderation" && (
        <section id="product-moderation" className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-harvest-green">
              Product Moderation Queue
            </h2>
            <p className="text-sm text-gray-500">
              Review new product listings, then approve or reject them.
            </p>
          </div>
          <div className="text-sm text-slate-500">
            {pendingProducts.length} products awaiting review
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {pendingProducts.length === 0 ? (
            <div className="rounded-3xl border border-green-200 bg-green-50 p-6 text-green-700">
              No products require moderation at this time.
            </div>
          ) : (
            pendingProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-200">
                        <Image size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-bold text-slate-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {product.category} • {product.country_of_origin} • {product.supplier_name}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>Qty: {product.available_quantity} {product.unit}</span>
                        {product.price_min && (
                          <span>Price: ${product.price_min}{product.price_max ? ` - $${product.price_max}` : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      product.status === 'pending'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => approveProduct(product.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-harvest-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      <Check size={14} />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectProduct(product.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                    >
                      <X size={14} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      )}

      {/* All Users with Search & Role Editing */}
      {selectedQueue === "platform-users" && (
        <section id="platform-users" className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-harvest-green">
              All Platform Users
            </h2>
            <p className="text-sm text-gray-500">
              Search, filter, and manage user roles and account status.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="w-48 rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-harvest-green"
              />
            </div>
            <span className="text-sm text-slate-500">
              {filteredUsers.length} / {userList.length} users
            </span>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                {userHeaders.map((header) => (
                  <th key={header} className="px-4 py-3">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={userHeaders.length}
                    className="px-4 py-8 text-center text-sm text-slate-400"
                  >
                    No users match your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="bg-slate-50 hover:bg-slate-100">
                    <td className="px-4 py-3">{user.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {user.full_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      {editingRoleId === user.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingRoleValue}
                            onChange={(e) =>
                              setEditingRoleValue(e.target.value)
                            }
                            className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                            autoFocus
                          >
                            {["buyer", "exporter", "finance_partner", "admin"].map(
                              (r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              )
                            )}
                          </select>
                          <button
                            onClick={() => saveUserRole(user.id)}
                            className="rounded-lg bg-harvest-green px-2 py-1 text-xs font-bold text-white"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingRoleId(null)}
                            className="rounded-lg bg-gray-200 px-2 py-1 text-xs font-bold text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="capitalize text-slate-700">
                            {user.role}
                          </span>
                          <button
                            onClick={() => {
                              setEditingRoleId(user.id);
                              setEditingRoleValue(user.role);
                            }}
                            className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-200"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          user.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {/* Reject reason modal */}
      {rejectState.companyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-red-600">
                Reject Company
              </h3>
              <button
                onClick={closeRejectDialog}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Provide a clear reason for rejection. This will be recorded
              against the company profile and can inform the company when they
              reapply.
            </p>
            <textarea
              value={rejectState.reason}
              onChange={(e) =>
                setRejectState((s) => ({ ...s, reason: e.target.value }))
              }
              rows={4}
              className="mt-4 w-full rounded-2xl border border-gray-200 p-4 text-sm outline-none focus:border-red-400"
              placeholder="e.g. Supporting documents are expired or unreadable. Please re-upload valid certificates."
            />
            <div className="mt-5 flex gap-3">
              <button
                onClick={closeRejectDialog}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
