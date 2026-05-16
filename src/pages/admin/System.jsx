import React from "react";
import { Link } from "react-router-dom";
import { useAdminWorkforce } from "../../context/AdminWorkforceContext";
import { useDigitalFiles } from "../../context/DigitalFilesContext";

export default function AdminSystem() {
  const { requests, assignments } = useAdminWorkforce();
  const { files } = useDigitalFiles();

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Administrator Console</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          System Hub
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Consolidated maintenance, cleanup, and system health entry points.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Requests tracked</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{requests.length}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Assignments tracked</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{assignments.length}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">File records</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{files.length}</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          to="/admin/system-cleanup"
          className="rounded-3xl border border-slate-200 bg-white px-5 py-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
        >
          Open Cleanup and Backup
        </Link>
        <Link
          to="/admin/audit"
          className="rounded-3xl border border-slate-200 bg-white px-5 py-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
        >
          Review System Audit Timeline
        </Link>
      </section>
    </div>
  );
}
