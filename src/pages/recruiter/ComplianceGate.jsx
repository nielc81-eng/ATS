import React, { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useDigitalFiles } from "../../context/DigitalFilesContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import {
  APPLICATION_STATUS,
  getApplicationStatusLabel,
  INTERVIEW_GATE_FAIL_STATUS,
  INTERVIEW_GATE_PASS_STATUS,
} from "../../lib/applicationStatuses";
import {
  getComplianceGateDecisions,
  upsertComplianceGateDecision,
} from "../../lib/complianceGateStore";

const gateStatuses = new Set([
  APPLICATION_STATUS.InterviewInitial,
  APPLICATION_STATUS.InterviewFinal,
  APPLICATION_STATUS.PostHireDocsSubmitted,
]);

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

function daysSince(value) {
  const timestamp = Date.parse(value || "");
  if (Number.isNaN(timestamp)) return 0;
  return Math.max(0, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24)));
}

export default function ComplianceGate() {
  const { session } = useAuth();
  const { applicationsByEmail, updateApplicationStatus } = useRecruitmentData();
  const { addFile } = useDigitalFiles();
  const [noteByApplicationId, setNoteByApplicationId] = useState({});
  const [notice, setNotice] = useState("");
  const [decisions, setDecisions] = useState(() => getComplianceGateDecisions());

  const allApplications = useMemo(
    () => Object.values(applicationsByEmail).flat(),
    [applicationsByEmail]
  );
  const decisionsById = useMemo(
    () => new Map(decisions.map((decision) => [decision.applicationId, decision])),
    [decisions]
  );

  const queue = useMemo(
    () =>
      allApplications
        .filter((application) => gateStatuses.has(application.status))
        .sort(
          (left, right) =>
            Date.parse(right.updatedOn || right.appliedOn || "") -
            Date.parse(left.updatedOn || left.appliedOn || "")
        ),
    [allApplications]
  );

  const finalizeOnboarding = (application) => {
    const note = String(noteByApplicationId[application.id] || "").trim();
    if (!note) {
      setNotice("A compliance note is required before finalizing onboarding.");
      return;
    }

    const result = updateApplicationStatus(
      application.id,
      INTERVIEW_GATE_PASS_STATUS,
      note
    );
    if (!result.ok) {
      setNotice(result.message);
      return;
    }

    upsertComplianceGateDecision({
      applicationId: application.id,
      result: "pass",
      reason: note,
      actor: session?.name || session?.email || "Talent Acquisition",
    });
    setDecisions(getComplianceGateDecisions());

    addFile({
      employeeName: application.candidateName,
      employeeId: `EMP-${application.id.slice(-4)}`,
      department: "Onboarding",
      notes: `Onboarding finalized via 7-day compliance interview gate for ${application.jobTitle}.`,
    });

    setNotice(
      `${application.candidateName} finalized for onboarding. Digital 201 vault has been updated.`
    );
  };

  const declareBackout = (application) => {
    const note = String(noteByApplicationId[application.id] || "").trim();
    if (!note) {
      setNotice("A backout reason is required before discarding/archive.");
      return;
    }

    const result = updateApplicationStatus(
      application.id,
      INTERVIEW_GATE_FAIL_STATUS,
      note
    );
    if (!result.ok) {
      setNotice(result.message);
      return;
    }

    upsertComplianceGateDecision({
      applicationId: application.id,
      result: "fail",
      reason: note,
      actor: session?.name || session?.email || "Talent Acquisition",
    });
    setDecisions(getComplianceGateDecisions());

    setNotice(`${application.candidateName} marked as backout and archived.`);
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Talent Acquisition Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Compliance & Interview Gate (7-Day Period)
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Evaluate interview-phase candidates, then either finalize onboarding and update the Digital 201 vault or declare backout and discard/archive.
        </p>
      </section>

      {notice ? (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {notice}
        </section>
      ) : null}

      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold text-slate-950">Gate Queue</h2>
        <p className="mt-1 text-sm text-slate-600">
          Candidates in interview/post-hire stages pending 7-day gate decision.
        </p>

        <div className="mt-5 space-y-4">
          {queue.length > 0 ? (
            queue.map((application) => {
              const decision = decisionsById.get(application.id);
              const age = daysSince(application.updatedOn || application.appliedOn);
              return (
                <article key={application.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {application.candidateName}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {application.jobTitle} - {application.id}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {getApplicationStatusLabel(application.status)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                      Last update: {formatDateTime(application.updatedOn || application.appliedOn)}
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                      Days in gate window: {age}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={noteByApplicationId[application.id] || ""}
                    onChange={(event) =>
                      setNoteByApplicationId((prev) => ({
                        ...prev,
                        [application.id]: event.target.value,
                      }))
                    }
                    placeholder="Add compliance/interview gate decision note"
                    className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => finalizeOnboarding(application)}
                      className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                      Yes: Finalize Onboarding
                    </button>
                    <button
                      type="button"
                      onClick={() => declareBackout(application)}
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:border-rose-300"
                    >
                      No: Declare Backout and Discard/Archive
                    </button>
                  </div>

                  {decision ? (
                    <p className="mt-3 text-xs text-slate-500">
                      Last decision: {decision.result.toUpperCase()} by {decision.actor} at {formatDateTime(decision.decidedAt)}
                    </p>
                  ) : null}
                </article>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-600">
              No candidates are currently waiting at the compliance and interview gate.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
