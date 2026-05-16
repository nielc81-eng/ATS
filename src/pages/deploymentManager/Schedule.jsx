import React, { useMemo } from "react";
import { useAdminWorkforce } from "../../context/AdminWorkforceContext";

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

export default function DeploymentManagerSchedule() {
  const { assignments } = useAdminWorkforce();

  const scheduled = useMemo(
    () =>
      [...assignments].sort(
        (left, right) => Date.parse(left.startDate || left.assignedAt || "") - Date.parse(right.startDate || right.assignedAt || "")
      ),
    [assignments]
  );

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Deployment Manager</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Deployment Schedule
        </h1>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Talent</th>
                <th className="px-6 py-3 font-medium">Target</th>
                <th className="px-6 py-3 font-medium">Start</th>
                <th className="px-6 py-3 font-medium">End</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {scheduled.map((assignment) => (
                <tr key={assignment.id} className="border-t border-slate-100">
                  <td className="px-6 py-4 font-medium text-slate-900">{assignment.talentName}</td>
                  <td className="px-6 py-4 text-slate-700">{assignment.targetType}: {assignment.targetName}</td>
                  <td className="px-6 py-4 text-slate-700">{formatDate(assignment.startDate || assignment.assignedAt)}</td>
                  <td className="px-6 py-4 text-slate-700">{formatDate(assignment.endDate)}</td>
                  <td className="px-6 py-4 text-slate-700">{assignment.status}</td>
                </tr>
              ))}
              {scheduled.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                    No deployment schedule records yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
