import React from "react";
import { getApplicationStatusLabel } from "../../lib/applicationStatuses";

function getScoreTone(score) {
  if (score >= 80) {
    return {
      wrapper: "border-emerald-200 bg-emerald-50",
      text: "text-emerald-700",
      badge: "bg-emerald-600 text-white",
      bar: "bg-emerald-600",
    };
  }

  if (score >= 50) {
    return {
      wrapper: "border-amber-200 bg-amber-50",
      text: "text-amber-800",
      badge: "bg-amber-500 text-white",
      bar: "bg-amber-500",
    };
  }

  return {
    wrapper: "border-slate-200 bg-slate-50",
    text: "text-slate-700",
    badge: "bg-slate-700 text-white",
    bar: "bg-slate-400",
  };
}

function getApplicationTone(status) {
  if (status === "Shortlisted" || status === "Hired" || status === "HiredOnboarding") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "Interview" || status === "InterviewInitial" || status === "InterviewFinal") {
    return "bg-blue-100 text-blue-800";
  }

  if (status === "Offer" || status === "PostHireDocsSubmitted") {
    return "bg-amber-100 text-amber-800";
  }

  if (status === "Rejected" || status === "BackoutArchived") {
    return "bg-rose-100 text-rose-800";
  }

  return "bg-slate-100 text-slate-700";
}

export default function AICandidateCard({ candidate, application, onClick }) {
  const tone = getScoreTone(candidate.score);
  const isShortlisted = candidate.score >= 80;
  const statusLabel = getApplicationStatusLabel(
    application?.status || (isShortlisted ? "Shortlisted" : "Submitted")
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-soft",
        tone.wrapper,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-950">
            {candidate.nameHint || candidate.alias}
          </p>
          <p className="mt-1 text-sm text-slate-600">{candidate.applicantId}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={["rounded-2xl px-3 py-2 text-sm font-semibold", tone.badge].join(" ")}>
            {candidate.score}%
          </div>
          {application ? (
            <span
              className={[
                "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                getApplicationTone(application.status),
              ].join(" ")}
            >
              {getApplicationStatusLabel(application.status)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
        <div
          className={["h-full rounded-full transition-all", tone.bar].join(" ")}
          style={{ width: `${candidate.score}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {candidate.skills.slice(0, 4).map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/70 px-3 py-2">
          Years experience: <span className="font-semibold text-slate-900">{candidate.yearsExperience}</span>
        </div>
        <div className="rounded-2xl bg-white/70 px-3 py-2">
          Candidate ID: <span className="font-semibold text-slate-900">{candidate.applicantId}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className={["text-xs font-semibold uppercase tracking-[0.16em]", tone.text].join(" ")}>
          {statusLabel}
        </span>
        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-950">
          View profile
        </span>
      </div>
    </button>
  );
}

