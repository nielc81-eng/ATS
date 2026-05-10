import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminWorkforce } from "../../context/AdminWorkforceContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import { buildSourceKey, talentAvailabilityStates, talentPoolStatuses } from "../../lib/adminWorkforceMockData";

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
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

function summarize(text, limit = 120) {
  const value = String(text || "").trim();
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1)}...`;
}

function badgeTone(status) {
  if (status === "Ready") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (status === "On Hold") return "bg-amber-50 text-amber-800 border-amber-200";
  if (status === "Deployed") return "bg-cyan-50 text-cyan-800 border-cyan-200";
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

export default function AdminTalentPool() {
  const { jobs, getApplicationsForJob } = useRecruitmentData();
  const {
    talentPool,
    assignments,
    addToPool,
    editTalent,
    setTalentStatus,
    getAssignmentsForTalent,
    getActiveAssignmentForTalent,
  } = useAdminWorkforce();

  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  const [selectedTalentId, setSelectedTalentId] = useState("");
  const [notice, setNotice] = useState({ type: "", message: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSource, setDialogSource] = useState(null);
  const [dialogForm, setDialogForm] = useState({
    status: "Ready",
    roleFit: "",
    availability: "Available",
    location: "Remote",
    adminNotes: "",
  });
  const [detailForm, setDetailForm] = useState({
    status: "Ready",
    roleFit: "",
    availability: "Available",
    location: "Remote",
    adminNotes: "",
  });

  const sourceCandidates = useMemo(
    () =>
      jobs.flatMap((job) => {
        const applications = getApplicationsForJob(job.id);

        return job.candidates.map((candidate) => {
          const application =
            applications.find((item) => item.id === candidate.applicationId) ??
            applications.find((item) => item.screeningCandidateApplicationId === candidate.applicationId) ??
            null;

          const sourceApplicationId = application?.id || candidate.applicationId || "";
          return {
            sourceKey: buildSourceKey({
              applicationId: sourceApplicationId,
              jobId: job.id,
              candidateName: candidate.alias || candidate.nameHint || application?.candidateName,
            }),
            applicationId: sourceApplicationId,
            jobId: job.id,
            jobTitle: job.title,
            department: job.department,
            candidateName: application?.candidateName || candidate.alias || candidate.nameHint || "Candidate",
            candidateAlias: candidate.alias || candidate.nameHint || "Candidate",
            candidateEmail: application?.candidateEmail || "",
            score: candidate.score,
            yearsExperience: candidate.yearsExperience,
            skills: candidate.skills,
            matchContext: candidate.justification || candidate.matchSignals?.[0] || "",
            applicationStatus: application?.status || "Submitted",
          };
        });
      }),
    [getApplicationsForJob, jobs]
  );

  const existingSourceKeys = useMemo(
    () => new Set(talentPool.map((record) => record.sourceKey)),
    [talentPool]
  );

  const filteredSourceCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();
    const skillQuery = skillFilter.trim().toLowerCase();

    return sourceCandidates.filter((source) => {
      const matchesSearch = !query
        ? true
        : [
            source.candidateName,
            source.jobTitle,
            source.department,
            source.applicationStatus,
            source.matchContext,
            ...source.skills,
          ].some((value) => String(value).toLowerCase().includes(query));

      const matchesSkill = !skillQuery
        ? true
        : source.skills.some((skill) => skill.toLowerCase().includes(skillQuery));

      return matchesSearch && matchesSkill;
    });
  }, [search, skillFilter, sourceCandidates]);

  const filteredPool = useMemo(() => {
    const query = search.trim().toLowerCase();
    const skillQuery = skillFilter.trim().toLowerCase();

    return talentPool.filter((record) => {
      const matchesStatus = statusFilter === "All" ? true : record.status === statusFilter;
      const matchesAvailability =
        availabilityFilter === "All" ? true : record.availability === availabilityFilter;
      const matchesSearch = !query
        ? true
        : [
            record.candidateName,
            record.roleFit,
            record.location,
            record.adminNotes,
            record.sourceJobTitle,
            record.sourceDepartment,
            ...record.skills,
          ].some((value) => String(value).toLowerCase().includes(query));
      const matchesSkill = !skillQuery
        ? true
        : record.skills.some((skill) => skill.toLowerCase().includes(skillQuery));

      return matchesStatus && matchesAvailability && matchesSearch && matchesSkill;
    });
  }, [availabilityFilter, search, skillFilter, statusFilter, talentPool]);

  const selectedTalent = useMemo(
    () =>
      filteredPool.find((record) => record.id === selectedTalentId) ??
      filteredPool[0] ??
      null,
    [filteredPool, selectedTalentId]
  );

  useEffect(() => {
    if (filteredPool.length === 0) {
      setSelectedTalentId("");
      return;
    }

    if (!filteredPool.some((record) => record.id === selectedTalentId)) {
      setSelectedTalentId(filteredPool[0].id);
    }
  }, [filteredPool, selectedTalentId]);

  useEffect(() => {
    if (!selectedTalent) return;
    setDetailForm({
      status: selectedTalent.status,
      roleFit: selectedTalent.roleFit,
      availability: selectedTalent.availability,
      location: selectedTalent.location,
      adminNotes: selectedTalent.adminNotes,
    });
  }, [selectedTalent]);

  useEffect(() => {
    if (!dialogSource) return;
    setDialogForm({
      status: "Ready",
      roleFit: dialogSource.jobTitle,
      availability: "Available",
      location: "Remote",
      adminNotes: dialogSource.matchContext ? `Match context: ${dialogSource.matchContext}` : "",
    });
  }, [dialogSource]);

  const stats = useMemo(() => {
    const activeAssignments = assignments.filter((assignment) => assignment.status === "Active");
    const deployedRecords = talentPool.filter((record) => record.status === "Deployed").length;
    const onHoldRecords = talentPool.filter((record) => record.status === "On Hold").length;
    const archivedRecords = talentPool.filter((record) => record.status === "Archived").length;
    return {
      poolTotal: talentPool.length,
      ready: talentPool.filter((record) => record.status === "Ready").length,
      deployed: deployedRecords,
      onHold: onHoldRecords,
      archived: archivedRecords,
      assignments: activeAssignments.length,
      sourceCandidates: sourceCandidates.length,
    };
  }, [assignments, sourceCandidates.length, talentPool]);

  const handleOpenAddDialog = (source) => {
    setDialogSource(source);
    setDialogOpen(true);
  };

  const handleAddCandidate = () => {
    if (!dialogSource) return;

    const result = addToPool(dialogSource, dialogForm);
    if (!result.ok) {
      setNotice({ type: "error", message: result.message });
      return;
    }

    setNotice({
      type: "success",
      message: `${result.record.candidateName} was added to the talent pool.`,
    });
    setSelectedTalentId(result.record.id);
    setDialogOpen(false);
    setDialogSource(null);
  };

  const handleSaveTalent = () => {
    if (!selectedTalent) return;

    const currentStatus = selectedTalent.status;
    const desiredStatus = detailForm.status;

    const detailResult = editTalent(selectedTalent.id, {
      roleFit: detailForm.roleFit,
      availability: detailForm.availability,
      location: detailForm.location,
      adminNotes: detailForm.adminNotes,
    });

    if (!detailResult.ok) {
      setNotice({ type: "error", message: detailResult.message });
      return;
    }

    if (currentStatus !== "Deployed" && desiredStatus !== currentStatus) {
      const statusResult = setTalentStatus(
        selectedTalent.id,
        desiredStatus,
        desiredStatus === "Archived" ? detailForm.adminNotes : ""
      );
      if (!statusResult.ok) {
        setNotice({ type: "error", message: statusResult.message });
        return;
      }
    }

    setNotice({
      type: "success",
      message: `${selectedTalent.candidateName} was updated.`,
    });
  };

  const activeAssignment = selectedTalent ? getActiveAssignmentForTalent(selectedTalent.id) : null;
  const talentHistory = selectedTalent?.history || [];
  const talentAssignments = selectedTalent ? getAssignmentsForTalent(selectedTalent.id) : [];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-6 py-6 text-white shadow-soft sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Workforce planning</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Talent pool management
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Build a reusable bench from screened talent, then keep the pool under admin-only control.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pooled talent" value={formatNumber(stats.poolTotal)} tone="cyan" note="Records retained locally." />
        <MetricCard label="Ready" value={formatNumber(stats.ready)} tone="emerald" note="Available for assignment." />
        <MetricCard label="On hold" value={formatNumber(stats.onHold)} tone="amber" note="Paused from deployment." />
        <MetricCard label="Deployed" value={formatNumber(stats.deployed)} note="Currently assigned." />
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

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Screened talent library</h2>
            <p className="mt-1 text-sm text-slate-600">
              Recruiter data feeds this view, but only admins can add records to the pool.
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="talent-search" className="mb-2 block text-sm font-medium text-slate-700">
                  Search talent
                </label>
                <input
                  id="talent-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search names, jobs, notes, or skills"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label htmlFor="skill-filter" className="mb-2 block text-sm font-medium text-slate-700">
                  Skill filter
                </label>
                <input
                  id="skill-filter"
                  value={skillFilter}
                  onChange={(event) => setSkillFilter(event.target.value)}
                  placeholder="React, sourcing, reporting..."
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {filteredSourceCandidates.length > 0 ? (
                filteredSourceCandidates.map((source) => {
                  const alreadyPooled = existingSourceKeys.has(source.sourceKey);
                  return (
                    <article
                      key={source.sourceKey}
                      className="w-full rounded-3xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-950">{source.candidateName}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {source.jobTitle} - {source.department} - {source.applicationStatus}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {source.score} match
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenAddDialog(source)}
                            disabled={alreadyPooled}
                            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {alreadyPooled ? "In pool" : "Add to pool"}
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {source.skills.slice(0, 4).map((skill) => (
                          <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {summarize(source.matchContext, 160)}
                      </p>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-600">
                  No screened candidates available.
                </div>
              )}
            </div>
          </div>
        </article>

        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Talent pool workspace</h2>
            <p className="mt-1 text-sm text-slate-600">
              Search, filter, and edit pool records without exposing recruiter controls.
            </p>
          </div>

          <div className="space-y-4 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                <div className="flex flex-wrap gap-2">
                  {["All", ...talentPoolStatuses].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={[
                        "rounded-full px-4 py-2 text-sm font-medium transition",
                        statusFilter === status
                          ? "bg-slate-950 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                      ].join(" ")}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Availability</label>
                <div className="flex flex-wrap gap-2">
                  {["All", ...talentAvailabilityStates].map((availability) => (
                    <button
                      key={availability}
                      type="button"
                      onClick={() => setAvailabilityFilter(availability)}
                      className={[
                        "rounded-full px-4 py-2 text-sm font-medium transition",
                        availabilityFilter === availability
                          ? "bg-slate-950 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                      ].join(" ")}
                    >
                      {availability}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {filteredPool.length > 0 ? (
                filteredPool.map((record) => {
                  const active = selectedTalent?.id === record.id;
                  const assignment = getActiveAssignmentForTalent(record.id);

                  return (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => setSelectedTalentId(record.id)}
                      className={[
                        "w-full rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft",
                        active ? "border-slate-950 ring-2 ring-slate-950" : "border-slate-200 bg-white",
                      ].join(" ")}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-950">{record.candidateName}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {record.roleFit} - {record.location}
                          </p>
                        </div>
                        <span className={["rounded-full border px-3 py-1 text-xs font-semibold", badgeTone(record.status)].join(" ")}>
                          {record.status}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {record.skills.slice(0, 4).map((skill) => (
                          <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
                        <span>{record.availability}</span>
                        <span>{assignment ? `Assigned to ${assignment.targetType}: ${assignment.targetName}` : "No active deployment"}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-600">
                  No pool records match the current filters.
                </div>
              )}
            </div>

            {selectedTalent ? (
              <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{selectedTalent.candidateName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Added {formatDateTime(selectedTalent.addedAt)} by {selectedTalent.addedBy}
                    </p>
                  </div>
                  <Link
                    to="/admin/deployment-board"
                    className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Open deployment board
                  </Link>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Status
                      </label>
                      {selectedTalent.status === "Deployed" ? (
                        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-3 text-sm font-semibold text-cyan-800">
                          Deployed
                        </div>
                      ) : (
                        <select
                          value={detailForm.status}
                          onChange={(event) =>
                            setDetailForm((prev) => ({ ...prev, status: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="Ready">Ready</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Archived">Archived</option>
                        </select>
                      )}
                      {selectedTalent.status === "Deployed" ? (
                        <p className="mt-2 text-xs text-slate-500">
                          Deployed status is managed from the deployment board.
                        </p>
                      ) : null}
                    </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Availability
                    </label>
                    <select
                      value={detailForm.availability}
                      onChange={(event) =>
                        setDetailForm((prev) => ({ ...prev, availability: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    >
                      {talentAvailabilityStates.map((availability) => (
                        <option key={availability} value={availability}>
                          {availability}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Role fit
                    </label>
                    <input
                      value={detailForm.roleFit}
                      onChange={(event) =>
                        setDetailForm((prev) => ({ ...prev, roleFit: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Location
                    </label>
                    <input
                      value={detailForm.location}
                      onChange={(event) =>
                        setDetailForm((prev) => ({ ...prev, location: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Admin notes
                  </label>
                  <textarea
                    rows={4}
                    value={detailForm.adminNotes}
                    onChange={(event) =>
                      setDetailForm((prev) => ({ ...prev, adminNotes: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="Add admin-only notes..."
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedTalent.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">Assignment</p>
                  {activeAssignment ? (
                    <div className="mt-2 text-sm text-slate-600">
                      {activeAssignment.targetType}: {activeAssignment.targetName}
                      <div className="mt-1 text-xs text-slate-500">
                        Start {activeAssignment.startDate || "N/A"} - {activeAssignment.status}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">No active deployment.</p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleSaveTalent}
                    className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Save changes
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-950">Match context</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {summarize(selectedTalent.matchContext, 200) || "No match context saved."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-950">History</p>
                    <div className="mt-2 space-y-2">
                      {talentHistory.slice(0, 3).map((entry) => (
                        <div key={`${entry.action}-${entry.at}`} className="text-sm text-slate-600">
                          <span className="font-semibold text-slate-900">{entry.action}</span> - {entry.detail}
                        </div>
                      ))}
                      {talentHistory.length === 0 ? (
                        <p className="text-sm text-slate-600">No history yet.</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">Deployment history</p>
                  <div className="mt-2 space-y-2">
                    {talentAssignments.length > 0 ? (
                      talentAssignments.map((assignment) => (
                        <div key={assignment.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                          <span className="font-semibold text-slate-900">{assignment.targetType}</span>{" "}
                          {assignment.targetName} - {assignment.status}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-600">No deployments recorded yet.</p>
                    )}
                  </div>
                </div>
              </aside>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-600">
                Select a pooled talent record to manage details.
              </div>
            )}
          </div>
        </article>
      </section>

      {dialogOpen && dialogSource ? (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px]" />
          <section
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
              <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
                <div className="bg-slate-950 p-6 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Add to pool</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                    {dialogSource.candidateName}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {dialogSource.jobTitle} - {dialogSource.department}
                  </p>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                    <p className="font-semibold text-white">Match context</p>
                    <p className="mt-2 leading-6">{summarize(dialogSource.matchContext, 180)}</p>
                  </div>
                </div>

                <div className="p-6 sm:p-7 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                      <select
                        value={dialogForm.status}
                        onChange={(event) =>
                          setDialogForm((prev) => ({ ...prev, status: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      >
                        {talentPoolStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Availability</label>
                      <select
                        value={dialogForm.availability}
                        onChange={(event) =>
                          setDialogForm((prev) => ({ ...prev, availability: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      >
                        {talentAvailabilityStates.map((availability) => (
                          <option key={availability} value={availability}>
                            {availability}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Role fit</label>
                      <input
                        value={dialogForm.roleFit}
                        onChange={(event) =>
                          setDialogForm((prev) => ({ ...prev, roleFit: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Location</label>
                      <input
                        value={dialogForm.location}
                        onChange={(event) =>
                          setDialogForm((prev) => ({ ...prev, location: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Admin notes</label>
                    <textarea
                      rows={4}
                      value={dialogForm.adminNotes}
                      onChange={(event) =>
                        setDialogForm((prev) => ({ ...prev, adminNotes: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDialogOpen(false);
                        setDialogSource(null);
                      }}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCandidate}
                      className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Add candidate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
