import { recordAdminAuditEvent } from "./adminMockData";

export const TALENT_POOL_STORAGE_KEY = "ai_resume_screening_admin_talent_pool_v1";
export const DEPLOYMENT_ASSIGNMENTS_STORAGE_KEY =
  "ai_resume_screening_admin_deployment_assignments_v1";

export const talentPoolStatuses = ["Ready", "On Hold", "Deployed", "Archived"];
export const talentAvailabilityStates = ["Available", "Limited", "Unavailable"];
export const deploymentTargetTypes = ["Job", "Department", "Project"];

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeIsoDate(value, fallback = new Date().toISOString()) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString();
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

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function sortByUpdatedAt(items) {
  return [...items].sort(
    (left, right) => Date.parse(right.updatedAt || right.assignedAt || right.addedAt || "") -
      Date.parse(left.updatedAt || left.assignedAt || left.addedAt || "")
  );
}

function normalizeHistoryEntry(entry = {}) {
  return {
    at: normalizeIsoDate(entry.at),
    by: normalizeText(entry.by) || "Administrator",
    action: normalizeText(entry.action) || "Updated",
    detail: normalizeText(entry.detail),
  };
}

function normalizeTalentRecord(raw = {}) {
  const status = talentPoolStatuses.includes(raw.status) ? raw.status : "Ready";
  return {
    id: normalizeText(raw.id) || createId("TP"),
    sourceKey: normalizeText(raw.sourceKey) || "",
    sourceType: normalizeText(raw.sourceType) || "screening",
    sourceApplicationId: normalizeText(raw.sourceApplicationId) || "",
    sourceJobId: normalizeText(raw.sourceJobId) || "",
    sourceJobTitle: normalizeText(raw.sourceJobTitle) || "",
    sourceDepartment: normalizeText(raw.sourceDepartment) || "",
    candidateName: normalizeText(raw.candidateName) || "Candidate",
    candidateEmail: normalizeText(raw.candidateEmail) || "",
    candidateAlias: normalizeText(raw.candidateAlias) || "",
    skills: Array.isArray(raw.skills)
      ? raw.skills.map(normalizeText).filter(Boolean)
      : [],
    score:
      typeof raw.score === "number" && Number.isFinite(raw.score) ? raw.score : 0,
    yearsExperience:
      typeof raw.yearsExperience === "number" && Number.isFinite(raw.yearsExperience)
        ? raw.yearsExperience
        : 0,
    roleFit: normalizeText(raw.roleFit) || normalizeText(raw.sourceJobTitle) || "Open Role",
    availability:
      talentAvailabilityStates.includes(raw.availability) || !normalizeText(raw.availability)
        ? normalizeText(raw.availability) || "Available"
        : "Available",
    location: normalizeText(raw.location) || "Remote",
    adminNotes: normalizeText(raw.adminNotes) || "",
    matchContext: normalizeText(raw.matchContext) || "",
    status,
    addedAt: normalizeIsoDate(raw.addedAt),
    addedBy: normalizeText(raw.addedBy) || "Administrator",
    updatedAt: normalizeIsoDate(raw.updatedAt, normalizeIsoDate(raw.addedAt)),
    updatedBy: normalizeText(raw.updatedBy) || normalizeText(raw.addedBy) || "Administrator",
    archivedAt:
      status === "Archived" && normalizeText(raw.archivedAt)
        ? normalizeIsoDate(raw.archivedAt)
        : "",
    archivedBy: status === "Archived" ? normalizeText(raw.archivedBy) || "Administrator" : "",
    archiveReason: status === "Archived" ? normalizeText(raw.archiveReason) : "",
    currentAssignmentId: normalizeText(raw.currentAssignmentId) || "",
    currentAssignmentTargetType: normalizeText(raw.currentAssignmentTargetType) || "",
    currentAssignmentTargetName: normalizeText(raw.currentAssignmentTargetName) || "",
    currentAssignmentStartDate: normalizeText(raw.currentAssignmentStartDate) || "",
    currentAssignmentEndDate: normalizeText(raw.currentAssignmentEndDate) || "",
    history: Array.isArray(raw.history)
      ? raw.history.map(normalizeHistoryEntry)
      : [],
  };
}

function normalizeAssignment(raw = {}) {
  return {
    id: normalizeText(raw.id) || createId("DP"),
    talentId: normalizeText(raw.talentId) || "",
    targetType: deploymentTargetTypes.includes(raw.targetType) ? raw.targetType : "Project",
    targetId: normalizeText(raw.targetId) || "",
    targetName: normalizeText(raw.targetName) || "Untitled Target",
    startDate: normalizeText(raw.startDate) || "",
    endDate: normalizeText(raw.endDate) || "",
    status: ["Active", "Released", "Archived"].includes(raw.status) ? raw.status : "Active",
    notes: normalizeText(raw.notes) || "",
    assignedAt: normalizeIsoDate(raw.assignedAt),
    assignedBy: normalizeText(raw.assignedBy) || "Administrator",
    updatedAt: normalizeIsoDate(raw.updatedAt, normalizeIsoDate(raw.assignedAt)),
    releasedAt: normalizeText(raw.releasedAt) ? normalizeIsoDate(raw.releasedAt) : "",
    releasedBy: normalizeText(raw.releasedBy) || "",
    archivedAt: normalizeText(raw.archivedAt) ? normalizeIsoDate(raw.archivedAt) : "",
    archivedBy: normalizeText(raw.archivedBy) || "",
    history: Array.isArray(raw.history)
      ? raw.history.map(normalizeHistoryEntry)
      : [],
  };
}

function readTalentPool() {
  return sortByUpdatedAt(
    readJsonArray(TALENT_POOL_STORAGE_KEY).map(normalizeTalentRecord).filter((record) => record.id)
  );
}

function writeTalentPool(records) {
  writeJsonArray(TALENT_POOL_STORAGE_KEY, records);
}

function readAssignments() {
  return sortByUpdatedAt(
    readJsonArray(DEPLOYMENT_ASSIGNMENTS_STORAGE_KEY)
      .map(normalizeAssignment)
      .filter((record) => record.id && record.talentId)
  );
}

function writeAssignments(records) {
  writeJsonArray(DEPLOYMENT_ASSIGNMENTS_STORAGE_KEY, records);
}

function appendTalentHistory(record, actor, action, detail) {
  return {
    ...record,
    history: [
      normalizeHistoryEntry({
        at: new Date().toISOString(),
        by: actor,
        action,
        detail,
      }),
      ...record.history,
    ],
  };
}

function appendAssignmentHistory(assignment, actor, action, detail) {
  return {
    ...assignment,
    history: [
      normalizeHistoryEntry({
        at: new Date().toISOString(),
        by: actor,
        action,
        detail,
      }),
      ...assignment.history,
    ],
    updatedAt: new Date().toISOString(),
  };
}

function findTalentRecord(records, talentId) {
  const normalizedId = normalizeText(talentId);
  return records.find((record) => record.id === normalizedId) ?? null;
}

function findActiveAssignment(assignments, talentId) {
  const normalizedId = normalizeText(talentId);
  return (
    assignments.find((assignment) => assignment.talentId === normalizedId && assignment.status === "Active") ??
    null
  );
}

function isDuplicateSource(records, sourceKey) {
  const normalizedKey = normalizeText(sourceKey);
  if (!normalizedKey) return false;
  return records.some((record) => record.sourceKey === normalizedKey);
}

export function buildSourceKey(source = {}) {
  return (
    normalizeText(source.sourceKey) ||
    normalizeText(source.applicationId) ||
    normalizeText(source.sourceApplicationId) ||
    `${normalizeText(source.jobId)}:${normalizeText(source.candidateName || source.alias)}`
  );
}

function getCurrentDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function getTalentPoolRecords() {
  return readTalentPool();
}

export function getDeploymentAssignments() {
  return readAssignments();
}

export function getTalentAssignmentsForTalent(talentId) {
  const normalizedId = normalizeText(talentId);
  if (!normalizedId) return [];

  return readAssignments().filter((assignment) => assignment.talentId === normalizedId);
}

export function addTalentToPool(source = {}, payload = {}, actor = "Administrator") {
  const pool = readTalentPool();
  const sourceKey = buildSourceKey(source);

  if (isDuplicateSource(pool, sourceKey)) {
    return { ok: false, code: "DUPLICATE", message: "This screened candidate is already in the pool." };
  }

  const now = new Date().toISOString();
  const record = normalizeTalentRecord({
    id: createId("TP"),
    sourceKey,
    sourceType: normalizeText(source.sourceType) || "screening",
    sourceApplicationId: normalizeText(source.applicationId) || normalizeText(source.sourceApplicationId),
    sourceJobId: normalizeText(source.jobId),
    sourceJobTitle: normalizeText(source.jobTitle),
    sourceDepartment: normalizeText(source.department),
    candidateName: normalizeText(source.candidateName || source.alias) || "Candidate",
    candidateEmail: normalizeText(source.candidateEmail),
    candidateAlias: normalizeText(source.candidateAlias || source.alias),
    skills: Array.isArray(source.skills) ? source.skills : [],
    score: typeof source.score === "number" ? source.score : 0,
    yearsExperience: typeof source.yearsExperience === "number" ? source.yearsExperience : 0,
    roleFit: normalizeText(payload.roleFit) || normalizeText(source.jobTitle) || "Open Role",
    availability: talentAvailabilityStates.includes(payload.availability)
      ? payload.availability
      : "Available",
    location: normalizeText(payload.location) || "Remote",
    adminNotes: normalizeText(payload.adminNotes) || "",
    matchContext:
      normalizeText(source.matchContext) ||
      normalizeText(source.justification) ||
      normalizeText(source.matchNotes),
    status: talentPoolStatuses.includes(payload.status) ? payload.status : "Ready",
    addedAt: now,
    addedBy: actor,
    updatedAt: now,
    updatedBy: actor,
    history: [
      {
        at: now,
        by: actor,
        action: "Added to pool",
        detail: `Imported from ${normalizeText(source.jobTitle) || "screening data"}.`,
      },
    ],
  });

  const next = [record, ...pool];
  writeTalentPool(next);

  recordAdminAuditEvent({
    actor,
    action: "Added talent to pool",
    target: record.id,
    category: "workforce",
    detail: `${record.candidateName} added from ${record.sourceJobTitle || "screening data"}.`,
  });

  return { ok: true, record };
}

export function updateTalentRecord(talentId, updates = {}, actor = "Administrator") {
  const pool = readTalentPool();
  const record = findTalentRecord(pool, talentId);

  if (!record) {
    return { ok: false, message: "Talent record not found." };
  }

  const nextRecord = {
    ...record,
    roleFit: normalizeText(updates.roleFit) || record.roleFit,
    availability:
      talentAvailabilityStates.includes(updates.availability) || !normalizeText(updates.availability)
        ? normalizeText(updates.availability) || record.availability
        : record.availability,
    location: normalizeText(updates.location) || record.location,
    adminNotes: normalizeText(updates.adminNotes) || record.adminNotes,
    updatedAt: new Date().toISOString(),
    updatedBy: actor,
  };

  const changedFields = [];
  ["roleFit", "availability", "location", "adminNotes"].forEach((key) => {
    if (nextRecord[key] !== record[key]) {
      changedFields.push(key);
    }
  });

  if (changedFields.length > 0) {
    nextRecord.history = [
      {
        at: nextRecord.updatedAt,
        by: actor,
        action: "Updated talent details",
        detail: `Changed ${changedFields.join(", ")}.`,
      },
      ...record.history,
    ];
  }

  const next = pool.map((item) => (item.id === record.id ? nextRecord : item));
  writeTalentPool(next);

  if (changedFields.length > 0) {
    recordAdminAuditEvent({
      actor,
      action: "Updated talent record",
      target: record.id,
      category: "workforce",
      detail: `${record.candidateName} updated (${changedFields.join(", ")}).`,
    });
  }

  return { ok: true, record: nextRecord };
}

export function updateTalentStatus(talentId, status, actor = "Administrator", note = "") {
  const normalizedStatus = talentPoolStatuses.includes(status) ? status : "";
  if (!normalizedStatus) {
    return { ok: false, message: "Unsupported talent status." };
  }

  const pool = readTalentPool();
  const record = findTalentRecord(pool, talentId);

  if (!record) {
    return { ok: false, message: "Talent record not found." };
  }

  if (record.status === normalizedStatus) {
    return { ok: true, record };
  }

  const now = new Date().toISOString();
  const nextRecord = appendTalentHistory(
    {
      ...record,
      status: normalizedStatus,
      updatedAt: now,
      updatedBy: actor,
      archivedAt: normalizedStatus === "Archived" ? now : "",
      archivedBy: normalizedStatus === "Archived" ? actor : "",
      archiveReason: normalizedStatus === "Archived" ? normalizeText(note) : "",
    },
    actor,
    "Updated status",
    normalizeText(note) || `Status changed to ${normalizedStatus}.`
  );

  const next = pool.map((item) => (item.id === record.id ? nextRecord : item));
  writeTalentPool(next);

  recordAdminAuditEvent({
    actor,
    action: "Changed talent status",
    target: record.id,
    category: "workforce",
    detail: `${record.candidateName} set to ${normalizedStatus}.${normalizeText(note) ? ` Note: ${normalizeText(note)}` : ""}`,
  });

  return { ok: true, record: nextRecord };
}

export function assignTalentToTarget(talentId, payload = {}, actor = "Administrator") {
  const targetType = deploymentTargetTypes.includes(payload.targetType)
    ? payload.targetType
    : "Project";
  const targetName = normalizeText(payload.targetName);
  if (!targetName) {
    return { ok: false, message: "Target name is required." };
  }

  const pool = readTalentPool();
  const assignments = readAssignments();
  const record = findTalentRecord(pool, talentId);

  if (!record) {
    return { ok: false, message: "Talent record not found." };
  }

  if (record.status === "Archived") {
    return { ok: false, message: "Archived talent cannot be deployed." };
  }

  const existingActive = findActiveAssignment(assignments, talentId);
  const now = new Date().toISOString();
  const assignment = normalizeAssignment({
    id: createId("DP"),
    talentId: record.id,
    targetType,
    targetId: normalizeText(payload.targetId) || targetName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    targetName,
    startDate: normalizeText(payload.startDate) || getCurrentDateStamp(),
    endDate: normalizeText(payload.endDate),
    status: "Active",
    notes: normalizeText(payload.notes) || "",
    assignedAt: now,
    assignedBy: actor,
    updatedAt: now,
    history: [
      {
        at: now,
        by: actor,
        action: "Assignment created",
        detail: `Assigned to ${targetType}: ${targetName}.`,
      },
    ],
  });

  let nextAssignments = assignments;
  let actionLabel = "Assigned talent";

  if (existingActive) {
    actionLabel = "Reassigned talent";
    const releasedExisting = appendAssignmentHistory(
      {
        ...existingActive,
        status: "Released",
        endDate: existingActive.endDate || getCurrentDateStamp(),
        releasedAt: now,
        releasedBy: actor,
      },
      actor,
      "Reassigned",
      `Moved to ${targetType}: ${targetName}.`
    );

    nextAssignments = nextAssignments.map((item) =>
      item.id === existingActive.id ? releasedExisting : item
    );
  }

  nextAssignments = [assignment, ...nextAssignments];
  writeAssignments(nextAssignments);

  const nextRecord = appendTalentHistory(
    {
      ...record,
      status: "Deployed",
      updatedAt: now,
      updatedBy: actor,
      currentAssignmentId: assignment.id,
      currentAssignmentTargetType: targetType,
      currentAssignmentTargetName: targetName,
      currentAssignmentStartDate: assignment.startDate,
      currentAssignmentEndDate: assignment.endDate,
    },
    actor,
    actionLabel,
    `Assigned to ${targetType}: ${targetName}.`
  );

  const nextPool = pool.map((item) => (item.id === record.id ? nextRecord : item));
  writeTalentPool(nextPool);

  recordAdminAuditEvent({
    actor,
    action: actionLabel,
    target: record.id,
    category: "workforce",
    detail: `${record.candidateName} deployed to ${targetType}: ${targetName}.`,
  });

  return { ok: true, record: nextRecord, assignment };
}

export function releaseTalentFromAssignment(talentId, actor = "Administrator", note = "") {
  const pool = readTalentPool();
  const assignments = readAssignments();
  const record = findTalentRecord(pool, talentId);
  const activeAssignment = findActiveAssignment(assignments, talentId);

  if (!record) {
    return { ok: false, message: "Talent record not found." };
  }

  if (!activeAssignment) {
    return { ok: false, message: "No active deployment found for this talent." };
  }

  const now = new Date().toISOString();
  const releasedAssignment = appendAssignmentHistory(
    {
      ...activeAssignment,
      status: "Released",
      endDate: activeAssignment.endDate || getCurrentDateStamp(),
      releasedAt: now,
      releasedBy: actor,
    },
    actor,
    "Released",
    normalizeText(note) || "Deployment released."
  );

  const nextAssignments = assignments.map((item) =>
    item.id === activeAssignment.id ? releasedAssignment : item
  );
  writeAssignments(nextAssignments);

  const nextStatus = record.status === "Archived" ? "Archived" : "Ready";
  const nextRecord = appendTalentHistory(
    {
      ...record,
      status: nextStatus,
      updatedAt: now,
      updatedBy: actor,
      currentAssignmentId: "",
      currentAssignmentTargetType: "",
      currentAssignmentTargetName: "",
      currentAssignmentStartDate: "",
      currentAssignmentEndDate: "",
    },
    actor,
    "Released deployment",
    normalizeText(note) || `Released from ${activeAssignment.targetType}: ${activeAssignment.targetName}.`
  );

  const nextPool = pool.map((item) => (item.id === record.id ? nextRecord : item));
  writeTalentPool(nextPool);

  recordAdminAuditEvent({
    actor,
    action: "Released talent",
    target: record.id,
    category: "workforce",
    detail: `${record.candidateName} released from ${activeAssignment.targetType}: ${activeAssignment.targetName}.`,
  });

  return { ok: true, record: nextRecord, assignment: releasedAssignment };
}

export function archiveTalentRecord(talentId, actor = "Administrator", reason = "") {
  const pool = readTalentPool();
  const assignments = readAssignments();
  const record = findTalentRecord(pool, talentId);

  if (!record) {
    return { ok: false, message: "Talent record not found." };
  }

  const now = new Date().toISOString();
  const activeAssignment = findActiveAssignment(assignments, talentId);
  let nextAssignments = assignments;

  if (activeAssignment) {
    const archivedAssignment = appendAssignmentHistory(
      {
        ...activeAssignment,
        status: "Archived",
        endDate: activeAssignment.endDate || getCurrentDateStamp(),
        archivedAt: now,
        archivedBy: actor,
      },
      actor,
      "Archived assignment",
      `Talent archived. ${normalizeText(reason) || "Assignment closed."}`
    );

    nextAssignments = nextAssignments.map((item) =>
      item.id === activeAssignment.id ? archivedAssignment : item
    );
    writeAssignments(nextAssignments);
  }

  const nextRecord = appendTalentHistory(
    {
      ...record,
      status: "Archived",
      updatedAt: now,
      updatedBy: actor,
      archivedAt: now,
      archivedBy: actor,
      archiveReason: normalizeText(reason),
      currentAssignmentId: "",
      currentAssignmentTargetType: "",
      currentAssignmentTargetName: "",
      currentAssignmentStartDate: "",
      currentAssignmentEndDate: "",
    },
    actor,
    "Archived talent record",
    normalizeText(reason) || "Talent record archived."
  );

  const nextPool = pool.map((item) => (item.id === record.id ? nextRecord : item));
  writeTalentPool(nextPool);

  recordAdminAuditEvent({
    actor,
    action: "Archived talent record",
    target: record.id,
    category: "workforce",
    detail: `${record.candidateName} archived.${normalizeText(reason) ? ` Reason: ${normalizeText(reason)}` : ""}`,
  });

  return { ok: true, record: nextRecord };
}

export function getTalentWorkforceSnapshot() {
  const pool = readTalentPool();
  const assignments = readAssignments();
  return {
    pool,
    assignments,
    activeAssignments: assignments.filter((assignment) => assignment.status === "Active"),
    deployed: pool.filter((record) => record.status === "Deployed"),
  };
}
