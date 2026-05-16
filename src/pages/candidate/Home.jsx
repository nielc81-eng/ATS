import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { PageFrame } from "../../components/layout/ShellPrimitives";
import { useAuth } from "../../context/AuthContext";
import { useCandidate201Files } from "../../context/Candidate201FilesContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";

function toDateValue(value) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function CandidateHome() {
  const { session } = useAuth();
  const { docs } = useCandidate201Files();
  const { getApplicationsForCandidate } = useRecruitmentData();
  const applications = useMemo(
    () => getApplicationsForCandidate(session?.email || ""),
    [getApplicationsForCandidate, session?.email]
  );

  const stats = useMemo(
    () => ({
      applications: applications.length,
      docsSubmitted: docs.filter((doc) => doc.status === "Submitted" || doc.status === "Approved").length,
      docsMissing: docs.filter((doc) => doc.status === "Missing").length,
      latestUpdate: applications.reduce((latest, application) => {
        const marker = application?.updatedOn || application?.appliedOn || "";
        return toDateValue(marker) > toDateValue(latest) ? marker : latest;
      }, ""),
    }),
    [applications, docs]
  );

  return (
    <PageFrame size="wide">
      <div className="space-y-6">
        <section className="surface-card p-6 sm:p-8">
          <p className="section-heading">Candidate Portal</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Candidate Dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Manage your profile, track application progress, and keep onboarding documents complete.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Applications</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.applications}</p>
          </article>
          <article className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Docs submitted</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.docsSubmitted}</p>
          </article>
          <article className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Docs missing</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.docsMissing}</p>
          </article>
          <article className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Latest update</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{stats.latestUpdate || "No updates yet"}</p>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link
            to="/candidate/profile"
            className="rounded-3xl border border-slate-200 bg-white px-5 py-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            Manage Profile
          </Link>
          <Link
            to="/candidate/applications"
            className="rounded-3xl border border-slate-200 bg-white px-5 py-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            Track Applications
          </Link>
          <Link
            to="/candidate/documents"
            className="rounded-3xl border border-slate-200 bg-white px-5 py-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            Upload Documents
          </Link>
          <Link
            to="/candidate/notifications"
            className="rounded-3xl border border-slate-200 bg-white px-5 py-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            View Notifications
          </Link>
        </section>
      </div>
    </PageFrame>
  );
}
