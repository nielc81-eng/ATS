import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import { PIPELINE_SHORTLIST_STATUSES } from "../../lib/applicationStatuses";

export default function RecruiterJobOverview() {
  const { jobId = "" } = useParams();
  const { getJobById, getApplicationsForJob } = useRecruitmentData();

  const job = useMemo(() => getJobById(jobId), [getJobById, jobId]);
  const applications = useMemo(() => (job ? getApplicationsForJob(job.id) : []), [getApplicationsForJob, job]);

  if (!job) return null;

  const shortlisted = applications.filter((application) =>
    PIPELINE_SHORTLIST_STATUSES.has(application.status)
  ).length;

  return (
    <section className="surface-card p-6 sm:p-8">
      <p className="section-heading">Job Overview</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Applicants</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{applications.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Shortlisted</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{shortlisted}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Posted</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">{job.postedOn || "-"}</p>
        </article>
      </div>
      <p className="mt-6 text-sm leading-6 text-slate-600">{job.description}</p>
    </section>
  );
}
