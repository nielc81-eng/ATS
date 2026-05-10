import React, { useMemo } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import { useDigitalFiles } from "../../context/DigitalFilesContext";

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

export default function AdminFilesReview() {
  const { auditEvents } = useAdminData();
  const { files } = useDigitalFiles();

  const stats = useMemo(
    () => ({
      total: files.length,
      pending: files.filter((file) => file.status === "Pending Review").length,
      approved: files.filter((file) => file.status === "Approved").length,
      needsAction: files.filter((file) => file.status === "Needs Action").length,
      archived: files.filter((file) => file.status === "Archived").length,
    }),
    [files]
  );

  const recentFiles = useMemo(
    () =>
      [...files]
        .sort((left, right) => Date.parse(right.lastReviewedOn || "") - Date.parse(left.lastReviewedOn || ""))
        .slice(0, 6),
    [files]
  );

  const recentRecordEvents = useMemo(
    () => auditEvents.filter((event) => event.category === "records").slice(0, 6),
    [auditEvents]
  );

  return (
    <div className="space-y-6">
      <section className="surface-card overflow-hidden border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white sm:p-8">
        <p className="section-heading text-emerald-200">File oversight</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Digital 201 Files review
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
          Inspect the 201 file vault, review queue, and any file records that need follow-up.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total files", value: stats.total },
          { label: "Pending", value: stats.pending },
          { label: "Approved", value: stats.approved },
          { label: "Needs action", value: stats.needsAction },
          { label: "Archived", value: stats.archived },
        ].map((item) => (
          <article key={item.label} className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{formatNumber(item.value)}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">File review queue</h2>
            <p className="mt-1 text-sm text-slate-600">Latest file state changes from the recruiter vault.</p>
          </div>
          <div className="space-y-3 p-6">
            {recentFiles.length > 0 ? (
              recentFiles.map((file) => (
                <div key={file.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{file.employeeName}</p>
                      <p className="mt-1 text-xs text-slate-500">{file.employeeId} - {file.department}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                      {file.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{file.reviewSummary}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No file records available.
              </div>
            )}
          </div>
        </article>

        <article className="surface-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Recent file audit events</h2>
            <p className="mt-1 text-sm text-slate-600">Traceability for records that moved through review.</p>
          </div>
          <div className="space-y-3 p-6">
            {recentRecordEvents.length > 0 ? (
              recentRecordEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">{event.action}</p>
                  <p className="mt-1 text-xs text-slate-500">{event.actor} - {event.target}</p>
                  <p className="mt-2 text-sm text-slate-600">{event.detail}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No file audit events yet.
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
