import React, { useMemo } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import { useRecruiterDocsInbox } from "../../context/RecruiterDocsInboxContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminCandidateActivity() {
  const { auditEvents } = useAdminData();
  const { items } = useRecruiterDocsInbox();
  const { applicationsByEmail } = useRecruitmentData();

  const allApplications = useMemo(() => Object.values(applicationsByEmail).flat(), [applicationsByEmail]);

  const stats = useMemo(
    () => ({
      candidates: Object.keys(applicationsByEmail).length,
      submissions: items.length,
      pending: items.filter((item) => item.status === "Submitted").length,
      needsAction: items.filter((item) => item.status === "Needs Action").length,
    }),
    [applicationsByEmail, items]
  );

  const recentSubmissions = useMemo(() => items.slice(0, 6), [items]);
  const recentCandidateEvents = useMemo(
    () => auditEvents.filter((event) => event.category === "applications").slice(0, 5),
    [auditEvents]
  );

  const applicationRollup = useMemo(() => {
    const byStatus = new Map();
    allApplications.forEach((application) => {
      byStatus.set(application.status, (byStatus.get(application.status) || 0) + 1);
    });
    return ["Submitted", "Shortlisted", "Interview", "Offer", "Hired", "Rejected"].map(
      (status) => ({
        status,
        count: byStatus.get(status) || 0,
      })
    );
  }, [allApplications]);

  return (
    <div className="space-y-6">
      <section className="surface-card overflow-hidden border border-slate-200 bg-gradient-to-br from-cyan-950 via-slate-950 to-slate-900 p-6 text-white sm:p-8">
        <p className="section-heading text-cyan-200">Candidate oversight</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Candidate activity
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
          Review candidate submissions, application progress, and current queue pressure from a platform view.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Candidates", value: stats.candidates, note: "With applications on file" },
          { label: "Submissions", value: stats.submissions, note: "Recruiter inbox items" },
          { label: "Pending", value: stats.pending, note: "Awaiting review" },
          { label: "Needs action", value: stats.needsAction, note: "Follow-up required" },
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
            <h2 className="text-lg font-semibold text-slate-950">Candidate submission queue</h2>
            <p className="mt-1 text-sm text-slate-600">Newest recruiter inbox entries first.</p>
          </div>
          <div className="space-y-3 p-6">
            {recentSubmissions.length > 0 ? (
              recentSubmissions.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{item.candidateAlias}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.docType} - {item.candidateIdentifier}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.reviewSummary || "Awaiting recruiter review."}</p>
                  <p className="mt-2 text-xs text-slate-500">Submitted {formatDate(item.submittedOn)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No candidate submissions available.
              </div>
            )}
          </div>
        </article>

        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Application status rollup</h2>
            <p className="mt-1 text-sm text-slate-600">How candidate applications are moving through the funnel.</p>
          </div>
          <div className="grid gap-3 p-6 sm:grid-cols-2">
            {applicationRollup.map((item) => (
              <div key={item.status} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.status}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{formatNumber(item.count)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Recent candidate audit events</h2>
          <p className="mt-1 text-sm text-slate-600">Application changes captured for oversight and traceability.</p>
        </div>
        <div className="space-y-3 p-6">
          {recentCandidateEvents.length > 0 ? (
            recentCandidateEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{event.action}</p>
                    <p className="mt-1 text-xs text-slate-500">{event.actor} - {event.target}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
                    {event.category}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{event.detail}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No candidate audit events yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
