import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import AICandidateCard from "../../components/recruiter/AICandidateCard";
import CandidateProfileModal from "../../components/recruiter/CandidateProfileModal";
import { PageFrame } from "../../components/layout/ShellPrimitives";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import { resolveJobId } from "../../lib/jobNavigation";
import { PIPELINE_SHORTLIST_STATUSES } from "../../lib/applicationStatuses";


function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function findApplicationForCandidate(candidate, applications) {
  if (!candidate) return null;

  const directMatch = applications.find((application) => application.id === candidate.applicationId);
  if (directMatch) return directMatch;

  const candidateNames = [candidate.alias, candidate.nameHint, candidate.applicantId]
    .map(normalizeText)
    .filter(Boolean);

  return (
    applications.find((application) =>
      candidateNames.includes(normalizeText(application.candidateName))
    ) || null
  );
}

function getScreeningStats(candidates, applications) {
  const total = candidates.length;
  const shortlisted = candidates.filter((candidate) => {
    const application = findApplicationForCandidate(candidate, applications);
    return application ? PIPELINE_SHORTLIST_STATUSES.has(application.status) : candidate.score >= 80;
  }).length;
  const average =
    total === 0
      ? 0
      : Math.round(candidates.reduce((sum, candidate) => sum + candidate.score, 0) / total);

  return { total, shortlisted, average };
}

export default function RecruiterScreening() {
  const { screeningJobs, getCandidatesForJob, getApplicationsForJob, updateApplicationStatus } =
    useRecruitmentData();
  const { jobId: routeJobId = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const jobParam = routeJobId || searchParams.get("job")?.trim() || "";
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  // URL is the single source of truth. Derive the active job ID from the URL param.
  const selectedJobId = resolveJobId(screeningJobs, jobParam);

  // Keep a ref to the latest searchParams so the normalisation effect can read it
  // without listing the object itself as a dependency (React Router creates a new
  // reference every render, which would cause the effect to re-fire and potentially
  // push extra history entries instead of replacing the current one).
  const searchParamsRef = React.useRef(searchParams);
  searchParamsRef.current = searchParams;

  // Ensure the URL always reflects a valid job ID (e.g. on first load with no ?job= param).
  // Only re-run when jobParam or selectedJobId changes - not when the searchParams object
  // reference changes - to avoid creating spurious history entries.
  useEffect(() => {
    if (routeJobId) return;
    if (selectedJobId && jobParam !== selectedJobId) {
      const nextParams = new URLSearchParams(searchParamsRef.current);
      nextParams.set("job", selectedJobId);
      setSearchParams(nextParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobParam, routeJobId, selectedJobId, setSearchParams]);

  const selectedJob = useMemo(
    () => screeningJobs.find((job) => job.id === selectedJobId) ?? null,
    [screeningJobs, selectedJobId]
  );

  const candidates = useMemo(
    () => (selectedJob ? getCandidatesForJob(selectedJob.id) : []),
    [getCandidatesForJob, selectedJob]
  );

  const applications = useMemo(
    () => (selectedJob ? getApplicationsForJob(selectedJob.id) : []),
    [getApplicationsForJob, selectedJob]
  );

  const candidateRows = useMemo(
    () =>
      candidates.map((candidate) => ({
        candidate,
        application: findApplicationForCandidate(candidate, applications),
      })),
    [applications, candidates]
  );

  const stats = useMemo(() => getScreeningStats(candidates, applications), [applications, candidates]);

  const selectedCandidate = useMemo(
    () =>
      candidateRows.find((row) => row.candidate.applicationId === selectedCandidateId)?.candidate ||
      candidateRows.find((row) => row.candidate.applicantId === selectedCandidateId)?.candidate ||
      null,
    [candidateRows, selectedCandidateId]
  );

  const selectedApplication = useMemo(
    () => findApplicationForCandidate(selectedCandidate, applications),
    [applications, selectedCandidate]
  );

  // Clear the selected candidate whenever the active job changes.
  const prevJobIdRef = React.useRef(selectedJobId);
  useEffect(() => {
    if (prevJobIdRef.current !== selectedJobId) {
      prevJobIdRef.current = selectedJobId;
      setSelectedCandidateId(null);
    }
  }, [selectedJobId]);

  useEffect(() => {
    document.body.style.overflow = selectedCandidate ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedCandidate]);

  if (!selectedJob) {
    return (
      <section className="surface-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-950">No jobs available for screening.</h1>
      </section>
    );
  }

  return (
    <PageFrame size="wide">
      <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Talent Acquisition Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Review AI-Ranked Candidates
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Review identified applicants ranked by AI fit signals and verify job requisition alignment before interviews.
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
            onChange={(event) => {
              if (routeJobId) {
                navigate(`/recruiter/jobs/${encodeURIComponent(event.target.value)}/screening`, {
                  replace: true,
                });
                return;
              }
              const nextParams = new URLSearchParams(searchParams);
              nextParams.set("job", event.target.value);
              setSearchParams(nextParams, { replace: true });
            }}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {screeningJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} - {job.department}
              </option>
            ))}
          </select>

          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Active Role</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{selectedJob.title}</h2>
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
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Candidates</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.total}</p>
          </div>
          <div className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Shortlisted</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.shortlisted}</p>
          </div>
          <div className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Avg Match</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.average}%</p>
          </div>
        </div>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-heading">AI-Ranked Candidate Roster</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              Identified profiles
            </h2>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            AI-ranked review enabled
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {candidateRows.length > 0 ? (
            candidateRows.map(({ candidate, application }) => (
              <AICandidateCard
                key={candidate.applicantId}
                candidate={candidate}
                application={application}
                onClick={() =>
                  setSelectedCandidateId(candidate.applicationId || candidate.applicantId)
                }
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
          application={selectedApplication}
          onClose={() => setSelectedCandidateId(null)}
          onSaveStatus={(nextStatus, note) =>
            selectedApplication
              ? updateApplicationStatus(selectedApplication.id, nextStatus, note)
              : { ok: false, message: "Application not found." }
          }
        />
      ) : null}
      </div>
    </PageFrame>
  );
}

