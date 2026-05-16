import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAdminWorkforce } from "../../context/AdminWorkforceContext";
import { useDigitalFiles } from "../../context/DigitalFilesContext";

export default function DeploymentManagerDashboard() {
  const { requests, assignments } = useAdminWorkforce();
  const { files } = useDigitalFiles();

  const stats = useMemo(
    () => ({
      pendingRequests: requests.filter((request) => request.status === "Pending Approval").length,
      activeDeployments: assignments.filter((assignment) => assignment.status === "Active").length,
      needsActionFiles: files.filter((file) => file.status === "Needs Action").length,
      expiringSoon: assignments.filter((assignment) => {
        if (!assignment.endDate) return false;
        const ms = Date.parse(assignment.endDate) - Date.now();
        return ms > 0 && ms <= 1000 * 60 * 60 * 24 * 14;
      }).length,
    }),
    [requests, assignments, files]
  );

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Deployment Manager</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Deployment Manager Dashboard
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Monitor active deployments, manage Digital 201 vault records, track expirations, and trigger compliance follow-ups.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Pending requests", stats.pendingRequests],
          ["Active deployments", stats.activeDeployments],
          ["Files needing action", stats.needsActionFiles],
          ["Expiring within 14 days", stats.expiringSoon],
        ].map(([label, value]) => (
          <article key={label} className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Review deployment requests", "/deployment-manager/requests"],
          ["Monitor active assignments", "/deployment-manager/assignments"],
          ["View deployment schedule", "/deployment-manager/schedule"],
          ["Manage Digital 201 vault", "/deployment-manager/vault"],
          ["Trigger compliance notifications", "/deployment-manager/notifications"],
        ].map(([label, to]) => (
          <Link
            key={to}
            to={to}
            className="rounded-3xl border border-slate-200 bg-white px-5 py-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            {label}
          </Link>
        ))}
      </section>
    </div>
  );
}
