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

export default function DeploymentManagerDeployments() {
  const {
    requests,
    assignments,
    talentPool,
    approveRequest,
    rejectRequest,
    releaseTalent,
    setTalentStatus,
  } = useAdminWorkforce();
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
  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === "Active"),
    [assignments]
  );

  const updateTalentDeploymentStatus = (talentId, status) => {
    const result = setTalentStatus(talentId, status, `Deployment manager set status to ${status}.`);
    setNotice(result.ok ? `Employee deployment status updated to ${status}.` : result.message);
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Deployment Manager</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Monitor Active Deployments
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Approve pending deployment requests and update employee deployment statuses from one operational view.
        </p>
      </section>

      {notice ? (
        <section className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          {notice}
        </section>
      ) : null}

      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold text-slate-950">Pending Deployment Requests</h2>
        <div className="mt-4 space-y-3">
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

      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold text-slate-950">Update Employee Deployment Status</h2>
        <div className="mt-4 space-y-3">
          {activeAssignments.length > 0 ? (
            activeAssignments.map((assignment) => (
              <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {assignment.talentName} - {assignment.targetType}: {assignment.targetName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Active since {formatDateTime(assignment.assignedAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateTalentDeploymentStatus(assignment.talentId, "Deployed")}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                  >
                    Set Deployed
                  </button>
                  <button
                    type="button"
                    onClick={() => updateTalentDeploymentStatus(assignment.talentId, "On Hold")}
                    className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:border-amber-400"
                  >
                    Set On Hold
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const result = releaseTalent(assignment.talentId, "Released by deployment manager.");
                      setNotice(result.ok ? `${assignment.talentName} released from active deployment.` : result.message);
                    }}
                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                  >
                    Release
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No active deployments found.
            </div>
          )}
        </div>
      </section>

      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold text-slate-950">Talent Status Snapshot</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {["Ready", "On Hold", "Deployed", "Archived"].map((status) => (
            <article key={status} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{status}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {talentPool.filter((record) => record.status === status).length}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
