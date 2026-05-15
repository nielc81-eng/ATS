import React, { useMemo } from "react";
import { useAdminData } from "../../context/AdminDataContext";

function formatDateTime(value) {
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

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

export default function AdminAuditLog() {
  const { auditEvents } = useAdminData();

  const stats = useMemo(() => {
    const categories = ["system", "users", "applications", "records", "workforce"];
    return {
      total: auditEvents.length,
      categories: categories.map((category) => ({
        category,
        count: auditEvents.filter((event) => event.category === category).length,
      })),
    };
  }, [auditEvents]);

  return (
    <div className="space-y-6">
      <section className="surface-card overflow-hidden border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white sm:p-8">
        <p className="section-heading text-cyan-200">Audit review</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Application audit trail
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
          Review role changes, application lifecycle updates, and file review actions captured in the local mock layer.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total events</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{formatNumber(stats.total)}</p>
        </article>
        {stats.categories.map((item) => (
          <article key={item.category} className="surface-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.category}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{formatNumber(item.count)}</p>
          </article>
        ))}
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Event timeline</h2>
          <p className="mt-1 text-sm text-slate-600">Most recent entries appear first.</p>
        </div>
        <div className="space-y-3 p-6">
          {auditEvents.length > 0 ? (
            auditEvents.map((event) => (
              <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{event.action}</p>
                    <p className="mt-1 text-xs text-slate-500">{event.actor} - {event.target || "No target"}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                    {event.category}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{event.detail}</p>
                <p className="mt-2 text-xs text-slate-500">{formatDateTime(event.timestamp)}</p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No audit activity recorded yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
