import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";

const statusPillByValue = {
  Submitted: "bg-slate-100 text-slate-700",
  Shortlisted: "bg-sky-100 text-sky-700",
  Interview: "bg-indigo-100 text-indigo-700",
  Offer: "bg-violet-100 text-violet-700",
  Hired: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-rose-100 text-rose-700",
};

function formatDate(value) {
  if (!value) return "-";
  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) return "-";

  return asDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "-";
  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) return "-";

  return asDate.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDateValue(value) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getStatusPill(status) {
  return statusPillByValue[status] || "bg-slate-100 text-slate-700";
}

function buildTimeline(application) {
  const rawTimeline = Array.isArray(application?.timeline) ? application.timeline : [];

  if (rawTimeline.length > 0) {
    return [...rawTimeline]
      .map((entry) => ({
        at: String(entry?.at || ""),
        byRole: String(entry?.byRole || "System"),
        toStatus: String(entry?.toStatus || application.status || "Submitted"),
        note: String(entry?.note || ""),
      }))
      .sort((left, right) => toDateValue(left.at) - toDateValue(right.at));
  }

  return [
    {
      at: String(application?.appliedOn || ""),
      byRole: "System",
      toStatus: String(application?.status || "Submitted"),
      note: "",
    },
  ];
}

function getUpdatedMarker(application) {
  return application?.updatedOn || application?.appliedOn || "";
}

export default function CandidateApplications() {
  const { session } = useAuth();
  const { getApplicationsForCandidate } = useRecruitmentData();
  const [selectedApplicationId, setSelectedApplicationId] = useState("");

  const applications = useMemo(
    () => getApplicationsForCandidate(session?.email || ""),
    [getApplicationsForCandidate, session?.email]
  );

  const selectedApplication = useMemo(
    () =>
      applications.find((application) => application.id === selectedApplicationId) || null,
    [applications, selectedApplicationId]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !session?.email) return;

    const markerKey = `lastSeenCandidateUpdates:${session.email}`;
    const newestMarker = applications.reduce((latestValue, application) => {
      const marker = getUpdatedMarker(application);
      return toDateValue(marker) > toDateValue(latestValue) ? marker : latestValue;
    }, "");

    window.localStorage.setItem(markerKey, newestMarker || new Date().toISOString());
  }, [applications, session?.email]);

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Candidate Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          My Applications
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Track your status updates, latest recruiter activity, and full progression timeline.
        </p>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Application History</h2>
        </div>

        {applications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {applications.map((application) => (
              <article key={application.id} className="px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {application.jobTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Applied on {formatDate(application.appliedOn)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Updated on {formatDate(getUpdatedMarker(application))}
                    </p>
                  </div>

                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      getStatusPill(application.status),
                    ].join(" ")}
                  >
                    {application.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/jobs/${encodeURIComponent(application.jobId)}`}
                    className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    View Job Detail
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedApplicationId(application.id)}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                  >
                    View Timeline
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-sm text-slate-600">
            No applications yet. Browse open roles on the public job board.
          </div>
        )}
      </section>

      {selectedApplication ? (
        <div
          className="fixed inset-0 z-40 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Application timeline details"
        >
          <button
            type="button"
            className="h-full flex-1 bg-slate-950/40"
            onClick={() => setSelectedApplicationId("")}
          />

          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-heading">Application Detail</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">
                  {selectedApplication.jobTitle}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Applied on {formatDate(selectedApplication.appliedOn)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Last updated {formatDateTime(getUpdatedMarker(selectedApplication))}
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                onClick={() => setSelectedApplicationId("")}
              >
                Close
              </button>
            </div>

            <div className="mt-5">
              <span
                className={[
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  getStatusPill(selectedApplication.status),
                ].join(" ")}
              >
                {selectedApplication.status}
              </span>
            </div>

            <section className="mt-7">
              <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                Timeline
              </h4>
              <div className="mt-3 space-y-3">
                {buildTimeline(selectedApplication).map((entry, index) => (
                  <article
                    key={`${entry.at}-${entry.toStatus}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{entry.toStatus}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(entry.at)}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">Updated by {entry.byRole}</p>
                    {entry.note ? (
                      <p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                        {entry.note}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-7">
              <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                Recruiter Notes
              </h4>
              <div className="mt-3 space-y-3">
                {buildTimeline(selectedApplication).filter(
                  (entry) => entry.byRole === "Recruiter" && entry.note
                ).length > 0 ? (
                  buildTimeline(selectedApplication)
                    .filter((entry) => entry.byRole === "Recruiter" && entry.note)
                    .map((entry, index) => (
                      <article
                        key={`note-${entry.at}-${index}`}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <p className="text-xs text-slate-500">{formatDateTime(entry.at)}</p>
                        <p className="mt-2 text-sm text-slate-700">{entry.note}</p>
                      </article>
                    ))
                ) : (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No recruiter notes yet for this application.
                  </p>
                )}
              </div>
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
