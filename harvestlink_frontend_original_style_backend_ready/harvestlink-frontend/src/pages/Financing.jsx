import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import { apiGet, apiPatch } from "../lib/api";
import {
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileCheck2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const defaultEligibility = {
  financing_eligible_amount: 0,
  trade_score: 0,
  total_trade_value: 0,
  total_deals: 0,
};

const statusStyles = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-orange-100 text-orange-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function Financing() {
  const [requests, setRequests] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [eligibility, setEligibility] = useState(defaultEligibility);
  const [myCompany, setMyCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const userRole = localStorage.getItem("harvestlink_role");
  const isFinancePartner = userRole === "finance_partner";

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setNotice("");

    try {
      const userId = Number(localStorage.getItem("harvestlink_user_id"));
      const ownedCompanies = userId ? await apiGet(`/companies/owner/${userId}`) : [];
      const preferredType = isFinancePartner ? "finance_partner" : "exporter";
      const company =
        ownedCompanies.find((item) => item.type === preferredType) ||
        ownedCompanies.find((item) => item.type === "exporter") ||
        ownedCompanies[0] ||
        null;

      setMyCompany(company);

      if (isFinancePartner) {
        const [queue, portfolio] = await Promise.all([
          apiGet("/financing?scope=review"),
          apiGet("/financing?scope=mine"),
        ]);
        setReviewQueue(queue);
        setRequests(portfolio);
        setEligibility(defaultEligibility);
        return;
      }

      const [myRequests, score] = await Promise.all([
        apiGet("/financing"),
        company ? apiGet(`/financing/eligibility/${company.id}`) : Promise.resolve(defaultEligibility),
      ]);
      setRequests(myRequests);
      setEligibility(score || defaultEligibility);
    } catch (error) {
      console.warn("Financing data unavailable:", error.message);
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateFinancingStatus(requestId, status) {
    try {
      const updated = await apiPatch(`/financing/${requestId}/status`, { status });
      setReviewQueue((current) =>
        current
          .map((request) => (request.id === requestId ? updated : request))
          .filter((request) => request.status === "submitted" || request.status === "under_review")
      );
      setRequests((current) => {
        const exists = current.some((request) => request.id === updated.id);
        return exists
          ? current.map((request) => (request.id === updated.id ? updated : request))
          : [updated, ...current];
      });
      setNotice(`Financing request marked ${status.replace("_", " ")}.`);
    } catch (error) {
      window.alert(`Unable to update financing status: ${error.message}`);
    }
  }

  const pendingCount = reviewQueue.filter(
    (request) => request.status === "submitted" || request.status === "under_review"
  ).length;

  const approvedTotal = useMemo(
    () =>
      requests
        .filter((request) => request.status === "approved")
        .reduce((total, request) => total + Number(request.requested_amount || 0), 0),
    [requests]
  );

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <section className="overflow-hidden rounded-[2rem] bg-harvest-green text-white shadow-soft">
          <div className="grid gap-8 p-8 lg:grid-cols-2 lg:p-12">
            <div>
              <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
                {isFinancePartner ? "Finance Partner Dashboard" : "Trade Finance Layer"}
              </div>
              <h1 className="mt-5 text-4xl font-black md:text-5xl">
                {isFinancePartner
                  ? "Review financing requests with full trade context."
                  : "Access working capital based on your trade activity."}
              </h1>
              <p className="mt-4 max-w-xl text-white/80">
                {isFinancePartner
                  ? "Claim pending applications, move them through review, and track the portfolio assigned to your finance company."
                  : "HarvestLink uses completed deals, payment performance, buyer relationships, and trade volume to estimate eligibility."}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 text-harvest-green">
              {loading ? (
                <SkeletonCard />
              ) : isFinancePartner ? (
                <>
                  <div className="text-sm font-bold text-gray-500">Pending review</div>
                  <div className="mt-2 text-6xl font-black">{pendingCount}</div>
                  <div className="mt-4 rounded-2xl bg-harvest-soft p-4 font-bold">
                    Assigned portfolio: {requests.length} requests
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-bold text-gray-500">Your estimated eligibility</div>
                  <div className="mt-2 text-6xl font-black">
                    ${eligibility.financing_eligible_amount?.toLocaleString?.() ?? "-"}
                  </div>
                  <div className="mt-4 rounded-2xl bg-harvest-soft p-4 font-bold">
                    Trade score: {eligibility.trade_score ?? "-"}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {notice && (
          <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-700">
            {notice}
          </div>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          {(isFinancePartner
            ? [
                ["Review queue", pendingCount, Clock3],
                ["My portfolio", requests.length, FileCheck2],
                ["Approved value", `$${approvedTotal.toLocaleString()}`, BadgeDollarSign],
                ["Risk layer", "Trade-backed", ShieldCheck],
              ]
            : [
                ["Trade value", `$${eligibility.total_trade_value?.toLocaleString?.() ?? 0}`, BadgeDollarSign],
                ["Total deals", eligibility.total_deals ?? 0, CheckCircle2],
                ["Trade score", eligibility.trade_score ?? 0, BarChart3],
                ["My requests", requests.length, FileCheck2],
              ]
          ).map(([label, value, Icon]) => (
            <div key={label} className="rounded-3xl bg-white p-6 shadow-sm">
              <Icon className="text-harvest-orange" />
              <div className="mt-3 text-3xl font-black text-harvest-green">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {isFinancePartner && (
          <RequestSection
            title="Financing Review Queue"
            description="Pending applications available to your finance company."
            requests={reviewQueue}
            loading={loading}
            emptyTitle="No pending financing requests."
            emptyDescription="New submitted applications will appear here for review."
            actions={updateFinancingStatus}
          />
        )}

        <RequestSection
          title={isFinancePartner ? "My Financing Portfolio" : "My Financing Requests"}
          description={
            isFinancePartner
              ? "Requests assigned to your finance partner company."
              : `Requests submitted by ${myCompany?.name || "your exporter company"}.`
          }
          requests={requests}
          loading={loading}
          emptyTitle="No financing requests yet."
          emptyDescription="Financing requests submitted from a deal room will appear here."
        />
      </main>
    </PageShell>
  );
}

function RequestSection({
  title,
  description,
  requests,
  loading,
  emptyTitle,
  emptyDescription,
  actions,
}) {
  return (
    <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-harvest-green">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <span className="text-sm text-slate-500">{requests.length} requests</span>
      </div>

      {loading ? (
        <div className="mt-5 animate-pulse space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-16 rounded bg-gray-100" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-harvest-soft p-6 text-center text-gray-500">
          <p className="font-bold">{emptyTitle}</p>
          <p className="mt-1 text-sm">{emptyDescription}</p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {requests.map((request) => (
            <FinancingCard key={request.id} request={request} actions={actions} />
          ))}
        </div>
      )}
    </section>
  );
}

function FinancingCard({ request, actions }) {
  const statusClass = statusStyles[request.status] || "bg-gray-100 text-gray-700";

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold text-slate-900">{request.exporter_name}</p>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
              {request.status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{request.purpose}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            <span className="rounded-full bg-white px-3 py-1">
              Requested {request.currency} {request.requested_amount?.toLocaleString?.()}
            </span>
            <span className="rounded-full bg-white px-3 py-1">
              Eligible {request.currency} {request.eligible_amount?.toLocaleString?.()}
            </span>
            <span className="rounded-full bg-white px-3 py-1">Score {request.score}</span>
          </div>
          {request.linked_deal_id && (
            <Link
              to="/deals"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-harvest-green hover:underline"
            >
              Linked to Deal #{request.linked_deal_id}
            </Link>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              type="button"
              onClick={() => actions(request.id, "under_review")}
              className="rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-600"
            >
              Review
            </button>
            <button
              type="button"
              onClick={() => actions(request.id, "approved")}
              className="inline-flex items-center gap-1 rounded-full bg-harvest-green px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-700"
            >
              <CheckCircle2 size={14} />
              Approve
            </button>
            <button
              type="button"
              onClick={() => actions(request.id, "rejected")}
              className="inline-flex items-center gap-1 rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
            >
              <XCircle size={14} />
              Reject
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-32 rounded bg-gray-200" />
      <div className="h-14 w-48 rounded bg-gray-200" />
      <div className="h-10 w-full rounded bg-gray-200" />
    </div>
  );
}
