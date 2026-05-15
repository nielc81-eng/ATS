import React, { useMemo } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminWorkforce } from "../../context/AdminWorkforceContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";

function formatDateTime(value) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminUsageHistory() {
  const { auditEvents } = useAdminData();
  const { requests, assignments } = useAdminWorkforce();
  const { jobs, applicationsByEmail } = useRecruitmentData();

  const allApplications = useMemo(
    () => Object.values(applicationsByEmail).flat(),
    [applicationsByEmail]
  );

  const stats = useMemo(() => {
    const candidateEvents = auditEvents.filter((event) => event.category === "applications").length;
    const userEvents = auditEvents.filter((event) => event.category === "users").length;
    const recordsEvents = auditEvents.filter((event) => event.category === "records").length;
    const systemEvents = auditEvents.filter((event) => event.category === "system").length;

    return {
      totalEvents: auditEvents.length,
      userEvents,
      candidateEvents,
      recordsEvents,
      systemEvents,
      jobCount: jobs.length,
      applicationCount: allApplications.length,
      deploymentRequests: requests.length,
      activeDeployments: assignments.filter((assignment) => assignment.status === "Active").length,
    };
  }, [allApplications, assignments, auditEvents, jobs, requests]);

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Administrator Console</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Monitor Usage History
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Track user operations, recruitment activity, and operational events across platform modules.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total events</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.totalEvents}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">User events</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.userEvents}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Candidate events</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.candidateEvents}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Records events</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.recordsEvents}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">System events</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.systemEvents}</p>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Jobs</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.jobCount}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Applications</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.applicationCount}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Deployment requests</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.deploymentRequests}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Active deployments</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.activeDeployments}</p>
        </article>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Recent Usage Timeline</h2>
          <p className="mt-1 text-sm text-slate-600">Most recent entries appear first.</p>
        </div>
        <div className="space-y-3 p-6">
          {auditEvents.length > 0 ? (
            auditEvents.slice(0, 40).map((event) => (
              <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{event.action}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {event.actor} - {event.target || "No target"}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                    {event.category}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{event.detail}</p>
                <p className="mt-2 text-xs text-slate-500">{formatDateTime(event.timestamp)}</p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No usage history available yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

