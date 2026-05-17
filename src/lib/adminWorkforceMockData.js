import { recordAdminAuditEvent } from "./adminMockData.js";

export const TALENT_POOL_STORAGE_KEY = "ai_resume_screening_admin_talent_pool_v1";
export const DEPLOYMENT_ASSIGNMENTS_STORAGE_KEY =
  "ai_resume_screening_admin_deployment_assignments_v1";
export const DEPLOYMENT_REQUESTS_STORAGE_KEY =
  "ai_resume_screening_admin_deployment_requests_v1";

export const talentPoolStatuses = ["Ready", "On Hold", "Deployed", "Archived"];
export const talentAvailabilityStates = ["Available", "Limited", "Unavailable"];
export const deploymentTargetTypes = ["Job", "Department", "Project"];
export const deploymentRequestStatuses = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Rejected",
  "Assigned",
];
export const deploymentUrgencyLevels = ["Low", "Medium", "High", "Critical"];

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

function normalizeRequestHistoryEntry(entry = {}) {
  return normalizeHistoryEntry(entry);
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
    requestId: normalizeText(raw.requestId) || "",
    requestStatus: normalizeText(raw.requestStatus) || "",
    requester: normalizeText(raw.requester) || "",
    requesterEmail: normalizeText(raw.requesterEmail) || "",
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
    approvedAt: normalizeText(raw.approvedAt) ? normalizeIsoDate(raw.approvedAt) : "",
    approvedBy: normalizeText(raw.approvedBy) || "",
    approvalNotes: normalizeText(raw.approvalNotes) || "",
    releasedAt: normalizeText(raw.releasedAt) ? normalizeIsoDate(raw.releasedAt) : "",
    releasedBy: normalizeText(raw.releasedBy) || "",
    archivedAt: normalizeText(raw.archivedAt) ? normalizeIsoDate(raw.archivedAt) : "",
    archivedBy: normalizeText(raw.archivedBy) || "",
    history: Array.isArray(raw.history)
      ? raw.history.map(normalizeHistoryEntry)
      : [],
  };
}

function normalizeDeploymentRequest(raw = {}) {
  const status = deploymentRequestStatuses.includes(raw.status) ? raw.status : "Draft";
  const targetType = deploymentTargetTypes.includes(raw.targetType) ? raw.targetType : "Project";
  const history = Array.isArray(raw.history) ? raw.history.map(normalizeRequestHistoryEntry) : [];

  return {
    id: normalizeText(raw.id) || createId("DR"),
    talentId: normalizeText(raw.talentId) || "",
    talentName: normalizeText(raw.talentName) || "Candidate",
    talentEmail: normalizeText(raw.talentEmail) || "",
    talentSkills: Array.isArray(raw.talentSkills)
      ? raw.talentSkills.map(normalizeText).filter(Boolean)
      : [],
    sourceJobId: normalizeText(raw.sourceJobId) || "",
    sourceJobTitle: normalizeText(raw.sourceJobTitle) || "",
    sourceDepartment: normalizeText(raw.sourceDepartment) || "",
    targetType,
    targetId: normalizeText(raw.targetId) || "",
    targetName: normalizeText(raw.targetName) || "Unspecified target",
    department: normalizeText(raw.department) || "",
    location: normalizeText(raw.location) || "",
    urgency: deploymentUrgencyLevels.includes(raw.urgency) ? raw.urgency : "Medium",
    startDate: normalizeText(raw.startDate) || "",
    endDate: normalizeText(raw.endDate) || "",
    justification: normalizeText(raw.justification) || "",
    requester: normalizeText(raw.requester) || "Recruiter",
    requesterEmail: normalizeText(raw.requesterEmail).toLowerCase() || "",
    requesterRole: normalizeText(raw.requesterRole) || "Recruiter",
    status,
    createdAt: normalizeIsoDate(raw.createdAt),
    updatedAt: normalizeIsoDate(raw.updatedAt, normalizeIsoDate(raw.createdAt)),
    submittedAt: normalizeText(raw.submittedAt) ? normalizeIsoDate(raw.submittedAt) : "",
    submittedBy: normalizeText(raw.submittedBy) || "",
    approvedAt: normalizeText(raw.approvedAt) ? normalizeIsoDate(raw.approvedAt) : "",
    approvedBy: normalizeText(raw.approvedBy) || "",
    approvalNotes: normalizeText(raw.approvalNotes) || "",
    rejectedAt: normalizeText(raw.rejectedAt) ? normalizeIsoDate(raw.rejectedAt) : "",
    rejectedBy: normalizeText(raw.rejectedBy) || "",
    rejectionReason: normalizeText(raw.rejectionReason) || "",
    assignmentId: normalizeText(raw.assignmentId) || "",
    assignmentStatus: normalizeText(raw.assignmentStatus) || "",
    archivedAt: normalizeText(raw.archivedAt) ? normalizeIsoDate(raw.archivedAt) : "",
    archivedBy: normalizeText(raw.archivedBy) || "",
    archiveReason: normalizeText(raw.archiveReason) || "",
    history,
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

function readRequests() {
  return sortByUpdatedAt(
    readJsonArray(DEPLOYMENT_REQUESTS_STORAGE_KEY)
      .map(normalizeDeploymentRequest)
      .filter((record) => record.id && record.talentId)
  );
}

function writeRequests(records) {
  writeJsonArray(DEPLOYMENT_REQUESTS_STORAGE_KEY, records);
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

function appendRequestHistory(request, actor, action, detail) {
  return {
    ...request,
    history: [
      normalizeRequestHistoryEntry({
        at: new Date().toISOString(),
        by: actor,
        action,
        detail,
      }),
      ...request.history,
    ],
    updatedAt: new Date().toISOString(),
  };
}

function findTalentRecord(records, talentId) {
  const normalizedId = normalizeText(talentId);
  return records.find((record) => record.id === normalizedId) ?? null;
}

function findRequestRecord(records, requestId) {
  const normalizedId = normalizeText(requestId);
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

export function getDeploymentRequests() {
  return readRequests();
}

export function getTalentAssignmentsForTalent(talentId) {
  const normalizedId = normalizeText(talentId);
  if (!normalizedId) return [];

  return readAssignments().filter((assignment) => assignment.talentId === normalizedId);
}

export function getDeploymentRequestsForTalent(talentId) {
  const normalizedId = normalizeText(talentId);
  if (!normalizedId) return [];

  return readRequests().filter((request) => request.talentId === normalizedId);
}

export function getDeploymentRequestsForRequester(requesterEmail) {
  const normalizedEmail = normalizeText(requesterEmail).toLowerCase();
  if (!normalizedEmail) return [];

  return readRequests().filter(
    (request) => normalizeText(request.requesterEmail).toLowerCase() === normalizedEmail
  );
}

export function getDeploymentRequestById(requestId) {
  return findRequestRecord(readRequests(), requestId);
}

export function createDeploymentRequest(talentId, payload = {}, actor = "Recruiter") {
  const pool = readTalentPool();
  const requests = readRequests();
  const record = findTalentRecord(pool, talentId);

  if (!record) {
    return { ok: false, message: "Talent record not found." };
  }

  const now = new Date().toISOString();
  const request = normalizeDeploymentRequest({
    id: createId("DR"),
    talentId: record.id,
    talentName: record.candidateName,
    talentEmail: record.candidateEmail,
    talentSkills: record.skills,
    sourceJobId: record.sourceJobId,
    sourceJobTitle: record.sourceJobTitle,
    sourceDepartment: record.sourceDepartment,
    targetType: payload.targetType,
    targetId: normalizeText(payload.targetId) || "",
    targetName: normalizeText(payload.targetName) || "",
    department: normalizeText(payload.department) || record.sourceDepartment || "",
    location: normalizeText(payload.location) || record.location || "",
    urgency: payload.urgency,
    startDate: normalizeText(payload.startDate) || "",
    endDate: normalizeText(payload.endDate) || "",
    justification: normalizeText(payload.justification) || "",
    requester: normalizeText(payload.requester) || actor,
    requesterEmail: normalizeText(payload.requesterEmail).toLowerCase() || "",
    requesterRole: normalizeText(payload.requesterRole) || "Recruiter",
    status: "Draft",
    createdAt: now,
    updatedAt: now,
    history: [
      {
        at: now,
        by: actor,
        action: "Draft created",
        detail: `Drafted a deployment request for ${record.candidateName}.`,
      },
    ],
  });

  const next = [request, ...requests];
  writeRequests(next);

  recordAdminAuditEvent({
    actor,
    action: "Created deployment request",
    target: record.id,
    category: "workforce",
    detail: `${record.candidateName} drafted for deployment.`,
  });

  return { ok: true, request };
}

export function updateDeploymentRequest(requestId, payload = {}, actor = "Recruiter") {
  const requests = readRequests();
  const request = findRequestRecord(requests, requestId);

  if (!request) {
    return { ok: false, message: "Deployment request not found." };
  }

  if (request.status === "Assigned") {
    return { ok: false, message: "Assigned requests cannot be edited." };
  }

  const nextRequest = appendRequestHistory(
    {
      ...request,
      targetType: deploymentTargetTypes.includes(payload.targetType)
        ? payload.targetType
        : request.targetType,
      targetId: normalizeText(payload.targetId) || request.targetId,
      targetName: normalizeText(payload.targetName) || request.targetName,
      department: normalizeText(payload.department) || request.department,
      location: normalizeText(payload.location) || request.location,
      urgency: deploymentUrgencyLevels.includes(payload.urgency)
        ? payload.urgency
        : request.urgency,
      startDate: normalizeText(payload.startDate) || request.startDate,
      endDate: normalizeText(payload.endDate) || request.endDate,
      justification: normalizeText(payload.justification) || request.justification,
      updatedAt: new Date().toISOString(),
    },
    actor,
    "Updated request",
    `Updated the deployment request for ${request.talentName}.`
  );

  const next = requests.map((item) => (item.id === request.id ? nextRequest : item));
  writeRequests(next);

  return { ok: true, request: nextRequest };
}

export function submitDeploymentRequest(requestId, actor = "Recruiter") {
  const requests = readRequests();
  const request = findRequestRecord(requests, requestId);

  if (!request) {
    return { ok: false, message: "Deployment request not found." };
  }

  if (request.status === "Assigned") {
    return { ok: false, message: "Assigned requests cannot be resubmitted." };
  }

  if (!normalizeText(request.targetName) || !normalizeText(request.justification)) {
    return { ok: false, message: "Target and justification are required before submission." };
  }

  const now = new Date().toISOString();
  const nextRequest = appendRequestHistory(
    {
      ...request,
      status: "Pending Approval",
      submittedAt: now,
      submittedBy: actor,
      updatedAt: now,
    },
    actor,
    "Submitted for approval",
    `Submitted by ${actor} for admin review.`
  );

  const next = requests.map((item) => (item.id === request.id ? nextRequest : item));
  writeRequests(next);

  recordAdminAuditEvent({
    actor,
    action: "Submitted deployment request",
    target: request.talentId,
    category: "workforce",
    detail: `${request.talentName} sent for approval to ${request.targetType}: ${request.targetName}.`,
  });

  return { ok: true, request: nextRequest };
}

export function rejectDeploymentRequest(requestId, reason = "", actor = "Administrator") {
  const requests = readRequests();
  const request = findRequestRecord(requests, requestId);

  if (!request) {
    return { ok: false, message: "Deployment request not found." };
  }

  const now = new Date().toISOString();
  const nextRequest = appendRequestHistory(
    {
      ...request,
      status: "Rejected",
      rejectedAt: now,
      rejectedBy: actor,
      rejectionReason: normalizeText(reason),
      updatedAt: now,
    },
    actor,
    "Rejected request",
    normalizeText(reason) || `Rejected deployment request for ${request.talentName}.`
  );

  const next = requests.map((item) => (item.id === request.id ? nextRequest : item));
  writeRequests(next);

  recordAdminAuditEvent({
    actor,
    action: "Rejected deployment request",
    target: request.talentId,
    category: "workforce",
    detail: `${request.talentName} rejected.${normalizeText(reason) ? ` Reason: ${normalizeText(reason)}` : ""}`,
  });

  return { ok: true, request: nextRequest };
}

export function approveDeploymentRequest(requestId, payload = {}, actor = "Administrator") {
  const requests = readRequests();
  const request = findRequestRecord(requests, requestId);

  if (!request) {
    return { ok: false, message: "Deployment request not found." };
  }

  const now = new Date().toISOString();
  const approvalNotes = normalizeText(payload.approvalNotes) || request.justification;
  const approvedRequest = appendRequestHistory(
    {
      ...request,
      status: payload.materializeImmediately === false ? "Approved" : "Approved",
      approvedAt: now,
      approvedBy: actor,
      approvalNotes,
      updatedAt: now,
    },
    actor,
    "Approved request",
    approvalNotes ? `Approved by ${actor}. ${approvalNotes}` : `Approved by ${actor}.`
  );

  const updatedRequests = requests.map((item) => (item.id === request.id ? approvedRequest : item));
  writeRequests(updatedRequests);

  let assignmentResult = null;

  if (payload.materializeImmediately !== false) {
    assignmentResult = assignTalentToTarget(
      request.talentId,
      {
        targetType: request.targetType,
        targetId: normalizeText(payload.targetId) || request.targetId || request.targetName,
        targetName: normalizeText(payload.targetName) || request.targetName,
        startDate: normalizeText(payload.startDate) || request.startDate,
        endDate: normalizeText(payload.endDate) || request.endDate,
        notes: normalizeText(payload.assignmentNotes) || approvalNotes,
        requestId: request.id,
        requestStatus: "Assigned",
        requester: request.requester,
        requesterEmail: request.requesterEmail,
        approvedAt: now,
        approvedBy: actor,
        approvalNotes,
      },
      actor
    );

    if (!assignmentResult.ok) {
      return assignmentResult;
    }

    const finalizedRequest = appendRequestHistory(
      {
        ...approvedRequest,
        status: "Assigned",
        assignmentId: assignmentResult.assignment.id,
        assignmentStatus: assignmentResult.assignment.status,
        updatedAt: new Date().toISOString(),
      },
      actor,
      "Assigned request",
      `Assigned to ${request.targetType}: ${request.targetName}.`
    );

    const finalizedRequests = updatedRequests.map((item) =>
      item.id === request.id ? finalizedRequest : item
    );
    writeRequests(finalizedRequests);

    recordAdminAuditEvent({
      actor,
      action: "Assigned deployment request",
      target: request.talentId,
      category: "workforce",
      detail: `${request.talentName} assigned to ${request.targetType}: ${request.targetName}.`,
    });

    return { ok: true, request: finalizedRequest, assignment: assignmentResult.assignment };
  }

  recordAdminAuditEvent({
    actor,
    action: "Approved deployment request",
    target: request.talentId,
    category: "workforce",
    detail: `${request.talentName} approved for ${request.targetType}: ${request.targetName}.`,
  });

  return { ok: true, request: approvedRequest };
}

export function convertDeploymentRequestToAssignment(requestId, payload = {}, actor = "Administrator") {
  return approveDeploymentRequest(requestId, { ...payload, materializeImmediately: true }, actor);
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
  const requests = readRequests();
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

  const linkedRequestId = normalizeText(payload.requestId) || normalizeText(existingActive?.requestId);

  if (linkedRequestId) {
    const linkedRequest = findRequestRecord(requests, linkedRequestId);
    if (linkedRequest) {
      const nextLinkedRequest = appendRequestHistory(
        {
          ...linkedRequest,
          status: "Assigned",
          assignmentId: assignment.id,
          assignmentStatus: assignment.status,
          approvedAt: normalizeText(payload.approvedAt) ? normalizeIsoDate(payload.approvedAt) : linkedRequest.approvedAt,
          approvedBy: normalizeText(payload.approvedBy) || linkedRequest.approvedBy,
          approvalNotes: normalizeText(payload.approvalNotes) || linkedRequest.approvalNotes,
          updatedAt: now,
        },
        actor,
        "Assigned request",
        `Assigned to ${targetType}: ${targetName}.`
      );

      writeRequests(
        requests.map((item) => (item.id === linkedRequest.id ? nextLinkedRequest : item))
      );
    }
  }

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
  const requests = readRequests();
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

  if (activeAssignment.requestId) {
    const linkedRequest = findRequestRecord(requests, activeAssignment.requestId);
    if (linkedRequest) {
      const nextLinkedRequest = appendRequestHistory(
        {
          ...linkedRequest,
          assignmentStatus: "Released",
          updatedAt: now,
        },
        actor,
        "Released assignment",
        normalizeText(note) ||
          `Released from ${activeAssignment.targetType}: ${activeAssignment.targetName}.`
      );

      writeRequests(
        requests.map((item) =>
          item.id === linkedRequest.id ? nextLinkedRequest : item
        )
      );
    }
  }

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
  const requests = readRequests();
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

    if (activeAssignment.requestId) {
      const linkedRequest = findRequestRecord(requests, activeAssignment.requestId);
      if (linkedRequest) {
        const nextLinkedRequest = appendRequestHistory(
          {
            ...linkedRequest,
            assignmentStatus: "Archived",
            updatedAt: now,
          },
          actor,
          "Archived assignment",
          normalizeText(reason) || "Deployment archived from workforce planning."
        );

        writeRequests(
          requests.map((item) =>
            item.id === linkedRequest.id ? nextLinkedRequest : item
          )
        );
      }
    }
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
  const requests = readRequests();
  return {
    pool,
    assignments,
    requests,
    activeAssignments: assignments.filter((assignment) => assignment.status === "Active"),
    pendingRequests: requests.filter((request) => request.status === "Pending Approval"),
    deployed: pool.filter((record) => record.status === "Deployed"),
  };
}

function hasSeedableStorageValue(key) {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

function addDaysIsoDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

export function ensureAdminWorkforceSeedData(actor = "System") {
  if (typeof window === "undefined") return;

  const alreadyHasData =
    hasSeedableStorageValue(TALENT_POOL_STORAGE_KEY) ||
    hasSeedableStorageValue(DEPLOYMENT_REQUESTS_STORAGE_KEY) ||
    hasSeedableStorageValue(DEPLOYMENT_ASSIGNMENTS_STORAGE_KEY);

  if (alreadyHasData) return;

  const sources = [
    {
      jobId: "JOB-OPS-01",
      jobTitle: "Field Technician",
      department: "Operations",
      candidateName: "Marco Reyes",
      candidateEmail: "marco.reyes@demo.com",
      skills: ["Safety", "Logistics", "Maintenance"],
      score: 91,
      yearsExperience: 6,
      matchContext: "Strong operations fit; ready for field deployment.",
    },
    {
      jobId: "JOB-IT-02",
      jobTitle: "Network Engineer",
      department: "IT",
      candidateName: "Aisha Khan",
      candidateEmail: "aisha.khan@demo.com",
      skills: ["Networking", "Cisco", "Troubleshooting"],
      score: 86,
      yearsExperience: 5,
      matchContext: "Good technical baseline; awaiting onboarding clearance.",
      seedStatus: "On Hold",
    },
    {
      jobId: "JOB-ENG-03",
      jobTitle: "Project Coordinator",
      department: "Engineering",
      candidateName: "Lia Chen",
      candidateEmail: "lia.chen@demo.com",
      skills: ["Planning", "Stakeholder Mgmt", "Reporting"],
      score: 88,
      yearsExperience: 4,
      matchContext: "Client-ready coordinator for engineering delivery teams.",
    },
    {
      jobId: "JOB-COMP-04",
      jobTitle: "Compliance Specialist",
      department: "Compliance",
      candidateName: "Noah Cruz",
      candidateEmail: "noah.cruz@demo.com",
      skills: ["Audits", "Documentation", "Risk"],
      score: 83,
      yearsExperience: 3,
      matchContext: "Strong attention to detail; suitable for records compliance.",
    },
  ];

  const addedTalent = sources
    .map((source) => {
      const result = addTalentToPool(
        source,
        {
          status: source.seedStatus || "Ready",
          roleFit: source.jobTitle,
          location: "Remote",
        },
        actor
      );
      return result.ok ? result.record : null;
    })
    .filter(Boolean);

  const marco = addedTalent.find((record) => record.candidateEmail === "marco.reyes@demo.com");
  const lia = addedTalent.find((record) => record.candidateEmail === "lia.chen@demo.com");

  if (marco) {
    const request = createDeploymentRequest(
      marco.id,
      {
        targetType: "Project",
        targetName: "Project Aurora",
        urgency: "High",
        startDate: addDaysIsoDate(0),
        endDate: addDaysIsoDate(10),
        justification: "Expedite field readiness for upcoming client go-live.",
        requester: "Demo Recruiter",
        requesterEmail: "recruiter@demo.com",
        requesterRole: "Recruiter",
      },
      actor
    );

    if (request.ok) {
      submitDeploymentRequest(request.request.id, actor);
    }
  }

  if (lia) {
    const request = createDeploymentRequest(
      lia.id,
      {
        targetType: "Project",
        targetName: "Client Solace",
        urgency: "Medium",
        startDate: addDaysIsoDate(-3),
        endDate: addDaysIsoDate(24),
        justification: "Backfill coordinator role for active engineering engagement.",
        requester: "Demo Recruiter",
        requesterEmail: "recruiter@demo.com",
        requesterRole: "Recruiter",
      },
      actor
    );

    if (request.ok) {
      submitDeploymentRequest(request.request.id, actor);
      approveDeploymentRequest(
        request.request.id,
        {
          materializeImmediately: true,
          approvalNotes: "Approved for deployment assignment seeding.",
        },
        actor
      );
    }
  }
}
