import React, { useEffect, useMemo, useState } from "react";
import BlindCandidateCard from "../../components/recruiter/BlindCandidateCard";
import CandidateProfileModal from "../../components/recruiter/CandidateProfileModal";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";

function getScoreStats(candidates) {
  const total = candidates.length;
  const shortlisted = candidates.filter((candidate) => candidate.score >= 80).length;
  const average =
    total === 0
      ? 0
      : Math.round(
          candidates.reduce((sum, candidate) => sum + candidate.score, 0) / total
        );

  return { total, shortlisted, average };
}

export default function RecruiterScreening() {
  const { screeningJobs, getCandidatesForJob } = useRecruitmentData();
  const [selectedJobId, setSelectedJobId] = useState(screeningJobs[0]?.id ?? "");
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const selectedJob = useMemo(
    () =>
      screeningJobs.find((job) => job.id === selectedJobId) ??
      screeningJobs[0] ??
      null,
    [screeningJobs, selectedJobId]
  );

  const candidates = useMemo(
    () => (selectedJob ? getCandidatesForJob(selectedJob.id) : []),
    [getCandidatesForJob, selectedJob]
  );

  const stats = useMemo(() => getScoreStats(candidates), [candidates]);

  useEffect(() => {
    if (!selectedJob && screeningJobs[0]) {
      setSelectedJobId(screeningJobs[0].id);
    }
  }, [screeningJobs, selectedJob]);

  useEffect(() => {
    setSelectedCandidate(candidates[0] ?? null);
  }, [candidates]);

  useEffect(() => {
    document.body.style.overflow = selectedCandidate ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedCandidate]);

  if (!selectedJob) {
    return (
      <section className="surface-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-950">
          No jobs available for screening.
        </h1>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Recruiter Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Candidate Screening
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Blind screening is active. Names, photos, schools, and addresses are
          masked while semantic match scores stay visible for consistent review.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="surface-card p-6">
          <label
            htmlFor="screening-job"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Select Job
          </label>
          <select
            id="screening-job"
            value={selectedJobId}
            onChange={(event) => setSelectedJobId(event.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {screeningJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} - {job.department}
              </option>
            ))}
          </select>

          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Active Role
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              {selectedJob.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{selectedJob.department}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedJob.focus.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Candidates
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {stats.total}
            </p>
          </div>
          <div className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Shortlisted
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {stats.shortlisted}
            </p>
          </div>
          <div className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Avg Match
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {stats.average}%
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-heading">Blind Candidate Roster</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              Anonymous profiles only
            </h2>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            PII masked by design
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {candidates.length > 0 ? (
            candidates.map((candidate) => (
              <BlindCandidateCard
                key={candidate.applicantId}
                candidate={candidate}
                onClick={() => setSelectedCandidate(candidate)}
              />
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-600 xl:col-span-3">
              No candidates available for this requisition yet.
            </div>
          )}
        </div>
      </section>

      {selectedCandidate ? (
        <CandidateProfileModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      ) : null}
    </div>
  );
}

