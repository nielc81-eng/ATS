import React, { useMemo, useState } from "react";
import { PageFrame } from "../../components/layout/ShellPrimitives";
import { deriveAdminMobilitySnapshot } from "../../lib/internalMobility";
import {
  readInternalMobilityRecords,
  resetInternalMobilityRecordsToScenario,
} from "../../lib/internalMobilityStore";

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

export default function AdminInternalMobility() {
  const [records, setRecords] = useState(() => readInternalMobilityRecords());
  const [notice, setNotice] = useState("");
  const snapshot = useMemo(() => deriveAdminMobilitySnapshot(records), [records]);

  return (
    <PageFrame size="wide">
      <div className="space-y-6">
        <section className="surface-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="section-heading">Administrator Governance</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Internal Mobility Oversight
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                Review weighting input quality, audit role-level changes, and monitor rating patterns
                across redeployment records.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRecords(readInternalMobilityRecords())}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
              >
                Refresh Snapshot
              </button>
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm(
                    "Reset internal mobility data to scenario seed? This removes in-progress demo changes."
                  );
                  if (!confirmed) return;
                  const seeded = resetInternalMobilityRecordsToScenario();
                  setRecords(seeded);
                  setNotice("Scenario data reset completed.");
                }}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:border-rose-300"
              >
                Reset Scenario Data
              </button>
            </div>
          </div>
        </section>

        {notice ? (
          <section className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {notice}
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total records</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{snapshot.totalRecords}</p>
          </article>
          <article className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Finished</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{snapshot.finishedCount}</p>
          </article>
          <article className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Finished rate</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{snapshot.finishedRate}%</p>
          </article>
          <article className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Audit events</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{snapshot.recentChanges.length}</p>
          </article>
        </section>

        <section className="surface-card p-6">
          <p className="section-heading">Rating distribution</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">Band overview</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">High (&gt;=4.5)</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.ratingBands.high}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Medium (3.0-4.4)</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.ratingBands.medium}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Low (&lt;3.0)</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.ratingBands.low}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Unrated</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.ratingBands.unrated}</p>
            </div>
          </div>
        </section>

        <section className="surface-card overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <p className="section-heading">Immutable audit trail</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">Recent role-level changes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[70rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Applicant</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Role</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Change Type</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Summary</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.recentChanges.slice(0, 30).map((item, index) => (
                  <tr
                    key={`${item.id}-${item.updatedAt}-${index}`}
                    className="border-t border-slate-100 text-slate-700"
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                      {item.applicantName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">{item.updatedByRole}</td>
                    <td className="whitespace-nowrap px-6 py-4">{item.changeType}</td>
                    <td className="px-6 py-4">{item.summary}</td>
                    <td className="whitespace-nowrap px-6 py-4">{formatDateTime(item.updatedAt)}</td>
                  </tr>
                ))}
                {snapshot.recentChanges.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-slate-600" colSpan={5}>
                      No audit events found for internal mobility records.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface-card p-6">
          <p className="section-heading">Policy Note</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">Read-only governance in v1</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Admin oversight validates consistency, fairness, and audit completeness. This view is
            intentionally read-only in v1 and does not allow direct rating edits.
          </p>
        </section>
      </div>
    </PageFrame>
  );
}
