import React, { useMemo } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import { useDigitalFiles } from "../../context/DigitalFilesContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

function formatDateTime(value) {
  if (!value) return "N/A";
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

export default function AdminRecruiterActivity() {
  const { auditEvents } = useAdminData();
  const { applicationsByEmail, jobs } = useRecruitmentData();
  const { files } = useDigitalFiles();

  const allApplications = useMemo(() => Object.values(applicationsByEmail).flat(), [applicationsByEmail]);

  const stats = useMemo(
    () => ({
      jobs: jobs.length,
      applications: allApplications.length,
      shortlisted: allApplications.filter((application) =>
        ["Shortlisted", "Interview", "Offer", "Hired"].includes(application.status)
      ).length,
      flaggedFiles: files.filter((file) => file.status === "Needs Action").length,
    }),
    [allApplications, files, jobs]
  );

  const statusDistribution = useMemo(() => {
    const order = ["Submitted", "Shortlisted", "Interview", "Offer", "Hired", "Rejected"];
    return order.map((status) => ({
      status,
      count: allApplications.filter((application) => application.status === status).length,
    }));
  }, [allApplications]);

  const recruiterEvents = useMemo(
    () => auditEvents.filter((event) => event.category === "applications").slice(0, 6),
    [auditEvents]
  );

  const topJobs = useMemo(
    () =>
      [...jobs]
        .sort((left, right) => (right.applicants || 0) - (left.applicants || 0))
        .slice(0, 4),
    [jobs]
  );

  return (
    <div className="space-y-6">
      <section className="surface-card overflow-hidden border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white sm:p-8">
        <p className="section-heading text-cyan-200">Recruiter oversight</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Recruiter activity
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
          Watch application movement, recruiter decisions, and follow-up load across the hiring funnel.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Jobs", value: stats.jobs, note: "Open requisitions" },
          { label: "Applications", value: stats.applications, note: "Tracked in local storage" },
          { label: "Shortlisted", value: stats.shortlisted, note: "Pipeline progress" },
          { label: "Flagged files", value: stats.flaggedFiles, note: "Need recruiter follow-up" },
        ].map((item) => (
          <article key={item.label} className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{formatNumber(item.value)}</p>
            <p className="mt-2 text-sm text-slate-600">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Application status distribution</h2>
            <p className="mt-1 text-sm text-slate-600">Live view of the recruiter funnel.</p>
          </div>
          <div className="grid gap-3 p-6 sm:grid-cols-2">
            {statusDistribution.map((item) => (
              <div key={item.status} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.status}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{formatNumber(item.count)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Recent recruiter actions</h2>
            <p className="mt-1 text-sm text-slate-600">Latest audit entries from application updates.</p>
          </div>
          <div className="space-y-3 p-6">
            {recruiterEvents.length > 0 ? (
              recruiterEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{event.action}</p>
                      <p className="mt-1 text-xs text-slate-500">{event.actor} - {event.target}</p>
                    </div>
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-800">
                      {event.category}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{event.detail}</p>
                  <p className="mt-2 text-xs text-slate-500">{formatDateTime(event.timestamp)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No recruiter application events yet.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Top requisitions</h2>
          <p className="mt-1 text-sm text-slate-600">Most active jobs in the current workspace.</p>
        </div>
        <div className="grid gap-4 p-6 lg:grid-cols-2">
          {topJobs.length > 0 ? (
            topJobs.map((job) => (
              <article key={job.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-950">{job.title}</p>
                <p className="mt-1 text-xs text-slate-500">{job.department} - {job.id}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Applicants</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{formatNumber(job.applicants || 0)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Shortlisted</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{formatNumber(job.analytics?.shortlisted || 0)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Posted</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{job.postedOn}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 lg:col-span-2">
              No recruiter requisitions available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
