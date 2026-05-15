import React, { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminWorkforce } from "../../context/AdminWorkforceContext";
import { useDigitalFiles } from "../../context/DigitalFilesContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import { APPLICATION_STATUS } from "../../lib/applicationStatuses";

const BACKUP_STORAGE_KEY = "admin_system_backup_history_v1";

function readBackups() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BACKUP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBackups(value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(value));
}

function formatDateTime(value) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminSystemCleanup() {
  const { session } = useAuth();
  const { users, addAuditEvent } = useAdminData();
  const { requests, assignments, talentPool } = useAdminWorkforce();
  const { jobs, applicationsByEmail } = useRecruitmentData();
  const { files } = useDigitalFiles();
  const [notice, setNotice] = useState("");
  const [backups, setBackups] = useState(() => readBackups());

  const allApplications = useMemo(
    () => Object.values(applicationsByEmail).flat(),
    [applicationsByEmail]
  );

  const cleanupTargets = useMemo(
    () => ({
      archivedUsers: users.filter((user) => user.status === "Archived").length,
      archivedCandidates: talentPool.filter((candidate) => candidate.status === "Archived").length,
      backoutApplications: allApplications.filter(
        (application) => application.status === APPLICATION_STATUS.BackoutArchived
      ).length,
      archivedFiles: files.filter((file) => file.status === "Archived").length,
      completedRequests: requests.filter((request) => request.status !== "Pending Approval").length,
      inactiveAssignments: assignments.filter((assignment) => assignment.status !== "Active").length,
    }),
    [allApplications, assignments, files, requests, talentPool, users]
  );

  const runBackup = () => {
    const snapshot = {
      id: `BKP-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      createdBy: session?.name || session?.email || "Administrator",
      summary: {
        users: users.length,
        jobs: jobs.length,
        applications: allApplications.length,
        files: files.length,
        requests: requests.length,
        assignments: assignments.length,
      },
    };

    const nextBackups = [snapshot, ...backups].slice(0, 15);
    writeBackups(nextBackups);
    setBackups(nextBackups);
    addAuditEvent({
      actor: snapshot.createdBy,
      action: "Created system backup snapshot",
      target: snapshot.id,
      category: "system",
      detail: JSON.stringify(snapshot.summary),
    });
    setNotice(`Backup snapshot ${snapshot.id} created.`);
  };

  const runCleanupReview = () => {
    const summary = [
      `archivedUsers=${cleanupTargets.archivedUsers}`,
      `archivedCandidates=${cleanupTargets.archivedCandidates}`,
      `backoutApplications=${cleanupTargets.backoutApplications}`,
      `archivedFiles=${cleanupTargets.archivedFiles}`,
      `completedRequests=${cleanupTargets.completedRequests}`,
      `inactiveAssignments=${cleanupTargets.inactiveAssignments}`,
    ].join(", ");

    addAuditEvent({
      actor: session?.name || session?.email || "Administrator",
      action: "Ran cleanup review",
      target: "cleanup-review",
      category: "system",
      detail: summary,
    });
    setNotice("System cleanup review completed and logged.");
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Administrator Console</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          System Cleanup and Data Backup
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Review cleanup targets and generate backup snapshots to support safe platform maintenance.
        </p>
      </section>

      {notice ? (
        <section className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          {notice}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Archived users</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{cleanupTargets.archivedUsers}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Archived candidates</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{cleanupTargets.archivedCandidates}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Backout applications</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{cleanupTargets.backoutApplications}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Archived files</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{cleanupTargets.archivedFiles}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Completed requests</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{cleanupTargets.completedRequests}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Inactive assignments</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{cleanupTargets.inactiveAssignments}</p>
        </article>
      </section>

      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold text-slate-950">Maintenance Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runBackup}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Create Data Backup Snapshot
          </button>
          <button
            type="button"
            onClick={runCleanupReview}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Run System Cleanup Review
          </button>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Backup History</h2>
          <p className="mt-1 text-sm text-slate-600">Recent backup snapshots saved to local storage.</p>
        </div>
        <div className="space-y-3 p-6">
          {backups.length > 0 ? (
            backups.map((backup) => (
              <article key={backup.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">{backup.id}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(backup.createdAt)}</p>
                </div>
                <p className="mt-1 text-xs text-slate-500">Created by {backup.createdBy}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {`Users: ${backup.summary?.users ?? 0}, Jobs: ${backup.summary?.jobs ?? 0}, Applications: ${backup.summary?.applications ?? 0}, Files: ${backup.summary?.files ?? 0}, Requests: ${backup.summary?.requests ?? 0}, Assignments: ${backup.summary?.assignments ?? 0}`}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No backup snapshots yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

