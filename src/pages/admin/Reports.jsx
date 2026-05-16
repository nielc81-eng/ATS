import React from "react";
import { Link } from "react-router-dom";
import { useAdminData } from "../../context/AdminDataContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";

export default function AdminReports() {
  const { auditEvents } = useAdminData();
  const { jobs, applicationsByEmail } = useRecruitmentData();
  const applications = Object.values(applicationsByEmail).flat();

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Administrator Console</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Reports Hub
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Centralized report entry point for usage history, recruitment activity, and operational summaries.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Jobs</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{jobs.length}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Applications</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{applications.length}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Audit events</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{auditEvents.length}</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          to="/admin/audit"
          className="rounded-3xl border border-slate-200 bg-white px-5 py-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
        >
          Open Audit Timeline
        </Link>
        <Link
          to="/admin/dashboard"
          className="rounded-3xl border border-slate-200 bg-white px-5 py-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
        >
          Open Platform Dashboard
        </Link>
      </section>
    </div>
  );
}
