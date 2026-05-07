import React, { useEffect } from "react";

function getScoreTone(score) {
  if (score >= 80) return "bg-emerald-600 text-white";
  if (score >= 50) return "bg-amber-500 text-white";
  return "bg-slate-700 text-white";
}

export default function CandidateProfileModal({ candidate, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close candidate profile"
        className="absolute inset-0 bg-slate-950/50"
        onClick={onClose}
      />

      <section className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_120px_rgba(15,23,42,0.25)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Blind Profile
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {candidate.alias}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{candidate.applicantId}</p>
          </div>
          <div className="flex items-center gap-3">
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

        <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">
                Technical Skills
              </p>
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
                <p className="text-sm font-semibold text-slate-900">
                  Years of Experience
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {candidate.yearsExperience}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-900">Blind Status</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Name, photo, school, and address remain hidden during screening.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-900">
                Semantic Justification
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {candidate.justification}
              </p>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">
                Masked PII Snapshot
              </p>
              <dl className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4">
                  <dt>Name</dt>
                  <dd className="font-medium text-slate-900">Hidden</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Photo</dt>
                  <dd className="font-medium text-slate-900">Hidden</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>School</dt>
                  <dd className="font-medium text-slate-900">Hidden</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Address</dt>
                  <dd className="font-medium text-slate-900">Hidden</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-900">Match Signals</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {candidate.matchSignals.map((signal) => (
                  <li key={signal}>- {signal}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
