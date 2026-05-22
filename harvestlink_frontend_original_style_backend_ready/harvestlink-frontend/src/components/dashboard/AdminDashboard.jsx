import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeDollarSign, Building2, CheckCircle, CreditCard, FileText, Globe2, Handshake, LockKeyhole, Package, ShieldCheck, Users } from "lucide-react";
import DashboardHero from "./DashboardHero";
import MetricCard from "./MetricCard";
import { apiPatch } from "../../lib/api";

export default function AdminDashboard({ overview, userName, companies = [], documents = [], users = [] }) {
  const [companyList, setCompanyList] = useState(companies);
  const [userList, setUserList] = useState(users);

  useEffect(() => {
    setCompanyList(companies);
  }, [companies]);

  useEffect(() => {
    setUserList(users);
  }, [users]);

  const documentsByCompany = useMemo(
    () => documents.reduce((map, document) => {
      const ownerId = document.owner_id;
      map[ownerId] = map[ownerId] || [];
      map[ownerId].push(document);
      return map;
    }, {}),
    [documents]
  );

  const pendingCompanies = companyList.filter((company) => company.verification_status !== "verified");
  const verifiedCompanies = companyList.filter((company) => company.verification_status === "verified");

  async function updateCompanyVerification(companyId, status) {
    try {
      const updatedCompany = await apiPatch(`/admin/companies/${companyId}/verification`, {
        verification_status: status,
      });
      setCompanyList((current) => current.map((company) => (company.id === updatedCompany.id ? updatedCompany : company)));
      window.alert(`Verification status for ${updatedCompany.name} set to ${updatedCompany.verification_status}.`);
    } catch (error) {
      window.alert(`Unable to update verification status: ${error.message}`);
    }
  }

  const userHeaders = ["ID", "Name", "Email", "Role", "Status"];

  const metrics = overview ? [
    ["Total Users", overview.users, Users],
    ["Companies", overview.companies, Building2],
    ["Products", overview.products, Package],
    ["RFQs", overview.rfqs, FileText],
    ["Deals", overview.deals, Handshake],
    ["Escrow", overview.escrow_transactions, CreditCard],
    ["Financing", overview.financing_requests, BadgeDollarSign],
    ["Exporters", overview.exporters, Globe2],
  ] : [
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
    { label: "Financing", to: "/financing", icon: BadgeDollarSign },
  ];

  return (
    <>
      <DashboardHero
        eyebrow={<><ShieldCheck size={16} /> Admin Console</>}
        title="Platform Administration"
        description={`Monitor platform activity, manage users, review verifications, and oversee trade operations. Logged in as ${userName}.`}
        actions={actions}
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, Icon]) => <MetricCard key={label} label={label} value={value} icon={Icon} />)}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <section className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-black text-harvest-green">Platform Review Queues</h2>
          <p className="text-sm text-gray-500">Shortcuts for the main admin review surfaces.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              ["Product Listings", "/products", Package],
              ["Open RFQs", "/rfqs", FileText],
              ["Deal Rooms", "/deals", Handshake],
              ["Escrow Events", "/escrow", CreditCard],
            ].map(([label, to, Icon]) => (
              <Link key={label} to={to} className="flex items-center gap-3 rounded-2xl bg-harvest-soft p-4 font-bold text-harvest-green transition hover:bg-green-100">
                <Icon size={20} className="text-harvest-orange" />
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-harvest-green">Platform Health</h2>
          <div className="mt-4 space-y-3">
            {["API Status", "Database", "Active Sessions"].map((label) => (
              <div key={label} className="flex items-center justify-between rounded-2xl bg-green-50 p-3 text-sm">
                <span className="flex items-center gap-2 font-bold text-green-700">
                  <CheckCircle size={16} />
                  {label}
                </span>
                <span className="text-green-600">Operational</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-harvest-green">Verification Review Queue</h2>
            <p className="text-sm text-gray-500">Review submitted company documents and grant or revoke verification status.</p>
          </div>
          <div className="text-sm text-slate-500">
            {pendingCompanies.length} companies awaiting review • {verifiedCompanies.length} verified profiles
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
                <div key={company.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-900">{company.name}</p>
                      <p className="text-sm text-slate-500">{company.type} • {company.country}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${company.verification_status === "verified" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                        {company.verification_status}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCompanyVerification(company.id, "verified")}
                        className="rounded-full bg-harvest-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                      >
                        Approve Verification
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
                        <p className="text-sm font-semibold text-slate-900">{document.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{document.document_type}</p>
                        {document.notes ? <p className="mt-2 text-xs text-slate-500">{document.notes}</p> : null}
                        <p className="mt-3 text-xs text-slate-500">Status: {document.status}</p>
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
                  <h3 className="text-lg font-bold text-slate-900">Verified Companies</h3>
                  <p className="text-sm text-slate-500">Revoke verification if a verified profile needs review.</p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">{verifiedCompanies.length} verified</span>
              </div>

              <div className="mt-4 space-y-3">
                {verifiedCompanies.map((company) => (
                  <div key={company.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{company.name}</p>
                        <p className="text-sm text-slate-500">{company.type} • {company.country}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateCompanyVerification(company.id, "pending")}
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

      <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-harvest-green">All Platform Users</h2>
            <p className="text-sm text-gray-500">Review every registered user account with role and status details.</p>
          </div>
          <span className="text-sm text-slate-500">{userList.length} users</span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                {userHeaders.map((header) => (
                  <th key={header} className="px-4 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {userList.map((user) => (
                <tr key={user.id} className="bg-slate-50 hover:bg-slate-100">
                  <td className="px-4 py-3">{user.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{user.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 capitalize text-slate-700">{user.role}</td>
                  <td className="px-4 py-3 text-slate-600">{user.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
