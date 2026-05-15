import React, { useEffect, useMemo, useState } from "react";
import { useAdminWorkforce } from "../../context/AdminWorkforceContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import { deploymentTargetTypes } from "../../lib/adminWorkforceMockData";

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
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
  if (status === "Active") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (status === "Released") return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function MetricCard({ label, value, note, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-950",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-950",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
  };

  return (
    <article className={["rounded-3xl border p-5 shadow-sm", tones[tone]].join(" ")}>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {note ? <p className="mt-2 text-sm text-slate-600">{note}</p> : null}
    </article>
  );
}

export default function AdminDeploymentBoard() {
  const { jobs } = useRecruitmentData();
  const {
    talentPool,
    assignments,
    assignTalent,
    releaseTalent,
    archiveTalent,
    getActiveAssignmentForTalent,
  } = useAdminWorkforce();

  const deployableTalent = useMemo(
    () => talentPool.filter((record) => record.status !== "Archived"),
    [talentPool]
  );

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === "Active"),
    [assignments]
  );

  const sortedAssignmentHistory = useMemo(
    () =>
      [...assignments].sort(
        (left, right) => Date.parse(right.updatedAt || right.assignedAt || "") - Date.parse(left.updatedAt || left.assignedAt || "")
      ),
    [assignments]
  );

  const [selectedTalentId, setSelectedTalentId] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [targetType, setTargetType] = useState("Job");
  const [targetName, setTargetName] = useState("");
  const [targetId, setTargetId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState({ type: "", message: "" });

  const selectedTalent = useMemo(
    () => deployableTalent.find((record) => record.id === selectedTalentId) ?? deployableTalent[0] ?? null,
    [deployableTalent, selectedTalentId]
  );

  const selectedAssignment = useMemo(
    () => sortedAssignmentHistory.find((assignment) => assignment.id === selectedAssignmentId) ?? null,
    [selectedAssignmentId, sortedAssignmentHistory]
  );

  useEffect(() => {
    if (!deployableTalent.length) {
      setSelectedTalentId("");
      return;
    }

    if (!deployableTalent.some((record) => record.id === selectedTalentId)) {
      setSelectedTalentId(deployableTalent[0].id);
    }
  }, [deployableTalent, selectedTalentId]);

  useEffect(() => {
    const currentAssignment = selectedTalent ? getActiveAssignmentForTalent(selectedTalent.id) : null;
    if (!currentAssignment) {
      setTargetType("Job");
      setTargetName("");
      setTargetId("");
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate("");
      setNotes("");
      return;
    }

    setTargetType(currentAssignment.targetType);
    setTargetName(currentAssignment.targetName);
    setTargetId(currentAssignment.targetId);
    setStartDate(currentAssignment.startDate || new Date().toISOString().slice(0, 10));
    setEndDate(currentAssignment.endDate || "");
    setNotes(currentAssignment.notes || "");
  }, [getActiveAssignmentForTalent, selectedTalent]);

  useEffect(() => {
    if (!selectedAssignment) return;
    setSelectedTalentId(selectedAssignment.talentId);
    setTargetType(selectedAssignment.targetType);
    setTargetName(selectedAssignment.targetName);
    setTargetId(selectedAssignment.targetId);
    setStartDate(selectedAssignment.startDate || new Date().toISOString().slice(0, 10));
    setEndDate(selectedAssignment.endDate || "");
    setNotes(selectedAssignment.notes || "");
  }, [selectedAssignment]);

  const coverageByTarget = useMemo(() => {
    const jobsCoverage = jobs.map((job) => {
      const count = activeAssignments.filter(
        (assignment) => assignment.targetType === "Job" && assignment.targetId === job.id
      ).length;
      return {
        id: job.id,
        name: job.title,
        department: job.department,
        count,
      };
    });

    const departmentNames = [...new Set(jobs.map((job) => job.department))];
    const departmentCoverage = departmentNames.map((department) => ({
      id: department,
      name: department,
      count: activeAssignments.filter(
        (assignment) => assignment.targetType === "Department" && assignment.targetName === department
      ).length,
    }));

    const projectCoverage = [...new Set(
      activeAssignments
        .filter((assignment) => assignment.targetType === "Project")
        .map((assignment) => assignment.targetName)
    )].map((project) => ({
      id: project,
      name: project,
      count: activeAssignments.filter(
        (assignment) => assignment.targetType === "Project" && assignment.targetName === project
      ).length,
    }));

    return { jobsCoverage, departmentCoverage, projectCoverage };
  }, [activeAssignments, jobs]);

  const uncoveredJobs = useMemo(
    () => coverageByTarget.jobsCoverage.filter((job) => job.count === 0),
    [coverageByTarget.jobsCoverage]
  );

  const stats = useMemo(
    () => ({
      active: activeAssignments.length,
      ready: talentPool.filter((record) => record.status === "Ready").length,
      onHold: talentPool.filter((record) => record.status === "On Hold").length,
      gaps: uncoveredJobs.length,
      history: assignments.length,
    }),
    [activeAssignments.length, assignments.length, talentPool, uncoveredJobs.length]
  );

  const jobTargets = useMemo(() => jobs.map((job) => ({ value: job.id, label: `${job.title} - ${job.department}` })), [jobs]);
  const departmentTargets = useMemo(
    () => [...new Set(jobs.map((job) => job.department))].map((department) => ({ value: department, label: department })),
    [jobs]
  );
  const projectTargets = useMemo(
    () => ["Platform Refresh", "Candidate Experience Redesign", "Hiring Ops Sprint", "Onboarding Support"].map(
      (project) => ({ value: project, label: project })
    ),
    []
  );

  const targetOptions =
    targetType === "Job" ? jobTargets : targetType === "Department" ? departmentTargets : projectTargets;

  const currentTalentAssignment = selectedTalent ? getActiveAssignmentForTalent(selectedTalent.id) : null;

  const resolveTarget = (type, name) => {
    const trimmed = String(name || "").trim();
    if (!trimmed) {
      return { targetId: "", targetName: "" };
    }

    if (type === "Job") {
      const match =
        jobs.find((job) => job.id === trimmed) ??
        jobs.find((job) => `${job.title} - ${job.department}` === trimmed) ??
        jobs.find((job) => job.title.toLowerCase() === trimmed.toLowerCase()) ??
        null;

      if (match) {
        return {
          targetId: match.id,
          targetName: match.title,
        };
      }
    }

    return {
      targetId: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      targetName: trimmed,
    };
  };

  const handleAssign = () => {
    if (!selectedTalent) return;

    const resolvedTarget = resolveTarget(targetType, targetName);

    const result = assignTalent(selectedTalent.id, {
      targetType,
      targetName: resolvedTarget.targetName,
      targetId: resolvedTarget.targetId,
      startDate,
      endDate,
      notes,
    });

    if (!result.ok) {
      setNotice({ type: "error", message: result.message });
      return;
    }

    setSelectedAssignmentId(result.assignment.id);
    setNotice({
      type: "success",
      message: `${selectedTalent.candidateName} deployed to ${targetType}: ${targetName}.`,
    });
  };

  const handleLoadAssignment = (assignment) => {
    setSelectedAssignmentId(assignment.id);
    setNotice({ type: "", message: "" });
  };

  const handleRelease = (assignment) => {
    const result = releaseTalent(assignment.talentId, `Released from ${assignment.targetType}: ${assignment.targetName}.`);
    if (!result.ok) {
      setNotice({ type: "error", message: result.message });
      return;
    }

    const talentName = talentPool.find((record) => record.id === assignment.talentId)?.candidateName || assignment.talentId;
    setNotice({
      type: "success",
      message: `${talentName} released from deployment.`,
    });
  };

  const handleArchive = (assignment) => {
    const result = archiveTalent(assignment.talentId, `Archived from deployment board: ${assignment.targetName}.`);
    if (!result.ok) {
      setNotice({ type: "error", message: result.message });
      return;
    }

    const talentName = talentPool.find((record) => record.id === assignment.talentId)?.candidateName || assignment.talentId;
    setNotice({
      type: "success",
      message: `${talentName} archived from workforce planning.`,
    });
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white shadow-soft sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">Deployment management</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Deployment board
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Assign pooled talent to jobs, departments, or project slots and keep a full deployment history.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Active deployments" value={formatNumber(stats.active)} tone="emerald" note="Currently assigned." />
        <MetricCard label="Ready bench" value={formatNumber(stats.ready)} tone="cyan" note="Ready for deployment." />
        <MetricCard label="On hold" value={formatNumber(stats.onHold)} tone="amber" note="Paused from deployment." />
        <MetricCard label="Coverage gaps" value={formatNumber(stats.gaps)} note="Jobs without active coverage." />
        <MetricCard label="Assignment history" value={formatNumber(stats.history)} note="Released and active records." />
      </section>

      {notice.message ? (
        <div
          className={[
            "rounded-2xl border px-4 py-3 text-sm",
            notice.type === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-cyan-200 bg-cyan-50 text-cyan-900",
          ].join(" ")}
        >
          {notice.message}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_1.05fr]">
        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Deployment workspace</h2>
            <p className="mt-1 text-sm text-slate-600">Choose a pooled talent record and assign a target.</p>
          </div>

          <div className="space-y-4 p-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Talent</label>
              <select
                value={selectedTalentId}
                onChange={(event) => setSelectedTalentId(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {deployableTalent.length > 0 ? (
                  deployableTalent.map((record) => (
                    <option key={record.id} value={record.id}>
                      {record.candidateName} - {record.roleFit}
                    </option>
                  ))
                ) : (
                  <option value="">No talent available</option>
                )}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Target type</label>
                <select
                  value={targetType}
                  onChange={(event) => setTargetType(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  {deploymentTargetTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Target name
                </label>
                <input
                  list="deployment-targets"
                  value={targetName}
                  onChange={(event) => setTargetName(event.target.value)}
                  placeholder="Select or type a target"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                <datalist id="deployment-targets">
                  {targetOptions.map((option) => (
                    <option key={option.value} value={option.value} label={option.label} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Start date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">End date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Deployment notes</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add assignment details, coverage notes, or handoff context."
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleAssign}
                className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {currentTalentAssignment ? "Reassign talent" : "Deploy talent"}
              </button>
            </div>
          </div>
        </article>

        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Coverage summary</h2>
            <p className="mt-1 text-sm text-slate-600">Where talent is deployed and where gaps remain.</p>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Open jobs without coverage</p>
              <div className="mt-3 space-y-2">
                {uncoveredJobs.length > 0 ? (
                  uncoveredJobs.slice(0, 4).map((job) => (
                    <div key={job.id} className="rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                      <span className="font-semibold text-slate-900">{job.name}</span>{" "}
                      {job.department}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600">All jobs currently have at least one active deployment.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Jobs covered</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatNumber(coverageByTarget.jobsCoverage.filter((job) => job.count > 0).length)}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Department slots</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatNumber(coverageByTarget.departmentCoverage.reduce((sum, item) => sum + item.count, 0))}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Project slots</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatNumber(coverageByTarget.projectCoverage.reduce((sum, item) => sum + item.count, 0))}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Released assignments</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatNumber(assignments.filter((assignment) => assignment.status === "Released").length)}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Active assignment board</h2>
          <p className="mt-1 text-sm text-slate-600">Release, reassign, or archive deployment records.</p>
        </div>
        <div className="grid gap-4 p-6 lg:grid-cols-2">
          {activeAssignments.length > 0 ? (
            activeAssignments.map((assignment) => {
              const talent = talentPool.find((record) => record.id === assignment.talentId);
              return (
                <article key={assignment.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{talent?.candidateName || assignment.talentId}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {assignment.targetType}: {assignment.targetName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Requested by {assignment.requester || "Talent Acquisition"} {assignment.approvedBy ? `• Approved by ${assignment.approvedBy}` : ""}
                      </p>
                    </div>
                    <span className={["rounded-full border px-3 py-1 text-xs font-semibold", badgeTone(assignment.status)].join(" ")}>
                      {assignment.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Start</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(assignment.startDate)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">End</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(assignment.endDate)}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {assignment.notes || "No deployment notes recorded."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadAssignment(assignment)}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                    >
                      Reassign
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRelease(assignment)}
                      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:border-amber-300"
                    >
                      Release
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchive(assignment)}
                      className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                    >
                      Archive
                    </button>
                  </div>

                  <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-950">Assignment history</p>
                    {assignment.requestId ? (
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
                        Request {assignment.requestId}
                      </div>
                    ) : null}
                    {assignment.history.slice(0, 3).map((entry) => (
                      <div key={`${entry.action}-${entry.at}`} className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">{entry.action}</span> - {entry.detail}
                      </div>
                    ))}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-600 lg:col-span-2">
              No active deployments yet.
            </div>
          )}
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Assignment history</h2>
          <p className="mt-1 text-sm text-slate-600">Recently changed deployment records, including released and archived items.</p>
        </div>
        <div className="space-y-3 p-6">
          {sortedAssignmentHistory.length > 0 ? (
            sortedAssignmentHistory.slice(0, 6).map((assignment) => (
              <button
                key={assignment.id}
                type="button"
                onClick={() => handleLoadAssignment(assignment)}
                className={[
                  "w-full rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft",
                  selectedAssignment?.id === assignment.id ? "border-slate-950 ring-2 ring-slate-950" : "border-slate-200 bg-white",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {talentPool.find((record) => record.id === assignment.talentId)?.candidateName || assignment.talentId}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {assignment.targetType}: {assignment.targetName}
                    </p>
                  </div>
                  <span className={["rounded-full border px-3 py-1 text-xs font-semibold", badgeTone(assignment.status)].join(" ")}>
                    {assignment.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Updated {formatDateTime(assignment.updatedAt || assignment.assignedAt)}
                </p>
              </button>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-600">
              No assignment history yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
