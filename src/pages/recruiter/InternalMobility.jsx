import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Filter, Play } from "lucide-react";
import { PageFrame } from "../../components/layout/ShellPrimitives";
import { Button } from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import { paginate } from "../../lib/pagination";
import {
  canTransitionRedeployment,
  REDEPLOYMENT_STATUSES,
} from "../../lib/internalMobility";
import {
  listRedeploymentQueue,
  readInternalMobilityRecords,
  runBatchMobilityMatch,
  runSingleMobilityMatch,
  updateRedeploymentStatus,
} from "../../lib/internalMobilityStore";

function formatRating(value) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "N/A";
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

function statusTone(status) {
  switch (status) {
    case "RequestSubmitted":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "UnderReview":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "Matched":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "Shortlisted":
      return "bg-violet-100 text-violet-800 border-violet-200";
    case "ProposedToClient":
      return "bg-cyan-100 text-cyan-800 border-cyan-200";
    case "Assigned":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Declined":
      return "bg-rose-100 text-rose-800 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function sortRows(rows, sort) {
  const list = [...rows];
  const direction = sort.direction === "asc" ? 1 : -1;
  const byDate = (value) => Date.parse(value || "") || 0;
  list.sort((left, right) => {
    let comparison = 0;
    if (sort.column === "applicantName") {
      comparison = left.applicantName.localeCompare(right.applicantName);
    } else if (sort.column === "contractStatus") {
      comparison = left.currentContractStatus.localeCompare(right.currentContractStatus);
    } else if (sort.column === "redeploymentStatus") {
      comparison = left.redeploymentStatus.localeCompare(right.redeploymentStatus);
    } else if (sort.column === "internalRating") {
      comparison = left.internalRating.overall - right.internalRating.overall;
    } else if (sort.column === "matchScore") {
      const leftScore = typeof left.matchMeta?.matchScore === "number" ? left.matchMeta.matchScore : -1;
      const rightScore = typeof right.matchMeta?.matchScore === "number" ? right.matchMeta.matchScore : -1;
      comparison = leftScore - rightScore;
    } else if (sort.column === "lastMatch") {
      comparison = byDate(left.matchMeta.lastMatchedAt) - byDate(right.matchMeta.lastMatchedAt);
    } else {
      comparison = byDate(left.requestMeta.requestedAt) - byDate(right.requestMeta.requestedAt);
    }
    if (comparison === 0) {
      return left.applicantName.localeCompare(right.applicantName) * direction;
    }
    return comparison * direction;
  });
  return list;
}

function nextSort(current, column) {
  if (current.column !== column) return { column, direction: "asc" };
  if (current.direction === "asc") return { column, direction: "desc" };
  return { column: "requestedAt", direction: "desc" };
}

function makeRoleOptions(records) {
  const options = new Set();
  for (const record of records) {
    if (record.requestMeta?.desiredRole) options.add(record.requestMeta.desiredRole);
  }
  return ["Any", ...[...options].sort((a, b) => a.localeCompare(b))];
}

function missingRequestFields(record) {
  if (!record) return [];
  const meta = record.requestMeta || {};
  const missing = [];
  if (!String(meta.desiredRole || "").trim()) missing.push("Desired role");
  if (!String(meta.availabilityDate || "").trim()) missing.push("Availability date");
  if (!String(meta.locationPreference || "").trim()) missing.push("Location preference");
  if (!String(meta.applicantNote || "").trim()) missing.push("Applicant note");
  if (!Array.isArray(record.skills) || record.skills.length === 0) missing.push("Skills");
  return missing;
}

function summarizeSkipReasons(skipped = []) {
  const counts = new Map();
  for (const entry of skipped) {
    const reason = String(entry?.reason || "Unknown reason").trim() || "Unknown reason";
    counts.set(reason, (counts.get(reason) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([reason, count]) => `${reason} (${count})`);
}

export default function RecruiterInternalMobility() {
  const [records, setRecords] = useState(() => readInternalMobilityRecords());
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [selectedRowId, setSelectedRowId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusAction, setStatusAction] = useState("UnderReview");
  const [sortState, setSortState] = useState({ column: "requestedAt", direction: "desc" });

  const [roleFilter, setRoleFilter] = useState("Any");
  const [statusFilter, setStatusFilter] = useState("RequestSubmitted");
  const [ratingBandFilter, setRatingBandFilter] = useState("Any");
  const [availabilityFilter, setAvailabilityFilter] = useState("Any");
  const [skillQuery, setSkillQuery] = useState("");

  const roleOptions = useMemo(() => makeRoleOptions(records), [records]);
  const queueRows = useMemo(
    () =>
      listRedeploymentQueue({
        roleQuery: roleFilter === "Any" ? "" : roleFilter,
        statusFilter,
        ratingBand: ratingBandFilter,
        availabilityWindow: availabilityFilter,
        skillQuery,
      }),
    [availabilityFilter, ratingBandFilter, roleFilter, skillQuery, statusFilter, records]
  );
  const sortedRows = useMemo(() => sortRows(queueRows, sortState), [queueRows, sortState]);
  const pagination = useMemo(() => paginate(sortedRows, { page, pageSize }), [page, pageSize, sortedRows]);

  useEffect(() => {
    if (pagination.page !== page) setPage(pagination.page);
  }, [page, pagination.page]);

  useEffect(() => {
    const existingIds = new Set(records.map((row) => row.id));
    setSelectedIds((ids) => ids.filter((id) => existingIds.has(id)));
  }, [records]);

  const selectedRecord = useMemo(
    () => sortedRows.find((row) => row.id === selectedRowId) || pagination.pageItems[0] || null,
    [pagination.pageItems, selectedRowId, sortedRows]
  );

  useEffect(() => {
    if (!selectedRecord) return;
    setSelectedRowId(selectedRecord.id);
  }, [selectedRecord?.id]);

  const allPageSelected =
    pagination.pageItems.length > 0 &&
    pagination.pageItems.every((row) => selectedIds.includes(row.id));

  const queueMetrics = useMemo(() => {
    const queue = records.filter((row) => row.redeploymentStatus === "RequestSubmitted").length;
    const underReview = records.filter((row) => row.redeploymentStatus === "UnderReview").length;
    const matched = records.filter((row) => row.redeploymentStatus === "Matched").length;
    return { queue, underReview, matched };
  }, [records]);

  const refreshRecords = () => setRecords(readInternalMobilityRecords());

  const handleSingleMatch = (recordId) => {
    const result = runSingleMobilityMatch(recordId, "Recruiter");
    if (!result.ok) {
      setNotice(result.message || "Unable to run AI match.");
      return;
    }
    refreshRecords();
    setNotice(`AI match completed for ${result.record.applicantName}.`);
  };

  const handleBatchMatch = () => {
    if (selectedIds.length === 0) {
      setNotice("Select at least one applicant for batch match.");
      return;
    }
    const result = runBatchMobilityMatch(selectedIds, "Recruiter");
    refreshRecords();
    const reasonSummary = summarizeSkipReasons(result.skipped);
    const reasonsText = reasonSummary.length ? ` Top skip reasons: ${reasonSummary.join("; ")}.` : "";
    setNotice(
      `Batch run ${result.batchRunId} completed. Matched: ${result.matched.length}, skipped: ${result.skipped.length}.${reasonsText}`
    );
  };

  const handleStatusAdvance = () => {
    if (!selectedRecord) return;
    const result = updateRedeploymentStatus(
      selectedRecord.id,
      statusAction,
      "Recruiter",
      "Advanced from recruiter pipeline"
    );
    if (!result.ok) {
      setNotice(result.message || "Unable to update redeployment status.");
      return;
    }
    refreshRecords();
    setNotice(`Status updated to ${statusAction} for ${result.record.applicantName}.`);
  };

  const allowedStatusActions = useMemo(() => {
    if (!selectedRecord) return [];
    return REDEPLOYMENT_STATUSES.filter(
      (status) =>
        status !== selectedRecord.redeploymentStatus &&
        canTransitionRedeployment(selectedRecord.redeploymentStatus, status)
    );
  }, [selectedRecord]);

  useEffect(() => {
    if (allowedStatusActions.length === 0) return;
    if (!allowedStatusActions.includes(statusAction)) setStatusAction(allowedStatusActions[0]);
  }, [allowedStatusActions, statusAction]);

  const toggleRow = (recordId) => {
    setSelectedIds((ids) => (ids.includes(recordId) ? ids.filter((id) => id !== recordId) : [...ids, recordId]));
  };

  const togglePageSelection = () => {
    if (allPageSelected) {
      const pageIds = new Set(pagination.pageItems.map((row) => row.id));
      setSelectedIds((ids) => ids.filter((id) => !pageIds.has(id)));
      return;
    }
    const merged = new Set([...selectedIds, ...pagination.pageItems.map((row) => row.id)]);
    setSelectedIds([...merged]);
  };

  const hasActiveFilters =
    roleFilter !== "Any" ||
    statusFilter !== "Any" ||
    ratingBandFilter !== "Any" ||
    availabilityFilter !== "Any" ||
    Boolean(skillQuery);

  const requestMissing = useMemo(() => missingRequestFields(selectedRecord), [selectedRecord]);
  const matchMeta = selectedRecord?.matchMeta || {};
  const matchHasScore = typeof matchMeta.matchScore === "number" && Number.isFinite(matchMeta.matchScore);
  const hasAllowedTransitions = allowedStatusActions.length > 0;

  return (
    <PageFrame size="wide">
      <div className="space-y-6">
        <section className="surface-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-heading">Recruiter Workspace</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Internal Mobility Pipeline
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                Manage post-contract redeployment requests with governed status transitions, AI-assisted
                scoring, and auditable batch operations.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-end gap-2 text-xs text-slate-600">
                <span className="font-semibold">Quick filters</span>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("Any");
                    setPage(1);
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300"
                >
                  All statuses
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("RequestSubmitted");
                    setPage(1);
                  }}
                  className={[
                    "rounded-xl border bg-white px-4 py-3 text-left transition",
                    statusFilter === "RequestSubmitted" ? "border-slate-400" : "border-slate-200 hover:border-slate-300",
                  ].join(" ")}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Queue</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{queueMetrics.queue}</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("UnderReview");
                    setPage(1);
                  }}
                  className={[
                    "rounded-xl border bg-white px-4 py-3 text-left transition",
                    statusFilter === "UnderReview" ? "border-slate-400" : "border-slate-200 hover:border-slate-300",
                  ].join(" ")}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Under Review</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{queueMetrics.underReview}</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("Matched");
                    setPage(1);
                  }}
                  className={[
                    "rounded-xl border bg-white px-4 py-3 text-left transition",
                    statusFilter === "Matched" ? "border-slate-400" : "border-slate-200 hover:border-slate-300",
                  ].join(" ")}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Matched</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{queueMetrics.matched}</p>
                </button>
              </div>
            </div>
          </div>
        </section>

        {notice ? (
          <section className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {notice}
          </section>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="surface-card overflow-hidden">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                <Filter size={13} /> Pipeline Filters
              </div>
              <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
                <select
                  value={roleFilter}
                  onChange={(event) => {
                    setRoleFilter(event.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  {roleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "Any" ? "Role: Any" : option}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Any">Status: Any</option>
                  {REDEPLOYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <select
                  value={ratingBandFilter}
                  onChange={(event) => {
                    setRatingBandFilter(event.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Any">Rating: Any</option>
                  <option value="High">High (&gt;=4.5)</option>
                  <option value="Medium">Medium (3.0-4.4)</option>
                  <option value="Low">Low (&lt;3.0)</option>
                </select>
                <select
                  value={availabilityFilter}
                  onChange={(event) => {
                    setAvailabilityFilter(event.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Any">Availability: Any</option>
                  <option value="Within7Days">Within 7 days</option>
                  <option value="Within30Days">Within 30 days</option>
                </select>
                <input
                  value={skillQuery}
                  onChange={(event) => {
                    setSkillQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Skill keyword"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Selected: {selectedIds.length}</span>
                  {hasActiveFilters ? (
                    <span className="text-xs text-slate-500">Selection persists across filters.</span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBatchMatch}
                    disabled={selectedIds.length === 0}
                    className={[
                      "rounded-full px-4 py-2 text-xs font-semibold transition",
                      selectedIds.length === 0
                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                        : "bg-slate-950 text-white hover:bg-slate-800",
                    ].join(" ")}
                  >
                    Run Batch Match
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[82rem] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-6 py-3">
                      <input type="checkbox" checked={allPageSelected} onChange={togglePageSelection} />
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 font-medium">
                      <button type="button" onClick={() => setSortState((state) => nextSort(state, "applicantName"))}>
                        Applicant
                      </button>
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 font-medium">
                      <button type="button" onClick={() => setSortState((state) => nextSort(state, "contractStatus"))}>
                        Contract Status
                      </button>
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 font-medium">
                      <button type="button" onClick={() => setSortState((state) => nextSort(state, "redeploymentStatus"))}>
                        Redeployment Status
                      </button>
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 font-medium">
                      <button type="button" onClick={() => setSortState((state) => nextSort(state, "internalRating"))}>
                        Internal Rating
                      </button>
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 font-medium">
                      <button type="button" onClick={() => setSortState((state) => nextSort(state, "matchScore"))}>
                        Match Score
                      </button>
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 font-medium">
                      <button type="button" onClick={() => setSortState((state) => nextSort(state, "lastMatch"))}>
                        Last Match
                      </button>
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.pageItems.length > 0 ? (
                    pagination.pageItems.map((row) => (
                      <tr
                        key={row.id}
                        className={[
                          "border-t border-slate-100",
                          selectedRowId === row.id ? "bg-slate-50" : "bg-white",
                        ].join(" ")}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.id)}
                            onChange={() => toggleRow(row.id)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <button
                            type="button"
                            className="font-semibold text-slate-900 hover:text-slate-700"
                            onClick={() => {
                              setSelectedRowId(row.id);
                            }}
                          >
                            {row.applicantName}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-700">{row.currentContractStatus}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(row.redeploymentStatus)}`}>
                            {row.redeploymentStatus}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                          {formatRating(row.internalRating.overall)}/5
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                          {typeof row.matchMeta?.matchScore === "number" ? row.matchMeta.matchScore.toFixed(1) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                          {formatDateTime(row.matchMeta?.lastMatchedAt)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <button
                            type="button"
                            onClick={() => handleSingleMatch(row.id)}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
                          >
                            Match
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-6 py-10 text-sm text-slate-600" colSpan={8}>
                        No records match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              onPrev={() => setPage((value) => Math.max(1, value - 1))}
              onNext={() => setPage((value) => Math.min(pagination.totalPages, value + 1))}
              onPageChange={setPage}
              pageSizeOptions={[8, 12, 20]}
              onPageSizeChange={(next) => {
                setPageSize(next);
                setPage(1);
              }}
              label="Mobility queue"
            />
          </div>

          <div className="surface-card p-6">
            <p className="section-heading">Applicant Review Panel</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {selectedRecord ? selectedRecord.applicantName : "No record selected"}
            </h2>

            {selectedRecord ? (
              <>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Desired Role</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedRecord.requestMeta.desiredRole || "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Availability</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedRecord.requestMeta.availabilityDate || "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Location Preference</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedRecord.requestMeta.locationPreference || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Applicant Note</p>
                  <p className="mt-1">{selectedRecord.requestMeta.applicantNote || "No request note provided."}</p>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">AI Match Summary</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Review the latest score and rationale before advancing status.
                      </p>
                    </div>
                    <Button icon={Play} onClick={() => handleSingleMatch(selectedRecord.id)}>
                      Run AI Match
                    </Button>
                  </div>

                  {requestMissing.length ? (
                    <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                      <AlertTriangle size={16} className="mt-0.5" />
                      <div>
                        <p className="font-semibold">Request completeness</p>
                        <p className="mt-0.5 text-xs text-amber-900/90">
                          Missing: {requestMissing.join(", ")}. You can still run a match, but results may be less accurate.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Match Score</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {matchHasScore ? matchMeta.matchScore.toFixed(1) : "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Rating Impact</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{matchMeta.ratingImpact || "—"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Last Matched</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(matchMeta.lastMatchedAt)}</p>
                      {matchMeta.matchedBy ? (
                        <p className="mt-1 text-xs text-slate-600">by {matchMeta.matchedBy}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Rationale</p>
                    <p className="mt-1">{matchMeta.rationale || "Run an AI match to generate a rationale."}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Advance Status</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      value={hasAllowedTransitions ? statusAction : ""}
                      onChange={(event) => setStatusAction(event.target.value)}
                      disabled={!hasAllowedTransitions}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    >
                      {hasAllowedTransitions ? (
                        allowedStatusActions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))
                      ) : (
                        <option value="">No transitions available</option>
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={handleStatusAdvance}
                      disabled={!hasAllowedTransitions}
                      className={[
                        "rounded-xl px-4 py-2 text-sm font-semibold transition",
                        hasAllowedTransitions
                          ? "bg-slate-950 text-white hover:bg-slate-800"
                          : "cursor-not-allowed bg-slate-200 text-slate-500",
                      ].join(" ")}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">History Timeline</p>
                  <div className="mt-2 max-h-44 space-y-2 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    {selectedRecord.history.length > 0 ? (
                      selectedRecord.history
                        .slice()
                        .reverse()
                        .slice(0, 10)
                        .map((entry, index) => (
                          <div key={`${entry.updatedAt}-${entry.changeType}-${index}`} className="text-xs">
                            <p className="font-semibold text-slate-800">{entry.changeType}</p>
                            <p className="mt-0.5 text-slate-700">{entry.summary}</p>
                            <p className="mt-0.5 text-slate-500">
                              {entry.updatedByRole} · {formatDateTime(entry.updatedAt)}
                            </p>
                          </div>
                        ))
                    ) : (
                      <p className="text-xs text-slate-500">No timeline events yet.</p>
                    )}
                  </div>
                </div>

              </>
            ) : (
              <p className="mt-3 text-sm text-slate-600">Select a queue record to start review.</p>
            )}
          </div>
        </section>
      </div>
    </PageFrame>
  );
}
