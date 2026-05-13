import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAdminWorkforce } from "../../context/AdminWorkforceContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import { useTalentPool } from "../../context/TalentPoolContext";
import {
  deploymentRequestStatuses,
  deploymentTargetTypes,
  deploymentUrgencyLevels,
} from "../../lib/adminWorkforceMockData";

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

function defaultRequestForm(talent, preferredTarget = "") {
  return {
    targetType: "Job",
    targetId: "",
    targetName: preferredTarget,
    department: talent?.sourceDepartment || "",
    location: talent?.location || "Remote",
    urgency: "Medium",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    justification: "",
  };
}

export default function RecruiterDeployment() {
  const { session } = useAuth();
  const { jobs } = useRecruitmentData();
  const { visiblePools } = useTalentPool();
  const {
    talentPool,
    requests,
    createRequest,
    updateRequest,
    submitRequest,
    getActiveAssignmentForTalent,
  } = useAdminWorkforce();

  const accessibleDepartments = useMemo(
    () => visiblePools.map((pool) => pool.department).filter(Boolean),
    [visiblePools]
  );

  const visibleTalent = useMemo(() => {
    return talentPool
      .filter((record) => record.status !== "Archived")
      .filter((record) => {
        if (!accessibleDepartments.length) return false;
        return (
          accessibleDepartments.includes(record.sourceDepartment) ||
          accessibleDepartments.includes(record.currentAssignmentTargetName) ||
          accessibleDepartments.includes(record.roleFit)
        );
      })
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  }, [accessibleDepartments, talentPool]);

  const recruiterRequests = useMemo(
    () =>
      requests
        .filter(
          (request) => request.requesterEmail === String(session?.email || "").toLowerCase()
        )
        .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)),
    [requests, session?.email]
  );

  const [selectedTalentId, setSelectedTalentId] = useState(visibleTalent[0]?.id || "");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  const [skillFilter, setSkillFilter] = useState("");
  const [notice, setNotice] = useState("");
  const [requestForm, setRequestForm] = useState(
    defaultRequestForm(visibleTalent[0], jobs[0] ? `${jobs[0].title} - ${jobs[0].department}` : "")
  );

  useEffect(() => {
    if (!visibleTalent.length) {
      setSelectedTalentId("");
      setSelectedRequestId("");
      return;
    }

    if (!visibleTalent.some((record) => record.id === selectedTalentId)) {
      setSelectedTalentId(visibleTalent[0].id);
    }
  }, [selectedTalentId, visibleTalent]);

  const selectedTalent = useMemo(
    () => visibleTalent.find((record) => record.id === selectedTalentId) || null,
    [selectedTalentId, visibleTalent]
  );

  const selectedRequest = useMemo(
    () => recruiterRequests.find((request) => request.id === selectedRequestId) || null,
    [recruiterRequests, selectedRequestId]
  );

  const eligibleJobs = useMemo(() => {
    if (!accessibleDepartments.length) return [];
    return jobs.filter((job) => accessibleDepartments.includes(job.department));
  }, [accessibleDepartments, jobs]);

  const targetOptions = useMemo(() => {
    if (requestForm.targetType === "Job") {
      return eligibleJobs.map((job) => ({
        value: job.id,
        label: `${job.title} - ${job.department}`,
      }));
    }

    if (requestForm.targetType === "Department") {
      return accessibleDepartments.map((department) => ({
        value: department,
        label: department,
      }));
    }

    return ["Platform Refresh", "Hiring Ops Sprint", "Candidate Experience Push", "Regional Expansion"].map(
      (project) => ({ value: project, label: project })
    );
  }, [accessibleDepartments, eligibleJobs, requestForm.targetType]);

  const filteredTalent = useMemo(() => {
    const query = search.trim().toLowerCase();
    const skillQuery = skillFilter.trim().toLowerCase();

    return visibleTalent.filter((record) => {
      const matchesStatus = statusFilter === "All" ? true : record.status === statusFilter;
      const matchesAvailability =
        availabilityFilter === "All" ? true : record.availability === availabilityFilter;
      const matchesSearch = !query
        ? true
        : [
            record.candidateName,
            record.candidateEmail,
            record.sourceJobTitle,
            record.sourceDepartment,
            record.roleFit,
            record.location,
            record.status,
            ...record.skills,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
      const matchesSkill = !skillQuery
        ? true
        : record.skills.some((skill) => skill.toLowerCase().includes(skillQuery));

      return matchesStatus && matchesAvailability && matchesSearch && matchesSkill;
    });
  }, [availabilityFilter, search, skillFilter, statusFilter, visibleTalent]);

  useEffect(() => {
    const latestRequest =
      recruiterRequests.find((request) => request.talentId === selectedTalentId) || null;

    if (selectedRequest && selectedRequest.talentId === selectedTalentId) {
      setRequestForm({
        targetType: selectedRequest.targetType,
        targetId: selectedRequest.targetId,
        targetName: selectedRequest.targetName,
        department: selectedRequest.department,
        location: selectedRequest.location,
        urgency: selectedRequest.urgency,
        startDate: selectedRequest.startDate || new Date().toISOString().slice(0, 10),
        endDate: selectedRequest.endDate || "",
        justification: selectedRequest.justification || "",
      });
      return;
    }

    if (selectedTalent) {
      const preferredTarget =
        eligibleJobs[0] ? `${eligibleJobs[0].title} - ${eligibleJobs[0].department}` : "";
      setRequestForm(defaultRequestForm(selectedTalent, preferredTarget));
      setSelectedRequestId(latestRequest?.id || "");
    }
  }, [eligibleJobs, recruiterRequests, selectedRequest, selectedTalent, selectedTalentId]);

  useEffect(() => {
    if (!selectedTalentId) return;
    const nextRequest = recruiterRequests.find((request) => request.id === selectedRequestId);
    if (nextRequest) {
      setRequestForm({
        targetType: nextRequest.targetType,
        targetId: nextRequest.targetId,
        targetName: nextRequest.targetName,
        department: nextRequest.department,
        location: nextRequest.location,
        urgency: nextRequest.urgency,
        startDate: nextRequest.startDate || new Date().toISOString().slice(0, 10),
        endDate: nextRequest.endDate || "",
        justification: nextRequest.justification || "",
      });
    }
  }, [recruiterRequests, selectedRequestId, selectedTalentId]);

  const metrics = useMemo(
    () => ({
      visibleTalent: filteredTalent.length,
      draftRequests: recruiterRequests.filter((request) => request.status === "Draft").length,
      pendingRequests: recruiterRequests.filter((request) => request.status === "Pending Approval").length,
      assignedRequests: recruiterRequests.filter((request) => request.status === "Assigned").length,
    }),
    [filteredTalent.length, recruiterRequests]
  );

  const loadTalent = (record) => {
    setSelectedTalentId(record.id);
    const latestRequest = recruiterRequests.find((request) => request.talentId === record.id);
    setSelectedRequestId(latestRequest?.id || "");
    setNotice("");
  };

  const handleRequestSave = (submitAfterSave = false) => {
    if (!selectedTalent) {
      setNotice("Pick a talent record first.");
      return;
    }

    const payload = {
      ...requestForm,
      requester: session?.name || "Recruiter",
      requesterEmail: session?.email || "",
      requesterRole: session?.role || "Recruiter",
      targetType: requestForm.targetType,
      targetId: requestForm.targetType === "Job" ? requestForm.targetId : requestForm.targetName,
      targetName: requestForm.targetName,
      department: requestForm.department,
      location: requestForm.location,
      urgency: requestForm.urgency,
      startDate: requestForm.startDate,
      endDate: requestForm.endDate,
      justification: requestForm.justification,
    };

    const editableStatuses = new Set(["Draft", "Rejected"]);
    let requestId = editableStatuses.has(selectedRequest?.status || "") ? selectedRequestId : "";

    if (requestId) {
      const updateResult = updateRequest(requestId, payload);
      if (!updateResult.ok) {
        setNotice(updateResult.message);
        return;
      }
      requestId = updateResult.request.id;
    } else {
      const createResult = createRequest(selectedTalent.id, payload);
      if (!createResult.ok) {
        setNotice(createResult.message);
        return;
      }
      requestId = createResult.request.id;
    }

    if (submitAfterSave) {
      const submitResult = submitRequest(requestId);
      setNotice(
        submitResult.ok
          ? `${selectedTalent.candidateName} sent for approval.`
          : submitResult.message
      );
      if (submitResult.ok) {
        setSelectedRequestId(requestId);
      }
      return;
    }

    setSelectedRequestId(requestId);
    setNotice(`${selectedTalent.candidateName} deployment draft saved.`);
  };

  const handleSelectRequest = (request) => {
    setSelectedTalentId(request.talentId);
    setSelectedRequestId(request.id);
    setNotice("");
  };

  const selectedAssignment = selectedTalent
    ? getActiveAssignmentForTalent(selectedTalent.id)
    : null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-6 py-6 text-white shadow-soft sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Recruiter workspace</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Deployment requests
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Propose where screened talent should go, then hand the request to admin for final approval and assignment.
          </p>
        </div>
      </section>

      {!visibleTalent.length ? (
        <section className="surface-card p-6 sm:p-8">
          <p className="text-sm text-slate-600">
            No eligible talent is visible yet. Ask an administrator to seed or extend your pool access.
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Visible talent", value: metrics.visibleTalent, note: "Scoped to your access." },
          { label: "Draft requests", value: metrics.draftRequests, note: "Saved but not sent." },
          { label: "Pending approval", value: metrics.pendingRequests, note: "Waiting on admins." },
          { label: "Assigned", value: metrics.assignedRequests, note: "Approved and deployed." },
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

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="section-heading">Talent bench</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">Eligible screened talent</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {accessibleDepartments.length
                  ? `${accessibleDepartments.length} departments in scope`
                  : "No department access"}
              </span>
            </div>
          </div>

          <div className="grid gap-4 border-b border-slate-200 p-6 lg:grid-cols-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, skill, location, or department"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
            <input
              value={skillFilter}
              onChange={(event) => setSkillFilter(event.target.value)}
              placeholder="Filter by skill"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="All">All statuses</option>
              {deploymentRequestStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={availabilityFilter}
              onChange={(event) => setAvailabilityFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="All">All availability</option>
              {["Available", "Limited", "Unavailable"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-2">
            {filteredTalent.length > 0 ? (
              filteredTalent.map((record) => {
                const activeAssignment = getActiveAssignmentForTalent(record.id);
                const requestCount = recruiterRequests.filter((request) => request.talentId === record.id).length;

                return (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => loadTalent(record)}
                    className={[
                      "rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-soft",
                      selectedTalentId === record.id
                        ? "border-slate-950 ring-2 ring-slate-950"
                        : "border-slate-200 bg-white",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-950">{record.candidateName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {record.sourceJobTitle || "Screened talent"} - {record.sourceDepartment || "General"}
                        </p>
                      </div>
                      <span className={["rounded-full border px-3 py-1 text-xs font-semibold", badgeTone(record.status)].join(" ")}>
                        {record.status}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {record.skills.slice(0, 4).map((skill) => (
                        <span
                          key={`${record.id}-${skill}`}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Availability</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{record.availability}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Location</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{record.location}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{activeAssignment ? `Deployed to ${activeAssignment.targetName}` : "Ready for request"}</span>
                      <span>{requestCount} request{requestCount === 1 ? "" : "s"}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-600 lg:col-span-2">
                No eligible talent matches the current filters.
              </div>
            )}
          </div>
        </article>

        <article className="space-y-6">
          <section className="surface-card overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <p className="section-heading">Request composer</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">
                {selectedTalent ? selectedTalent.candidateName : "Select a talent record"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Draft the handoff and send it for administrator approval.
              </p>
            </div>

            <div className="space-y-4 p-6">
              {selectedTalent ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Match context</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {selectedTalent.sourceJobTitle || "Screened candidate"} - {selectedTalent.sourceDepartment || "General"}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {selectedTalent.matchContext || "Use recruiter notes and screening history to justify the deployment."}
                  </p>
                  {selectedAssignment ? (
                    <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      Currently assigned to {selectedAssignment.targetName}.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Target type</label>
                  <select
                    value={requestForm.targetType}
                    onChange={(event) =>
                      setRequestForm((prev) => ({ ...prev, targetType: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  >
                    {deploymentTargetTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Target name</label>
                  <input
                    list="deployment-targets"
                    value={requestForm.targetName}
                    onChange={(event) =>
                      setRequestForm((prev) => ({ ...prev, targetName: event.target.value }))
                    }
                    placeholder="Choose a job, department, or project"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
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
                  <label className="mb-2 block text-sm font-medium text-slate-700">Department</label>
                  <input
                    value={requestForm.department}
                    onChange={(event) =>
                      setRequestForm((prev) => ({ ...prev, department: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Location</label>
                  <input
                    value={requestForm.location}
                    onChange={(event) =>
                      setRequestForm((prev) => ({ ...prev, location: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Urgency</label>
                  <select
                    value={requestForm.urgency}
                    onChange={(event) =>
                      setRequestForm((prev) => ({ ...prev, urgency: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  >
                    {deploymentUrgencyLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Needed start date</label>
                  <input
                    type="date"
                    value={requestForm.startDate}
                    onChange={(event) =>
                      setRequestForm((prev) => ({ ...prev, startDate: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Justification</label>
                <textarea
                  rows={4}
                  value={requestForm.justification}
                  onChange={(event) =>
                    setRequestForm((prev) => ({ ...prev, justification: event.target.value }))
                  }
                  placeholder="Explain why this talent should move now."
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleRequestSave(false)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  onClick={() => handleRequestSave(true)}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Submit to admin
                </button>
              </div>
            </div>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <p className="section-heading">Your requests</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">Submission history</h2>
            </div>
            <div className="space-y-3 p-6">
              {recruiterRequests.length > 0 ? (
                recruiterRequests.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => handleSelectRequest(request)}
                    className={[
                      "w-full rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft",
                      selectedRequestId === request.id
                        ? "border-slate-950 ring-2 ring-slate-950"
                        : "border-slate-200 bg-white",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{request.talentName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {request.targetType}: {request.targetName || "Unassigned target"}
                        </p>
                      </div>
                      <span className={["rounded-full border px-3 py-1 text-xs font-semibold", badgeTone(request.status)].join(" ")}>
                        {request.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {request.justification || "No justification added yet."}
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
                  Your submitted deployment requests will appear here.
                </div>
              )}
            </div>
          </section>
        </article>
      </section>
    </div>
  );
}
