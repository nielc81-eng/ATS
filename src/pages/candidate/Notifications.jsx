import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { PageFrame } from "../../components/layout/ShellPrimitives";
import { useAuth } from "../../context/AuthContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import { getApplicationStatusLabel } from "../../lib/applicationStatuses";

function toDateValue(value) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDateTime(value) {
  if (!value) return "N/A";
  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) return value;
  return asDate.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CandidateNotifications() {
  const { session } = useAuth();
  const { getApplicationsForCandidate } = useRecruitmentData();
  const applications = useMemo(
    () => getApplicationsForCandidate(session?.email || ""),
    [getApplicationsForCandidate, session?.email]
  );

  const notifications = useMemo(
    () =>
      applications
        .flatMap((application) =>
          (application.timeline || []).map((entry, index) => ({
            id: `${application.id}-${index}-${entry.at}`,
            applicationId: application.id,
            jobTitle: application.jobTitle,
            status: entry.toStatus || application.status,
            note: entry.note || "",
            at: entry.at || application.updatedOn || application.appliedOn,
            byRole: entry.byRole || "System",
          }))
        )
        .sort((left, right) => toDateValue(right.at) - toDateValue(left.at))
        .slice(0, 50),
    [applications]
  );

  return (
    <PageFrame size="standard">
      <div className="space-y-6">
        <section className="surface-card p-6 sm:p-8">
          <p className="section-heading">Candidate Portal</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Stay updated with recruiter actions and application timeline changes.
          </p>
        </section>

        <section className="surface-card p-6">
          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {getApplicationStatusLabel(item.status)} - {item.jobTitle}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.applicationId} - {item.byRole} - {formatDateTime(item.at)}
                  </p>
                  {item.note ? (
                    <p className="mt-2 text-sm text-slate-700">{item.note}</p>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No notifications yet.
              </div>
            )}
          </div>
        </section>

        <div>
          <Link
            to="/candidate/applications"
            className="inline-flex rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Open Applications
          </Link>
        </div>
      </div>
    </PageFrame>
  );
}
