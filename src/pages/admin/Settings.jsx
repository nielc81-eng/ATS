import React from "react";
import { Link } from "react-router-dom";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Administrator Console</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Manage administrative profile, policy defaults, and role assignment controls from a single settings module.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          to="/admin/profile"
          className="rounded-3xl border border-slate-200 bg-white px-5 py-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
        >
          My Profile
        </Link>
        <Link
          to="/admin/policies"
          className="rounded-3xl border border-slate-200 bg-white px-5 py-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
        >
          Recruitment and AI Policies
        </Link>
        <Link
          to="/admin/roles-and-privileges"
          className="rounded-3xl border border-slate-200 bg-white px-5 py-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
        >
          Roles and Privileges
        </Link>
      </section>
    </div>
  );
}
