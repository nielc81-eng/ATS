import React from "react";
import { getDigitalFileStatusTone } from "../../lib/digitalFilesMockData";

export default function DigitalFileDetailPanel({
  file,
  onApprove,
  onNeedsAction,
  onArchive,
  onAttachMockFile,
}) {
  if (!file) {
    return (
      <aside className="surface-card p-6">
        <p className="section-heading">File Details</p>
        <p className="mt-4 text-sm text-slate-600">
          Select a file to review its status and document checklist.
        </p>
      </aside>
    );
  }

  const tone = getDigitalFileStatusTone(file.status);

  return (
    <aside className="surface-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-heading">File Details</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {file.employeeName}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {file.employeeId} - {file.department}
          </p>
        </div>
        <span className={["rounded-full px-3 py-1 text-xs font-semibold", tone.pill].join(" ")}>
          {file.status}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Uploaded On
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {file.uploadedOn}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Last Reviewed
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {file.lastReviewedOn}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">Review Summary</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">{file.reviewSummary}</p>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-900">Document Checklist</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {file.documents.map((doc) => (
            <li key={doc}>- {doc}</li>
          ))}
        </ul>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-900">Internal Notes</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{file.notes}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onApprove}
          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={onNeedsAction}
          className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 transition hover:border-amber-400"
        >
          Request Action
        </button>
        <button
          type="button"
          onClick={onArchive}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
        >
          Archive
        </button>
        <button
          type="button"
          onClick={onAttachMockFile}
          className="rounded-2xl border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900 transition hover:border-blue-400"
        >
          Attach Mock File
        </button>
      </div>
    </aside>
  );
}

