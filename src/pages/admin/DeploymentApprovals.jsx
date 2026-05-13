import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminWorkforce } from "../../context/AdminWorkforceContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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

function badgeTone(status) {
  switch (status) {
    case "Pending Approval":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Approved":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "Assigned":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Rejected":
      return "bg-rose-100 text-rose-800 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function metricTone(index) {
  return [
    "border-cyan-200 bg-cyan-50 text-cyan-950",
    "border-emerald-200 bg-emerald-50 text-emerald-950",
    "border-amber-200 bg-amber-50 text-amber-950",
    "border-slate-200 bg-white text-slate-950",
  ][index % 4];
}

export default function DeploymentApprovals() {
  const { jobs } = useRecruitmentData();
  const {
    requests,
    assignments,
    approveRequest,
    rejectRequest,
    convertRequestToAssignment,
    releaseTalent,
    archiveTalent,
    getActiveAssignmentForTalent,
  } = useAdminWorkforce();

  const [statusFilter, setStatusFilter] = useState("Pending Approval");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [notice, setNotice] = useState("");

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (left, right) => Date.parse(right.updatedAt || right.createdAt || "") - Date.parse(left.updatedAt || left.createdAt || "")
      ),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    return sortedRequests.filter((request) =>
      statusFilter === "All" ? true : request.status === statusFilter
    );
  }, [sortedRequests, statusFilter]);

  const selectedRequest = useMemo(
    () => filteredRequests.find((request) => request.id === selectedRequestId) || filteredRequests[0] || null,
    [filteredRequests, selectedRequestId]
  );

  const selectedAssignment = selectedRequest
    ? assignments.find((assignment) => assignment.requestId === selectedRequest.id) ||
      getActiveAssignmentForTalent(selectedRequest.talentId)
    : null;

  useEffect(() => {
    if (!filteredRequests.some((request) => request.id === selectedRequestId)) {
      setSelectedRequestId(filteredRequests[0]?.id || "");
    }
  }, [filteredRequests, selectedRequestId]);

  useEffect(() => {
    if (!selectedRequest) return;
    setRejectReason(selectedRequest.rejectionReason || "");
    setApprovalNotes(selectedRequest.approvalNotes || "");
  }, [selectedRequest]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((request) => request.status === "Pending Approval").length,
      approved: requests.filter((request) => request.status === "Approved").length,
      assigned: requests.filter((request) => request.status === "Assigned").length,
    }),
    [requests]
  );

  const coverage = useMemo(() => {
    const active = assignments.filter((assignment) => assignment.status === "Active");
    const coveredJobs = new Set(
      active
        .filter((assignment) => assignment.targetType === "Job")
        .map((assignment) => assignment.targetId || assignment.targetName)
    );
    return {
      activeCount: active.length,
      uncoveredJobs: jobs.filter((job) => !coveredJobs.has(job.id)).length,
    };
  }, [assignments, jobs]);

  const handleSelect = (request) => {
    setSelectedRequestId(request.id);
    setNotice("");
  };

  const handleApprove = (request) => {
    const result = approveRequest(request.id, {
      materializeImmediately: true,
      approvalNotes: approvalNotes || request.justification,
    });

    if (!result.ok) {
      setNotice(result.message);
      return;
    }

    setSelectedRequestId(result.request.id);
    setNotice(`${request.talentName} approved and assigned.`);
  };

  const handleConvert = (request) => {
    const result = convertRequestToAssignment(request.id, {
      approvalNotes: approvalNotes || request.justification,
    });

    if (!result.ok) {
      setNotice(result.message);
      return;
    }

    setSelectedRequestId(result.request.id);
    setNotice(`${request.talentName} moved to active assignment.`);
  };

  const handleReject = (request) => {
    const result = rejectRequest(request.id, rejectReason || "Not approved for deployment.");
    if (!result.ok) {
      setNotice(result.message);
      return;
    }

    setSelectedRequestId(result.request.id);
    setNotice(`${request.talentName} rejected.`);
  };

  const handleRelease = (request) => {
    const result = releaseTalent(request.talentId, `Released after deployment review for ${request.targetName}.`);
    setNotice(result.ok ? `${request.talentName} released.` : result.message);
  };

  const handleArchive = (request) => {
    const result = archiveTalent(request.talentId, `Archived from deployment approvals for ${request.targetName}.`);
    setNotice(result.ok ? `${request.talentName} archived.` : result.message);
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-soft sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">Administrator workflow</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Deployment approvals
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Review recruiter requests, approve or reject them, and materialize active deployments when they are ready.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "All requests", value: stats.total, note: "Recruiter-submitted volume." },
          { label: "Pending", value: stats.pending, note: "Waiting for approval." },
          { label: "Approved", value: stats.approved, note: "Ready to assign." },
          { label: "Assigned", value: stats.assigned, note: "Active deployments." },
        ].map((item, index) => (
          <article key={item.label} className={["rounded-3xl border p-5 shadow-sm", metricTone(index)].join(" ")}>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            <p className="mt-2 text-sm text-slate-600">{item.note}</p>
          </article>
        ))}
      </section>

      {notice ? (
        <section className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          {notice}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="section-heading">Approval queue</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">Requests by status</h2>
              </div>
              <div className="rounded-2xl bg-slate-100 p-1">
                {["Pending Approval", "Approved", "Assigned", "Rejected", "All"].map((status) => {
                  const active = statusFilter === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={[
                        "rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm",
                        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
                      ].join(" ")}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3 p-6">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => handleSelect(request)}
                  className={[
                    "w-full rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft",
                    selectedRequest?.id === request.id
                      ? "border-slate-950 ring-2 ring-slate-950"
                      : "border-slate-200 bg-white",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{request.talentName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Requested by {request.requester || "Recruiter"} - {request.targetType}: {request.targetName || "Unassigned"}
                      </p>
                    </div>
                    <span className={["rounded-full border px-3 py-1 text-xs font-semibold", badgeTone(request.status)].join(" ")}>
                      {request.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {request.justification || "No justification provided."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{request.urgency} urgency</span>
                    <span>Start {formatDate(request.startDate)}</span>
                    <span>Updated {formatDateTime(request.updatedAt)}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-600">
                No requests match the selected filter.
              </div>
            )}
          </div>
        </article>

        <article className="space-y-6">
          <section className="surface-card overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <p className="section-heading">Request detail</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">
                {selectedRequest ? selectedRequest.talentName : "Select a request"}
              </h2>
            </div>

            {selectedRequest ? (
              <div className="space-y-4 p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Requester</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRequest.requester}</p>
                    <p className="mt-1 text-xs text-slate-500">{selectedRequest.requesterEmail}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Approval state</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRequest.status}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Submitted {formatDateTime(selectedRequest.submittedAt || selectedRequest.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Audit metadata</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">Target</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedRequest.targetType}: {selectedRequest.targetName || "Unassigned"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Requested start</p>
                      <p className="text-sm font-semibold text-slate-900">{formatDate(selectedRequest.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Approver</p>
                      <p className="text-sm font-semibold text-slate-900">{selectedRequest.approvedBy || "Pending"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Assignment</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedAssignment ? `${selectedAssignment.targetType}: ${selectedAssignment.targetName}` : "No active assignment"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Approval note</label>
                  <textarea
                    rows={3}
                    value={approvalNotes}
                    onChange={(event) => setApprovalNotes(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Reject reason</label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedRequest)}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Approve and assign
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(selectedRequest)}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 transition hover:border-rose-300"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConvert(selectedRequest)}
                    disabled={selectedRequest.status !== "Approved"}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Convert to active assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRelease(selectedRequest)}
                    disabled={!selectedAssignment}
                    className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Release
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchive(selectedRequest)}
                    disabled={!selectedAssignment}
                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Archive
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-10 text-sm text-slate-600">
                Pick a request from the queue to review the full audit trail.
              </div>
            )}
          </section>

          <section className="surface-card overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <p className="section-heading">Coverage snapshot</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">Active deployment health</h2>
            </div>
            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Active deployments</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{coverage.activeCount}</p>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Coverage gaps</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{coverage.uncoveredJobs}</p>
              </article>
            </div>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <p className="section-heading">Workflow links</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">Admin modules</h2>
            </div>
            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <Link
                to="/admin/deployment-board"
                className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Open deployment board
              </Link>
              <Link
                to="/admin/talent-pool"
                className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Review talent pool
              </Link>
            </div>
          </section>
        </article>
      </section>
    </div>
  );
}
