import React, { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAdminWorkforce } from "../../context/AdminWorkforceContext";
import {
  createDeploymentNotification,
  DEPLOYMENT_EVENT_TYPES,
  getDeploymentNotifications,
} from "../../lib/deploymentNotifications";

const EXPIRY_WINDOW_DAYS = 14;

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

function daysUntil(value) {
  const target = Date.parse(value || "");
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function DeploymentManagerAlerts() {
  const { session } = useAuth();
  const { assignments } = useAdminWorkforce();
  const [notice, setNotice] = useState("");
  const [events, setEvents] = useState(() => getDeploymentNotifications());

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === "Active"),
    [assignments]
  );

  const expiringAssignments = useMemo(
    () =>
      activeAssignments.filter((assignment) => {
        const remaining = daysUntil(assignment.endDate);
        return remaining !== null && remaining >= 0 && remaining <= EXPIRY_WINDOW_DAYS;
      }),
    [activeAssignments]
  );

  const triggerNotification = (assignment, eventType) => {
    const remaining = daysUntil(assignment.endDate);
    const message =
      eventType === DEPLOYMENT_EVENT_TYPES.ExpirationAlert
        ? `${assignment.talentName} deployment expires in ${remaining} day(s).`
        : `Compliance follow-up triggered for ${assignment.talentName} deployment assignment.`;

    const result = createDeploymentNotification({
      assignmentId: assignment.id,
      eventType,
      message,
      triggeredBy: session?.name || session?.email || "Deployment Manager",
      metadata: {
        talentId: assignment.talentId,
        talentName: assignment.talentName,
        targetName: assignment.targetName,
      },
    });

    if (!result.ok) {
      setNotice(result.message);
      return;
    }

    setEvents(getDeploymentNotifications());
    setNotice(
      eventType === DEPLOYMENT_EVENT_TYPES.ExpirationAlert
        ? `Expiration alert sent for ${assignment.talentName}.`
        : `Compliance notification triggered for ${assignment.talentName}.`
    );
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Deployment Manager</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Expiration Alerts and Compliance Notifications
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Receive automated expiration alerts and trigger compliance notifications from deployment operations.
        </p>
      </section>

      {notice ? (
        <section className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          {notice}
        </section>
      ) : null}

      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold text-slate-950">Assignments Near Expiration</h2>
        <p className="mt-1 text-sm text-slate-600">
          Active assignments ending within {EXPIRY_WINDOW_DAYS} days.
        </p>

        <div className="mt-4 space-y-3">
          {expiringAssignments.length > 0 ? (
            expiringAssignments.map((assignment) => {
              const remaining = daysUntil(assignment.endDate);
              return (
                <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{assignment.talentName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {assignment.targetType}: {assignment.targetName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Ends {formatDateTime(assignment.endDate)} ({remaining} day(s) remaining)
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      Expiring Soon
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        triggerNotification(assignment, DEPLOYMENT_EVENT_TYPES.ExpirationAlert)
                      }
                      className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900 transition hover:border-amber-400"
                    >
                      Receive Expiration Alert
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        triggerNotification(
                          assignment,
                          DEPLOYMENT_EVENT_TYPES.ComplianceNotification
                        )
                      }
                      className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      Trigger Compliance Notification
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No active deployments are within the expiration window.
            </div>
          )}
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Notification Events</h2>
          <p className="mt-1 text-sm text-slate-600">
            Event log for expiration and compliance notifications.
          </p>
        </div>

        <div className="space-y-3 p-6">
          {events.length > 0 ? (
            events.map((event) => (
              <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">{event.message}</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                    {event.eventType === DEPLOYMENT_EVENT_TYPES.ExpirationAlert
                      ? "Expiration"
                      : "Compliance"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {event.id} - Triggered by {event.triggeredBy}
                </p>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(event.createdAt)}</p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No deployment notification events recorded yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

