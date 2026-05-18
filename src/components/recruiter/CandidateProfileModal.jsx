import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  APPLICATION_STATUS,
  getApplicationStatusLabel,
} from "../../lib/applicationStatuses";

const statusOptions = [
  APPLICATION_STATUS.Submitted,
  APPLICATION_STATUS.InterviewInitial,
  APPLICATION_STATUS.InterviewFinal,
  APPLICATION_STATUS.PostHireDocsSubmitted,
  APPLICATION_STATUS.HiredOnboarding,
  APPLICATION_STATUS.PooledForFutureOpportunities,
  APPLICATION_STATUS.BackoutArchived,
  APPLICATION_STATUS.Rejected,
];

function toDateValue(value) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? 0 : parsed;
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

function getStatusTone(status) {
  switch (status) {
    case APPLICATION_STATUS.InterviewInitial:
      return "bg-sky-100 text-sky-700";
    case APPLICATION_STATUS.InterviewFinal:
      return "bg-indigo-100 text-indigo-700";
    case APPLICATION_STATUS.PostHireDocsSubmitted:
      return "bg-violet-100 text-violet-700";
    case APPLICATION_STATUS.HiredOnboarding:
      return "bg-emerald-100 text-emerald-700";
    case APPLICATION_STATUS.PooledForFutureOpportunities:
      return "bg-amber-100 text-amber-700";
    case APPLICATION_STATUS.BackoutArchived:
      return "bg-rose-100 text-rose-700";
    case APPLICATION_STATUS.Shortlisted:
      return "bg-sky-100 text-sky-700";
    case APPLICATION_STATUS.Interview:
      return "bg-indigo-100 text-indigo-700";
    case APPLICATION_STATUS.Offer:
      return "bg-violet-100 text-violet-700";
    case APPLICATION_STATUS.Hired:
      return "bg-emerald-100 text-emerald-700";
    case APPLICATION_STATUS.Rejected:
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getScoreTone(score) {
  if (score >= 80) return "bg-emerald-600 text-white";
  if (score >= 50) return "bg-amber-500 text-white";
  return "bg-slate-700 text-white";
}

function normalizeTimeline(timeline) {
  return [...(Array.isArray(timeline) ? timeline : [])]
    .map((entry) => ({
      at: String(entry?.at || ""),
      byRole: String(entry?.byRole || "System"),
      toStatus: String(entry?.toStatus || "Submitted"),
      note: String(entry?.note || ""),
    }))
    .sort((left, right) => toDateValue(left.at) - toDateValue(right.at));
}

export default function CandidateProfileModal({
  candidate,
  application,
  onClose,
  onSaveStatus,
}) {
  const [selectedStatus, setSelectedStatus] = useState(APPLICATION_STATUS.Submitted);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setSelectedStatus(application?.status || APPLICATION_STATUS.Submitted);
    setNote("");
    setError("");
    setNotice("");
  }, [application?.id, application?.status]);

  const timeline = useMemo(
    () => normalizeTimeline(application?.timeline),
    [application?.timeline]
  );

  const previewItems = useMemo(
    () => [...timeline].reverse().slice(0, 5),
    [timeline]
  );

  if (!candidate) return null;

  const handleSave = async () => {
    const trimmedNote = note.trim();

    if (
      (selectedStatus === APPLICATION_STATUS.Rejected ||
        selectedStatus === APPLICATION_STATUS.BackoutArchived) &&
      !trimmedNote
    ) {
      setError("A note is required when rejecting an applicant.");
      setNotice("");
      return;
    }

    setError("");
    const result = onSaveStatus?.(selectedStatus, trimmedNote);

    if (result && result.ok === false) {
      setError(result.message || "Unable to update application status.");
      setNotice("");
      return;
    }

    setNotice("Application status updated.");
  };

  const currentStatus = application?.status || APPLICATION_STATUS.Submitted;
  const latestUpdated = application?.updatedOn || application?.appliedOn || "";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close candidate profile"
        className="absolute inset-0 bg-slate-950/50"
        onClick={onClose}
      />

      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col max-h-[90vh] overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_120px_rgba(15,23,42,0.25)]">
        <div className="flex-none flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Candidate Profile</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {candidate.nameHint || candidate.alias}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{candidate.applicantId}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <span className={["rounded-2xl px-4 py-2 text-sm font-semibold", getScoreTone(candidate.score)].join(" ")}>
              {candidate.score}% match
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Technical Skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {candidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-900">Years of Experience</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {candidate.yearsExperience}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-900">Review Status</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Application progression is tracked through interview, onboarding, and archive decisions.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-900">Semantic Justification</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {candidate.justification}
              </p>
            </div>

            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Requisition Alignment</p>
              <p className="mt-3 text-sm text-slate-600">
                Validate skill overlap and timeline notes before moving candidates through the compliance and interview gate.
              </p>
            </div>
            </div>

            <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Current Status
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">
                    {getApplicationStatusLabel(currentStatus)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Updated {formatDateTime(latestUpdated)}
                  </p>
                </div>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    getStatusTone(currentStatus),
                  ].join(" ")}
                >
                  {getApplicationStatusLabel(currentStatus)}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Update Status
                  <select
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {getApplicationStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Note{" "}
                  {selectedStatus === APPLICATION_STATUS.Rejected ||
                  selectedStatus === APPLICATION_STATUS.BackoutArchived ? (
                    <span className="text-rose-600">*</span>
                  ) : null}
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={4}
                    placeholder="Add a recruiter note"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                {selectedStatus === APPLICATION_STATUS.Rejected ||
                selectedStatus === APPLICATION_STATUS.BackoutArchived ? (
                  <p className="text-xs text-slate-500">A note is required for rejection or backout decisions.</p>
                ) : null}

                {selectedStatus === APPLICATION_STATUS.HiredOnboarding ? (
                  <p className="text-xs text-slate-500">
                    Role flow: Candidate submits required 201 docs, then Talent Acquisition/Recruiter finalizes onboarding.
                  </p>
                ) : null}

                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                {notice ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {notice}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Save Status
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-900">Latest Timeline</p>
              <div className="mt-4 space-y-3">
                {previewItems.length > 0 ? (
                  previewItems.map((entry, index) => (
                    <article
                      key={`${entry.at}-${entry.toStatus}-${index}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {getApplicationStatusLabel(entry.toStatus)}
                        </p>
                        <p className="text-xs text-slate-500">{formatDateTime(entry.at)}</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">Updated by {entry.byRole}</p>
                      {entry.note ? (
                        <p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                          {entry.note}
                        </p>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No timeline entries yet.
                  </p>
                )}
              </div>
            </div>
            </aside>
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}
