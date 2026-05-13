import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminWorkforce } from "../../context/AdminWorkforceContext";
import { useDigitalFiles } from "../../context/DigitalFilesContext";
import { useRecruiterDocsInbox } from "../../context/RecruiterDocsInboxContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
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
  const { requests, assignments } = useAdminWorkforce();
  const { jobs, applicationsByEmail } = useRecruitmentData();
  const { files } = useDigitalFiles();
  const { items } = useRecruiterDocsInbox();

  const allApplications = useMemo(() => Object.values(applicationsByEmail).flat(), [applicationsByEmail]);

  const stats = useMemo(() => {
    const roleCounts = {
      Administrator: users.filter((user) => user.role === "Administrator" && user.status !== "Archived").length,
      Recruiter: users.filter((user) => user.role === "Recruiter" && user.status !== "Archived").length,
      Candidate: users.filter((user) => user.role === "Candidate" && user.status !== "Archived").length,
    };

    const applicationDistribution = ["Submitted", "Shortlisted", "Interview", "Offer", "Hired", "Rejected"].map(
      (status) => ({
        status,
        count: allApplications.filter((application) => application.status === status).length,
      })
    );

    return {
      totalUsers: users.filter((user) => user.status !== "Archived").length,
      roleCounts,
      jobs: jobs.length,
      applications: allApplications.length,
      needsActionFiles: files.filter((file) => file.status === "Needs Action").length,
      pendingInbox: items.filter((item) => item.status === "Submitted").length,
      flaggedItems:
        files.filter((file) => file.status === "Needs Action").length +
        allApplications.filter((application) => application.status === "Rejected").length,
      applicationDistribution,
      deploymentRequests: requests.length,
      pendingDeploymentRequests: requests.filter((request) => request.status === "Pending Approval").length,
      activeDeployments: assignments.filter((assignment) => assignment.status === "Active").length,
    };
  }, [allApplications, assignments, files, items, jobs, requests, users]);

  const recentEvents = auditEvents.slice(0, 6);
  const flaggedFiles = files.filter((file) => file.status === "Needs Action").slice(0, 3);
  const flaggedApplications = allApplications
    .filter((application) => application.status === "Rejected")
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 px-6 py-6 text-white shadow-soft sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Administrator dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Platform oversight across users, applications, and records
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Use this console to monitor role counts, application flow, flagged items, and local audit history.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Total users"
          value={formatNumber(stats.totalUsers)}
          note="Active accounts only."
          tone="cyan"
        />
        <MetricCard
          label="Jobs / applications"
          value={`${formatNumber(stats.jobs)} / ${formatNumber(stats.applications)}`}
          note="Recruiter funnel volume."
          tone="emerald"
        />
        <MetricCard
          label="Flagged items"
          value={formatNumber(stats.flaggedItems)}
          note="Needs-action files and rejected applications."
          tone="amber"
        />
        <MetricCard
          label="Deployment requests"
          value={formatNumber(stats.deploymentRequests)}
          note={`${formatNumber(stats.pendingDeploymentRequests)} pending approvals.`}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Administrators" value={formatNumber(stats.roleCounts.Administrator)} note="Seeded platform admins." />
        <MetricCard label="Recruiters" value={formatNumber(stats.roleCounts.Recruiter)} note="Hiring workspace users." />
        <MetricCard label="Candidates" value={formatNumber(stats.roleCounts.Candidate)} note="Self-service accounts." />
        <MetricCard label="Pending inbox" value={formatNumber(stats.pendingInbox)} note="Candidate submissions awaiting review." />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "User Management", to: "/admin/users", note: "Archive or restore accounts." },
          { label: "Application Audit Trail", to: "/admin/audit-log", note: "Review lifecycle events." },
          { label: "Recruiter Activity", to: "/admin/recruiter-activity", note: "Monitor hiring workflow." },
          { label: "Digital 201 Files Review", to: "/admin/files-review", note: "Inspect file status changes." },
          { label: "Talent Pool", to: "/admin/talent-pool", note: "Build a reusable talent bench." },
          { label: "Deployment Approvals", to: "/admin/deployment-approvals", note: "Approve recruiter requests." },
          { label: "Deployment Board", to: "/admin/deployment-board", note: "Assign talent to coverage needs." },
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
            <h2 className="text-lg font-semibold text-slate-950">Application status distribution</h2>
            <p className="mt-1 text-sm text-slate-600">A quick read on where the funnel stands.</p>
          </div>
          <div className="grid gap-3 p-6 sm:grid-cols-2">
            {stats.applicationDistribution.map((item) => (
              <div key={item.status} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.status}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{formatNumber(item.count)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Recent audit activity</h2>
            <p className="mt-1 text-sm text-slate-600">Newest entries from the admin log.</p>
          </div>
          <div className="space-y-3 p-6">
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4">
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
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No audit events yet.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Flagged files</h2>
            <p className="mt-1 text-sm text-slate-600">Records waiting on recruiter follow-up.</p>
          </div>
          <div className="space-y-3 p-6">
            {flaggedFiles.length > 0 ? (
              flaggedFiles.map((file) => (
                <div key={file.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">{file.employeeName}</p>
                  <p className="mt-1 text-xs text-slate-500">{file.employeeId} - {file.department}</p>
                  <p className="mt-2 text-sm text-slate-700">{file.reviewSummary}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No flagged file records.
              </div>
            )}
          </div>
        </article>

        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Flagged applications</h2>
            <p className="mt-1 text-sm text-slate-600">Rejected applications are surfaced for oversight.</p>
          </div>
          <div className="space-y-3 p-6">
            {flaggedApplications.length > 0 ? (
              flaggedApplications.map((application) => (
                <div key={application.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">{application.candidateName}</p>
                  <p className="mt-1 text-xs text-slate-500">{application.jobTitle} - {application.id}</p>
                  <p className="mt-2 text-sm text-slate-700">Status: {application.status}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No rejected applications yet.
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
