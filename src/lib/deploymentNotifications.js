const STORAGE_KEY = "deployment_manager_notifications_v1";

export const DEPLOYMENT_EVENT_TYPES = {
  ExpirationAlert: "expiration_alert",
  ComplianceNotification: "compliance_notification",
};

function readRaw() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(entries) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function normalizeEventType(value) {
  if (value === DEPLOYMENT_EVENT_TYPES.ComplianceNotification) {
    return DEPLOYMENT_EVENT_TYPES.ComplianceNotification;
  }

  return DEPLOYMENT_EVENT_TYPES.ExpirationAlert;
}

function normalizeEvent(entry) {
  const id = String(entry?.id || "").trim();
  const message = String(entry?.message || "").trim();
  if (!id || !message) return null;

  return {
    id,
    assignmentId: String(entry?.assignmentId || "").trim(),
    eventType: normalizeEventType(entry?.eventType || entry?.type),
    message,
    status: String(entry?.status || "sent").trim().toLowerCase() || "sent",
    triggeredBy: String(entry?.triggeredBy || "Deployment Manager").trim(),
    createdAt: String(entry?.createdAt || ""),
    metadata:
      entry?.metadata && typeof entry.metadata === "object" && !Array.isArray(entry.metadata)
        ? entry.metadata
        : {},
  };
}

export function getDeploymentNotifications() {
  return readRaw().map(normalizeEvent).filter(Boolean);
}

export function createDeploymentNotification(payload) {
  const message = String(payload?.message || "").trim();
  if (!message) {
    return { ok: false, message: "Notification message is required." };
  }

  const event = {
    id: `DMN-${Date.now().toString().slice(-6)}`,
    assignmentId: String(payload?.assignmentId || "").trim(),
    eventType: normalizeEventType(payload?.eventType || payload?.type),
    message,
    status: "sent",
    triggeredBy: String(payload?.triggeredBy || "Deployment Manager").trim(),
    createdAt: new Date().toISOString(),
    metadata:
      payload?.metadata && typeof payload.metadata === "object" && !Array.isArray(payload.metadata)
        ? payload.metadata
        : {},
  };

  const next = [event, ...getDeploymentNotifications()];
  writeRaw(next);
  return { ok: true, notification: event };
}

