import {
  archiveAccount,
  ensureDemoAccounts,
  getAccounts,
  restoreAccount,
  updateAccountRole,
} from "./mockAuthStore.js";

export const ADMIN_AUDIT_STORAGE_KEY = "ai_resume_screening_admin_audit_events_v1";

export const rolePermissions = {
  Candidate: [
    "Own dashboard access",
    "Resume upload and document tracking",
    "Status notifications",
  ],
  Recruiter: [
    "Talent acquisition dashboard access",
    "AI-ranked candidate screening and requisition alignment",
    "Talent pool search and profile re-evaluation",
    "Recruitment analytics and audit reporting",
    "Compliance and interview gate decisions",
  ],
  DeploymentManager: [
    "Monitor active deployments",
    "Update employee deployment status",
    "Digital 201 vault management",
    "Expiration alert and compliance notification control",
  ],
  Administrator: [
    "Manage staff accounts",
    "Assign work privileges",
    "Set recruitment and AI policies",
    "Monitor usage history",
    "System cleanup and data backup",
  ],
};

const seedAuditEvents = [
  {
    id: "AUD-9001",
    timestamp: "2026-05-01T08:00:00.000Z",
    actor: "System",
    action: "Provisioned administrator account",
    target: "admin@demo.com",
    category: "system",
    detail: "Seeded local demo admin access for platform oversight.",
  },
  {
    id: "AUD-9002",
    timestamp: "2026-05-02T10:15:00.000Z",
    actor: "System",
    action: "Imported recruiter accounts",
    target: "recruiter@demo.com",
    category: "system",
    detail: "Demo recruiter profile was added to the local auth store.",
  },
  {
    id: "AUD-9003",
    timestamp: "2026-05-04T16:40:00.000Z",
    actor: "HR Ops",
    action: "Reviewed onboarding packet",
    target: "201-1003",
    category: "records",
    detail: "File marked as needing action after compliance review.",
  },
];

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function readJsonArray(key) {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJsonArray(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readAuditEvents() {
  return readJsonArray(ADMIN_AUDIT_STORAGE_KEY)
    .map((event) => ({
      id: String(event?.id || "").trim(),
      timestamp: typeof event?.timestamp === "string" ? event.timestamp : "",
      actor: typeof event?.actor === "string" ? event.actor : "System",
      action: typeof event?.action === "string" ? event.action : "",
      target: typeof event?.target === "string" ? event.target : "",
      category: typeof event?.category === "string" ? event.category : "system",
      detail: typeof event?.detail === "string" ? event.detail : "",
    }))
    .filter((event) => event.id && event.action)
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));
}

function persistAuditEvents(events) {
  writeJsonArray(ADMIN_AUDIT_STORAGE_KEY, events);
}

function ensureSeedAuditEvents() {
  const current = readAuditEvents();
  if (current.length > 0) return;
  persistAuditEvents(seedAuditEvents);
}

function resolvePermissions(role) {
  return rolePermissions[role] ?? rolePermissions.Candidate;
}

function sortUsers(users) {
  return [...users].sort((left, right) => {
    const roleWeight = {
      Administrator: 0,
      DeploymentManager: 1,
      Recruiter: 2,
      Candidate: 3,
    };

    const leftWeight = roleWeight[left.role] ?? 3;
    const rightWeight = roleWeight[right.role] ?? 3;

    if (leftWeight !== rightWeight) {
      return leftWeight - rightWeight;
    }

    return String(left.name || "").localeCompare(String(right.name || ""));
  });
}

export function ensureAdminMockData() {
  ensureDemoAccounts();
  ensureSeedAuditEvents();
}

export function getAdminUsers() {
  ensureAdminMockData();
  return sortUsers(
    getAccounts().map((account) => ({
      ...account,
      permissions: resolvePermissions(account.role),
      locked: account.role === "Administrator" && normalizeEmail(account.email) === "admin@demo.com",
      isArchived: account.status === "Archived",
      scope:
        account.role === "Administrator"
          ? "Platform-wide access"
          : account.role === "DeploymentManager"
            ? "Deployment operations workspace"
          : account.role === "Recruiter"
            ? "Recruiter workspace"
            : "Candidate workspace",
    }))
  );
}

export function getAdminAuditEvents() {
  ensureAdminMockData();
  return readAuditEvents();
}

export function recordAdminAuditEvent(payload) {
  ensureAdminMockData();

  const entry = {
    id: `AUD-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    actor: String(payload?.actor || "System").trim(),
    action: String(payload?.action || "Unknown action").trim(),
    target: String(payload?.target || "").trim(),
    category: String(payload?.category || "system").trim(),
    detail: String(payload?.detail || "").trim(),
  };

  const next = [entry, ...readAuditEvents()];
  persistAuditEvents(next);
  return entry;
}

export function updateAdminUserRole(email, role, actor = "Administrator") {
  ensureAdminMockData();
  const result = updateAccountRole(email, role);

  if (!result.ok) {
    return result;
  }

  const updatedAccount = result.account;
  recordAdminAuditEvent({
    actor,
    action: "Updated account role",
    target: normalizeEmail(email),
    category: "users",
    detail: `${updatedAccount?.name || normalizeEmail(email)} is now ${role}.`,
  });

  return result;
}

export function archiveAdminUser(email, options = {}) {
  ensureAdminMockData();
  const actor = String(options.actor || "Administrator").trim() || "Administrator";
  const archiveReason = String(options.archiveReason || "").trim();
  const result = archiveAccount(email, {
    archivedBy: actor,
    archiveReason,
  });

  if (!result.ok) {
    return result;
  }

  const updatedAccount = result.account;
  recordAdminAuditEvent({
    actor,
    action: "Archived user account",
    target: normalizeEmail(email),
    category: "users",
    detail:
      archiveReason
        ? `${updatedAccount?.name || normalizeEmail(email)} archived. Reason: ${archiveReason}`
        : `${updatedAccount?.name || normalizeEmail(email)} archived.`,
  });

  return result;
}

export function restoreAdminUser(email, actor = "Administrator") {
  ensureAdminMockData();
  const normalizedActor = String(actor || "Administrator").trim() || "Administrator";
  const result = restoreAccount(email);

  if (!result.ok) {
    return result;
  }

  const updatedAccount = result.account;
  recordAdminAuditEvent({
    actor: normalizedActor,
    action: "Restored user account",
    target: normalizeEmail(email),
    category: "users",
    detail: `${updatedAccount?.name || normalizeEmail(email)} restored to active access.`,
  });

  return result;
}
