import React, { useMemo, useState } from "react";
import { useDigitalFiles } from "../../context/DigitalFilesContext";

function formatDate(value) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const statusOptions = ["Pending Review", "Approved", "Needs Action", "Archived"];

export default function DeploymentManagerVault() {
  const { files, updateFileStatus } = useDigitalFiles();
  const [notice, setNotice] = useState("");

  const stats = useMemo(
    () => ({
      total: files.length,
      pending: files.filter((file) => file.status === "Pending Review").length,
      action: files.filter((file) => file.status === "Needs Action").length,
      approved: files.filter((file) => file.status === "Approved").length,
    }),
    [files]
  );

  const updateStatus = (file, status) => {
    const summary =
      status === "Needs Action"
        ? "Deployment manager requested document remediation."
        : `Deployment manager set Digital 201 status to ${status}.`;
    const result = updateFileStatus(file.id, status, summary);
    setNotice(result.ok ? `${file.employeeName} updated to ${status}.` : result.message);
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Deployment Manager</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Manage Digital 201 Vault
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Review employee records, update vault statuses, and keep deployment documents compliant.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total records</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.total}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pending review</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.pending}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Needs action</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.action}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Approved</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.approved}</p>
        </article>
      </section>

      {notice ? (
        <section className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          {notice}
        </section>
      ) : null}

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Vault Records</h2>
          <p className="mt-1 text-sm text-slate-600">
            Assign status updates based on deployment-readiness and record quality.
          </p>
        </div>

        <div className="space-y-3 p-6">
          {files.length > 0 ? (
            files.map((file) => (
              <article key={file.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{file.employeeName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {file.employeeId} - {file.department} - Last review {formatDate(file.lastReviewedOn)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {file.status}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-600">{file.reviewSummary}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={`${file.id}-${status}`}
                      type="button"
                      onClick={() => updateStatus(file, status)}
                      className={[
                        "rounded-2xl px-3 py-2 text-xs font-semibold transition",
                        file.status === status
                          ? "bg-slate-950 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                      ].join(" ")}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No Digital 201 records available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

