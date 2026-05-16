import React, { useMemo, useState } from "react";
import { useAdminWorkforce } from "../../context/AdminWorkforceContext";

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DeploymentManagerRequests() {
  const { requests, approveRequest, rejectRequest } = useAdminWorkforce();
  const [notice, setNotice] = useState("");
  const pendingRequests = useMemo(
    () =>
      requests
        .filter((request) => request.status === "Pending Approval")
        .sort(
          (left, right) =>
            Date.parse(right.updatedAt || right.createdAt || "") -
            Date.parse(left.updatedAt || left.createdAt || "")
        ),
    [requests]
  );

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Deployment Manager</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Deployment Requests
        </h1>
      </section>
      {notice ? (
        <section className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          {notice}
        </section>
      ) : null}
      <section className="surface-card p-6">
        <div className="space-y-3">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {request.talentName} - {request.targetType}: {request.targetName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Requested by {request.requester} at {formatDateTime(request.updatedAt || request.createdAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const result = approveRequest(request.id, {
                        materializeImmediately: true,
                        approvalNotes: "Approved by deployment manager.",
                      });
                      setNotice(result.ok ? `${request.talentName} deployment approved.` : result.message);
                    }}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const result = rejectRequest(request.id, "Backout from deployment gate.");
                      setNotice(result.ok ? `${request.talentName} request rejected.` : result.message);
                    }}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:border-rose-300"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No pending requests.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
