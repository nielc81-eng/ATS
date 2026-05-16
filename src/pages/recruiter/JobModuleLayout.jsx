import React, { useMemo } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { PageFrame } from "../../components/layout/ShellPrimitives";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";

function tabClassName({ isActive }) {
  return [
    "rounded-2xl px-4 py-2 text-sm font-semibold transition",
    isActive
      ? "bg-slate-950 text-white"
      : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900",
  ].join(" ");
}

export default function RecruiterJobModuleLayout() {
  const { jobId = "" } = useParams();
  const { getJobById } = useRecruitmentData();

  const job = useMemo(() => getJobById(jobId), [getJobById, jobId]);
  if (!job) return null;

  return (
    <PageFrame size="wide">
      <div className="space-y-6">
        <section className="surface-card p-6 sm:p-8">
          <p className="section-heading">Talent Acquisition Portal</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {job.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {job.department} - {job.id}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <NavLink to={`/recruiter/jobs/${encodeURIComponent(job.id)}/overview`} className={tabClassName}>
              Overview
            </NavLink>
            <NavLink to={`/recruiter/jobs/${encodeURIComponent(job.id)}/applicants`} className={tabClassName}>
              Applicants
            </NavLink>
            <NavLink to={`/recruiter/jobs/${encodeURIComponent(job.id)}/screening`} className={tabClassName}>
              Screening
            </NavLink>
            <NavLink to={`/recruiter/jobs/${encodeURIComponent(job.id)}/analytics`} className={tabClassName}>
              Analytics
            </NavLink>
          </div>
        </section>
        <Outlet />
      </div>
    </PageFrame>
  );
}
