import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCandidate201Files } from "../../context/Candidate201FilesContext";
import { useDigitalFiles } from "../../context/DigitalFilesContext";
import { useRecruiterDocsInbox } from "../../context/RecruiterDocsInboxContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import { useAdminData } from "../../context/AdminDataContext";

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

function formatDate(value) {
  if (!value) return "No date";

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value) {
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

function MetricCard({ label, value, note, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-950",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-950",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
  };

  return (
    <article className={["rounded-3xl border p-5 shadow-sm", tones[tone]].join(" ")}>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {note ? <p className="mt-2 text-sm text-slate-600">{note}</p> : null}
    </article>
  );
}

export default function AdminDashboard() {
  const { users, auditEvents } = useAdminData();
  const { jobs } = useRecruitmentData();
  const { files } = useDigitalFiles();
  const { items, approveInboxItem, requestActionForItem, markInboxItemReviewed, refreshInbox } =
    useRecruiterDocsInbox();
  const { docs } = useCandidate201Files();

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      adminUsers: users.filter((user) => user.role === "Administrator").length,
      recruiterUsers: users.filter((user) => user.role === "Recruiter").length,
      candidateUsers: users.filter((user) => user.role === "Candidate").length,
      totalJobs: jobs.length,
      totalApplicants: jobs.reduce((sum, job) => sum + (job.applicants || 0), 0),
      pendingFiles: files.filter((file) => file.status === "Pending Review").length,
      needsActionFiles: files.filter((file) => file.status === "Needs Action").length,
      submittedDocs: docs.filter((doc) => doc.status === "Submitted").length,
      candidateInbox: items.length,
      pendingInbox: items.filter((item) => item.status === "Submitted").length,
    }),
    [users, jobs, files, docs, items]
  );

  const recentJobs = jobs.slice(0, 3);
  const recentEvents = auditEvents.slice(0, 5);
  const recentInbox = items.slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 px-6 py-6 text-white shadow-soft sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            Administrator dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Platform oversight across recruiters, candidates, and records
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Use this console to review account access, audit activity, and the
            health of the local mock data layers that support the hiring app.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Total users" value={formatNumber(stats.totalUsers)} note="Accounts stored in the local auth mock." tone="cyan" />
        <MetricCard label="Administrators" value={formatNumber(stats.adminUsers)} note="Seeded platform-level access." tone="emerald" />
        <MetricCard label="Recruiters" value={formatNumber(stats.recruiterUsers)} note="Hiring workspace access." tone="amber" />
        <MetricCard label="Candidates" value={formatNumber(stats.candidateUsers)} note="Self-service onboarding access." />
        <MetricCard label="Active jobs" value={formatNumber(stats.totalJobs)} note={`${formatNumber(stats.totalApplicants)} applicants across open roles.`} />
        <MetricCard label="Pending reviews" value={formatNumber(stats.pendingInbox)} note={`${formatNumber(stats.pendingFiles)} recruiter files need review.`} tone="amber" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Users & Roles", to: "/admin/users", note: "Edit local account roles." },
          { label: "Audit Log", to: "/admin/audit-log", note: "Review recent admin activity." },
          { label: "Records", to: "/admin/records", note: "Inspect recruiter and candidate data." },
          { label: "System Health", to: "/admin/system-health", note: "Check mock storage and sync status." },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <p className="text-sm font-semibold text-slate-950">{link.label}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{link.note}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Recent audit activity</h2>
            <p className="mt-1 text-sm text-slate-600">Newest entries from the local admin log.</p>
          </div>
          <div className="p-6">
            {recentEvents.length > 0 ? (
              <ul className="space-y-3">
                {recentEvents.map((event) => (
                  <li key={event.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{event.action}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {event.actor} - {event.target || "No target"}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                        {event.category}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{event.detail}</p>
                    <p className="mt-2 text-xs text-slate-500">{formatDateTime(event.timestamp)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No admin events yet.
              </div>
            )}
          </div>
        </article>

        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Recruiter and candidate records</h2>
            <p className="mt-1 text-sm text-slate-600">High-level visibility into the live mock datasets.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Recruiter records</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{formatNumber(stats.totalJobs)} jobs</p>
                  <p className="text-sm text-slate-600">{formatNumber(stats.totalApplicants)} total applicants</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{formatNumber(files.length)} 201 files</p>
                  <p className="text-sm text-slate-600">{formatNumber(stats.needsActionFiles)} need action</p>
                </div>
              </div>
              <Link to="/recruiter/dashboard" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800">
                Open recruiter workspace
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Candidate records</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{formatNumber(stats.submittedDocs)} submitted docs</p>
                  <p className="text-sm text-slate-600">{formatNumber(stats.candidateInbox)} inbox items</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{formatNumber(docs.length)} onboarding docs</p>
                  <p className="text-sm text-slate-600">Candidate self-service remains isolated.</p>
                </div>
              </div>
              <Link to="/candidate/dashboard" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800">
                Open candidate workspace
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-950">Recent candidate inbox</p>
              <div className="mt-3 space-y-2">
                {recentInbox.length > 0 ? (
                  recentInbox.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                      <span className="font-semibold text-slate-900">{item.candidateAlias}</span>{" "}
                      {item.docType} - {item.status}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600">No candidate submissions in the inbox yet.</p>
                )}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-heading">Candidate docs inbox</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              Latest submissions
            </h2>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            Pending: {stats.pendingInbox}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {recentInbox.length > 0 ? (
            recentInbox.map((item) => (
              <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.candidateAlias || "Candidate"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.docType} - {item.fileMeta?.name || "No file name"} - Submitted{" "}
                      {formatDate(item.submittedOn)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {item.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {item.reviewSummary || "Awaiting recruiter review."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => approveInboxItem(item.id, "Approved by admin review.")}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      requestActionForItem(
                        item.id,
                        "Please provide a clearer copy or missing detail."
                      )
                    }
                    className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-400"
                  >
                    Needs Action
                  </button>
                  <button
                    type="button"
                    onClick={() => markInboxItemReviewed(item.id, "Marked as reviewed by admin.")}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                  >
                    Mark Reviewed
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 lg:col-span-2">
              No candidate inbox items available.
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={refreshInbox}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Refresh inbox
          </button>
        </div>
      </section>

      <section className="surface-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-heading">Live recruiter jobs</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Active requisitions</h2>
          </div>
          <Link to="/recruiter/jobs" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
            Open all jobs
          </Link>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {recentJobs.length > 0 ? (
            recentJobs.map((job) => (
              <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">{job.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {job.department} - {job.id}
                </p>
                <p className="mt-3 text-sm text-slate-600">{job.description}</p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No recruiter requisitions yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
