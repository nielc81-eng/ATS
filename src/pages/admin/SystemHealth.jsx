import React, { useMemo } from "react";
import { useCandidate201Files } from "../../context/Candidate201FilesContext";
import { useDigitalFiles } from "../../context/DigitalFilesContext";
import { useRecruiterDocsInbox } from "../../context/RecruiterDocsInboxContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import { useAdminData } from "../../context/AdminDataContext";

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

export default function AdminSystemHealth() {
  const { users, auditEvents } = useAdminData();
  const { jobs } = useRecruitmentData();
  const { files } = useDigitalFiles();
  const { items } = useRecruiterDocsInbox();
  const { docs } = useCandidate201Files();

  const stats = useMemo(
    () => ({
      users: users.length,
      audits: auditEvents.length,
      jobs: jobs.length,
      files: files.length,
      inbox: items.length,
      pending: items.filter((item) => item.status === "Submitted").length,
      docs: docs.length,
    }),
    [users, auditEvents, jobs, files, items, docs]
  );

  const healthChecks = [
    { label: "Auth session persistence", value: "Enabled", tone: "emerald" },
    { label: "Admin audit log", value: "Persisted locally", tone: "cyan" },
    { label: "Recruitment dataset", value: "Loaded", tone: "emerald" },
    { label: "Candidate inbox sync", value: "Active", tone: "amber" },
    { label: "File vault mock data", value: "Loaded", tone: "emerald" },
    { label: "Refresh survival", value: "Verified by localStorage", tone: "cyan" },
  ];

  const toneClasses = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-950",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">System status</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          System health
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Monitor the local mock services that support the admin console, recruiter
          workspace, and candidate onboarding flow.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Users", value: stats.users },
          { label: "Audit events", value: stats.audits },
          { label: "Jobs", value: stats.jobs },
          { label: "201 docs", value: stats.docs },
          { label: "Inbox items", value: stats.inbox },
          { label: "Pending reviews", value: stats.pending },
          { label: "File records", value: stats.files },
        ].map((item) => (
          <article key={item.label} className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{formatNumber(item.value)}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {healthChecks.map((check) => (
          <article
            key={check.label}
            className={["rounded-3xl border p-5", toneClasses[check.tone]].join(" ")}
          >
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{check.label}</p>
            <p className="mt-2 text-lg font-semibold">{check.value}</p>
          </article>
        ))}
      </section>

      <section className="surface-card p-6">
        <p className="section-heading">Operational notes</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-950">Persistence layer</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Admin users and audit logs are stored in browser localStorage, so
              refreshes preserve the seeded administrator session and the latest
              role changes.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-950">Access boundaries</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Candidate and recruiter routes continue to use their existing
              layouts and remain isolated from the admin navigation tree.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
