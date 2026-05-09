import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function readCandidateResumeProfile(email) {
  if (typeof window === "undefined") return null;

  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;

  try {
    const raw = window.localStorage.getItem(`candidate_resume_profile_v1:${normalizedEmail}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return {
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.map((skill) => String(skill || "").trim()).filter(Boolean)
        : [],
      yearsExperience:
        typeof parsed.yearsExperience === "number" && Number.isFinite(parsed.yearsExperience)
          ? parsed.yearsExperience
          : undefined,
    };
  } catch {
    return null;
  }
}

export default function PublicJobDetail() {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { session, isAuthenticated } = useAuth();
  const { getJobById, applyToJob, hasApplied } = useRecruitmentData();
  const [notice, setNotice] = useState({ type: "", message: "" });

  const decodedJobId = useMemo(() => decodeURIComponent(jobId || ""), [jobId]);
  const job = getJobById(decodedJobId);

  const isCandidate = isAuthenticated && session?.role === "Candidate";
  const isRecruiter = isAuthenticated && session?.role === "Recruiter";
  const isNonCandidateUser = isAuthenticated && !isCandidate;
  const alreadyApplied =
    isCandidate && job ? hasApplied(job.id, session?.email || "") : false;

  const handleApply = () => {
    if (!job) return;

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
          },
        },
      });
      return;
    }

    if (!isCandidate) {
      setNotice({
        type: "error",
        message: "Only candidate accounts can apply to jobs.",
      });
      return;
    }

    if (alreadyApplied) {
      setNotice({
        type: "info",
        message: "You already applied to this role.",
      });
      return;
    }

    const resumeProfile = readCandidateResumeProfile(session?.email || "");
    const result = applyToJob(job.id, {
      email: session?.email,
      name: session?.name,
      resumeProfile,
    });

    if (!result.ok) {
      setNotice({
        type: "error",
        message: result.message || "Unable to submit application right now.",
      });
      return;
    }

    setNotice({
      type: "success",
      message: "Application submitted. You can track it in My Applications.",
    });
  };

  if (!job) {
    return (
      <div className="space-y-6">
        <section className="surface-card p-8">
          <p className="section-heading">Public Job Board</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Job Not Found</h1>
          <p className="mt-3 text-sm text-slate-600">
            The job you are looking for is unavailable or has been removed.
          </p>
          <Link
            to="/jobs"
            className="mt-5 inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to Jobs
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Public Job Board</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          {job.title}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {job.department} - {job.id}
        </p>
        <p className="mt-1 text-sm text-slate-500">Posted {formatDate(job.postedOn)}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            to="/jobs"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Browse Jobs
          </Link>
          {isCandidate ? (
            <>
              <Link
                to="/candidate/dashboard"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Dashboard
              </Link>
              <Link
                to="/candidate/applications"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                My Applications
              </Link>
            </>
          ) : null}
          {isRecruiter ? (
            <Link
              to="/recruiter/dashboard"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Recruiter Dashboard
            </Link>
          ) : null}
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Register
              </Link>
            </>
          ) : null}
        </div>

        <p className="mt-5 text-sm leading-7 text-slate-700">{job.description}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Must-Have Skills</h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700">
              {(job.mustHaveSkills || []).map((skill) => (
                <li key={`must-${skill}`}>{skill}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Nice-to-Have Skills</h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700">
              {(job.niceToHaveSkills || []).length > 0 ? (
                (job.niceToHaveSkills || []).map((skill) => (
                  <li key={`nice-${skill}`}>{skill}</li>
                ))
              ) : (
                <li>No optional skills listed.</li>
              )}
            </ul>
          </article>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleApply}
            disabled={alreadyApplied || isNonCandidateUser}
            className={[
              "rounded-2xl px-5 py-3 text-sm font-semibold transition",
              alreadyApplied || isNonCandidateUser
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : "bg-slate-950 text-white hover:bg-slate-800",
            ].join(" ")}
          >
            {alreadyApplied
              ? "Applied"
              : !isAuthenticated
                ? "Login to Apply"
                : isCandidate
                  ? "Apply"
                  : "Apply (Candidate Only)"}
          </button>

          <Link
            to="/jobs"
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Back to Jobs
          </Link>

          {isCandidate ? (
            <Link
              to="/candidate/applications"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              My Applications
            </Link>
          ) : null}
        </div>

        {isRecruiter ? (
          <p className="mt-4 text-sm text-amber-700">
            Recruiter accounts can browse this board but cannot submit candidate applications.
          </p>
        ) : null}

        {isAuthenticated && !isCandidate && !isRecruiter ? (
          <p className="mt-4 text-sm text-amber-700">
            This account can browse job posts but only candidate accounts can apply.
          </p>
        ) : null}

        {notice.message ? (
          <div
            className={[
              "mt-5 rounded-2xl border px-4 py-3 text-sm",
              notice.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : notice.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-blue-200 bg-blue-50 text-blue-800",
            ].join(" ")}
          >
            {notice.message}
          </div>
        ) : null}
      </section>
    </div>
  );
}
