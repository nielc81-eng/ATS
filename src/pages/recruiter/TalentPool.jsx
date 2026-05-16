import React, { useEffect, useMemo, useState } from "react";
import { useTalentPool } from "../../context/TalentPoolContext";
import { PageFrame } from "../../components/layout/ShellPrimitives";
import AutomatedApplicationIntake from "../../components/talentPool/AutomatedApplicationIntake";
import {
  candidateAvailabilityStates,
  talentPoolStatuses,
} from "../../lib/talentPoolSchemas";

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDateTime(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function recommendationTone(score, threshold) {
  if (score >= threshold + 15) return "bg-emerald-100 text-emerald-800";
  if (score >= threshold) return "bg-blue-100 text-blue-800";
  return "bg-slate-100 text-slate-700";
}

export default function RecruiterTalentPool() {
  const {
    visiblePools,
    visibleVacancies,
    visibleCandidates,
    candidateApplicationsForIntake,
    unpooledImportNotices,
    matchingSettings,
    recommendationMap,
    addCandidateFromApplication,
    addCandidateFromResumeUpload,
    updateCandidateStatus,
    updateCandidateDetails,
  } = useTalentPool();
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  const [vacancyFilter, setVacancyFilter] = useState("All");
  const [selectedCandidateId, setSelectedCandidateId] = useState(
    visibleCandidates[0]?.id || ""
  );
  const [intakePoolByApplication, setIntakePoolByApplication] = useState({});
  const [detailForm, setDetailForm] = useState({
    location: "",
    availability: "Immediate",
    skills: "",
    tags: "",
    confidence: 70,
  });

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();
    const skillQuery = skillFilter.trim().toLowerCase();
    const locationQuery = locationFilter.trim().toLowerCase();

    return [...visibleCandidates]
      .filter((candidate) => {
        const matchesStatus = statusFilter === "All" ? true : candidate.status === statusFilter;
        const matchesAvailability =
          availabilityFilter === "All" ? true : candidate.availability === availabilityFilter;
        const matchesSearch = !query
          ? true
          : [
              candidate.name,
              candidate.email,
              candidate.location,
              candidate.status,
              ...candidate.skills,
              ...candidate.tags,
            ]
              .map((value) => String(value || "").toLowerCase())
              .some((value) => value.includes(query));
        const matchesSkill = !skillQuery
          ? true
          : candidate.skills.some((skill) => skill.toLowerCase().includes(skillQuery));
        const matchesLocation = !locationQuery
          ? true
          : candidate.location.toLowerCase().includes(locationQuery);
        const matchesVacancy =
          vacancyFilter === "All"
            ? true
            : (recommendationMap[candidate.id] || []).some(
                (recommendation) =>
                  recommendation.vacancyId === vacancyFilter &&
                  recommendation.score >= matchingSettings.threshold
              );

        return (
          matchesStatus &&
          matchesAvailability &&
          matchesSearch &&
          matchesSkill &&
          matchesLocation &&
          matchesVacancy
        );
      })
      .sort((left, right) => Date.parse(right.updatedOn) - Date.parse(left.updatedOn));
  }, [
    availabilityFilter,
    locationFilter,
    matchingSettings.threshold,
    recommendationMap,
    search,
    skillFilter,
    statusFilter,
    vacancyFilter,
    visibleCandidates,
  ]);

  const selectedCandidate = useMemo(
    () =>
      filteredCandidates.find((candidate) => candidate.id === selectedCandidateId) ||
      filteredCandidates[0] ||
      null,
    [filteredCandidates, selectedCandidateId]
  );

  const selectedCandidateRecommendations = useMemo(
    () => (selectedCandidate ? recommendationMap[selectedCandidate.id] || [] : []),
    [recommendationMap, selectedCandidate]
  );

  useEffect(() => {
    if (!filteredCandidates.some((candidate) => candidate.id === selectedCandidateId)) {
      setSelectedCandidateId(filteredCandidates[0]?.id || "");
    }
  }, [filteredCandidates, selectedCandidateId]);

  useEffect(() => {
    if (!selectedCandidate) return;
    setDetailForm({
      location: selectedCandidate.location,
      availability: selectedCandidate.availability,
      skills: selectedCandidate.skills.join(", "),
      tags: selectedCandidate.tags.join(", "),
      confidence: selectedCandidate.confidence,
    });
  }, [selectedCandidate]);

  const statusCounts = useMemo(() => {
    return talentPoolStatuses.reduce((acc, status) => {
      acc[status] = visibleCandidates.filter((candidate) => candidate.status === status).length;
      return acc;
    }, {});
  }, [visibleCandidates]);

  const intakeRows = useMemo(
    () => candidateApplicationsForIntake.slice(0, 8),
    [candidateApplicationsForIntake]
  );

  const handleIntakeFromApplication = (applicationId) => {
    const selectedPoolId =
      intakePoolByApplication[applicationId] || visiblePools[0]?.id || "";
    const result = addCandidateFromApplication(applicationId, {
      poolIds: selectedPoolId ? [selectedPoolId] : [],
      status: "New",
    });
    setNotice(
      result.ok
        ? `Candidate ${result.candidate.name} added from application intake.`
        : result.message
    );
  };

  const handleSaveCandidate = () => {
    if (!selectedCandidate) return;
    const result = updateCandidateDetails(selectedCandidate.id, {
      location: detailForm.location,
      availability: detailForm.availability,
      skills: splitCsv(detailForm.skills),
      tags: splitCsv(detailForm.tags),
      confidence: Number(detailForm.confidence),
    });
    setNotice(result.ok ? `Updated ${selectedCandidate.name}.` : result.message);
  };

  const hasAssignedPools = visiblePools.length > 0;

  return (
    <PageFrame size="wide">
      <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Talent Acquisition Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Search Talent Pool
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Search active and archived profiles, re-evaluate candidate readiness, and move
          applicants through the pooled talent lifecycle.
        </p>
      </section>

      {!hasAssignedPools ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            Access Required
          </p>
          <p className="mt-2 text-sm text-amber-900">
            No assigned pools found for your recruiter account. Ask an administrator to
            grant pool or department access in Talent Pool settings.
          </p>
        </section>
      ) : null}

      {notice ? (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {notice}
        </section>
      ) : null}

      {unpooledImportNotices.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Auto-imported candidates need pool assignment.</p>
          <p className="mt-1">
            {unpooledImportNotices[0].message}
            {unpooledImportNotices.length > 1
              ? ` (${unpooledImportNotices.length - 1} more pending)`
              : ""}
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="surface-card p-5 xl:col-span-1">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">My Pools</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{visiblePools.length}</p>
        </article>
        <article className="surface-card p-5 xl:col-span-1">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Candidates</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{visibleCandidates.length}</p>
        </article>
        <article className="surface-card p-5 xl:col-span-1">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Vacancies</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{visibleVacancies.length}</p>
        </article>
        <article className="surface-card p-5 xl:col-span-1">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Ready</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{statusCounts.Ready || 0}</p>
        </article>
        <article className="surface-card p-5 xl:col-span-1">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Placed</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{statusCounts.Placed || 0}</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-950">Application Intake</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pull inbound applications into your assigned pools.
          </p>
          <div className="mt-4 max-h-[26rem] space-y-3 overflow-y-auto pr-1">
            {intakeRows.length > 0 ? (
              intakeRows.map((application) => (
                <article
                  key={application.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {application.candidateName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {application.jobTitle} • {application.id}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {application.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      value={intakePoolByApplication[application.id] || visiblePools[0]?.id || ""}
                      onChange={(event) =>
                        setIntakePoolByApplication((prev) => ({
                          ...prev,
                          [application.id]: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    >
                      {visiblePools.map((pool) => (
                        <option key={pool.id} value={pool.id}>
                          {pool.id} • {pool.department}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleIntakeFromApplication(application.id)}
                      className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      Add to Pool
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No new applications pending intake.
              </div>
            )}
          </div>
        </article>

        <AutomatedApplicationIntake
          pools={visiblePools}
          addCandidateFromResumeUpload={addCandidateFromResumeUpload}
          onCandidateAdded={(candidate) => {
            setNotice(`Resume candidate ${candidate.name} added.`);
            setSelectedCandidateId(candidate.id);
          }}
        />
      </section>

      <section className="surface-card p-6">
        <div className="grid gap-3 xl:grid-cols-5">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search candidates, skills, tags"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 xl:col-span-2"
          />
          <input
            value={skillFilter}
            onChange={(event) => setSkillFilter(event.target.value)}
            placeholder="Skill filter"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <input
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            placeholder="Location filter"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={vacancyFilter}
            onChange={(event) => setVacancyFilter(event.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="All">All Vacancies</option>
            {visibleVacancies.map((vacancy) => (
              <option key={vacancy.id} value={vacancy.id}>
                {vacancy.title} ({vacancy.id})
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
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
        <div className="mt-3 flex flex-wrap gap-2">
          {["All", ...candidateAvailabilityStates].map((availability) => (
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
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="space-y-4 xl:max-h-[68vh] xl:overflow-y-auto xl:pr-2">
          {filteredCandidates.length > 0 ? (
            filteredCandidates.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                onClick={() => setSelectedCandidateId(candidate.id)}
                className={[
                  "surface-card w-full p-5 text-left transition hover:-translate-y-0.5 hover:shadow-soft",
                  selectedCandidate?.id === candidate.id ? "ring-2 ring-slate-950" : "",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{candidate.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {candidate.id} • {candidate.location}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {candidate.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {candidate.skills.slice(0, 4).map((skill) => (
                    <span
                      key={`${candidate.id}-${skill}`}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Updated {formatDateTime(candidate.updatedOn)}
                </p>
              </button>
            ))
          ) : (
            <div className="surface-card px-6 py-10 text-sm text-slate-600">
              No pooled candidates match the current filters.
            </div>
          )}
        </article>

        {selectedCandidate ? (
          <aside className="surface-card p-6 xl:sticky xl:top-4 xl:max-h-[68vh] xl:overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-950">{selectedCandidate.name}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {selectedCandidate.id} • {selectedCandidate.email || "No email"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {talentPoolStatuses.map((status) => (
                <button
                  key={`status-${status}`}
                  type="button"
                  onClick={() => {
                    const result = updateCandidateStatus(selectedCandidate.id, status);
                    setNotice(
                      result.ok
                        ? `${selectedCandidate.name} moved to ${status}.`
                        : result.message
                    );
                  }}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold transition",
                    selectedCandidate.status === status
                      ? "bg-slate-950 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                  ].join(" ")}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              <input
                value={detailForm.location}
                onChange={(event) =>
                  setDetailForm((prev) => ({ ...prev, location: event.target.value }))
                }
                placeholder="Location"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <select
                value={detailForm.availability}
                onChange={(event) =>
                  setDetailForm((prev) => ({ ...prev, availability: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {candidateAvailabilityStates.map((availability) => (
                  <option key={availability} value={availability}>
                    {availability}
                  </option>
                ))}
              </select>
              <input
                value={detailForm.skills}
                onChange={(event) =>
                  setDetailForm((prev) => ({ ...prev, skills: event.target.value }))
                }
                placeholder="Skills (comma separated)"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <input
                value={detailForm.tags}
                onChange={(event) =>
                  setDetailForm((prev) => ({ ...prev, tags: event.target.value }))
                }
                placeholder="Tags (comma separated)"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <input
                type="number"
                min={0}
                max={100}
                value={detailForm.confidence}
                onChange={(event) =>
                  setDetailForm((prev) => ({ ...prev, confidence: event.target.value }))
                }
                placeholder="Confidence score"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={handleSaveCandidate}
                className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Save Candidate Details
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">AI Recommendations</p>
              <p className="mt-1 text-xs text-slate-500">
                Threshold: {matchingSettings.threshold}% match score
              </p>
              <div className="mt-3 space-y-2">
                {selectedCandidateRecommendations.length > 0 ? (
                  selectedCandidateRecommendations.slice(0, 5).map((recommendation) => {
                    const vacancy = visibleVacancies.find(
                      (item) => item.id === recommendation.vacancyId
                    );
                    return (
                      <article
                        key={`${selectedCandidate.id}-${recommendation.vacancyId}`}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-slate-900">
                            {vacancy?.title || recommendation.vacancyId}
                          </p>
                          <span
                            className={[
                              "rounded-full px-2 py-1 text-xs font-semibold",
                              recommendationTone(
                                recommendation.score,
                                matchingSettings.threshold
                              ),
                            ].join(" ")}
                          >
                            {recommendation.score}%
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-600">
                          Overlap skills:{" "}
                          {recommendation.overlapSkills.length > 0
                            ? recommendation.overlapSkills.join(", ")
                            : "None"}
                        </p>
                      </article>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-600">No vacancy recommendations yet.</p>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Status History</p>
              <div className="mt-3 space-y-2">
                {selectedCandidate.statusHistory.slice(-5).reverse().map((entry, index) => (
                  <div
                    key={`${selectedCandidate.id}-${entry.at}-${index}`}
                    className="text-xs text-slate-600"
                  >
                    <span className="font-semibold text-slate-800">{entry.status}</span> •{" "}
                    {formatDateTime(entry.at)} • {entry.by}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        ) : (
          <div className="surface-card px-6 py-10 text-sm text-slate-600">
            Select a candidate to review details and recommendations.
          </div>
        )}
      </section>
      </div>
    </PageFrame>
  );
}

