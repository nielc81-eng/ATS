/**
 * Internal Mobility and Redeployment helpers.
 * Pure functions only; no direct storage or UI side effects.
 */

export const REDEPLOYMENT_STATUSES = [
  "NotRequested",
  "RequestSubmitted",
  "UnderReview",
  "Matched",
  "Shortlisted",
  "ProposedToClient",
  "Assigned",
  "Declined",
];

const REDEPLOYMENT_TRANSITIONS = {
  NotRequested: new Set(["RequestSubmitted"]),
  RequestSubmitted: new Set(["UnderReview", "Declined"]),
  UnderReview: new Set(["Matched", "Shortlisted", "Declined"]),
  Matched: new Set(["Shortlisted", "ProposedToClient", "Declined"]),
  Shortlisted: new Set(["ProposedToClient", "Declined"]),
  ProposedToClient: new Set(["Assigned", "Declined"]),
  Assigned: new Set([]),
  Declined: new Set([]),
};

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value, fallback = "") {
  const next = String(value || "").trim();
  return next || fallback;
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function clampNumber(value, min, max, fallback) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function toDateValue(value) {
  const parsed = Date.parse(String(value || ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function recordLastUpdatedAt(record = {}) {
  const history = ensureArray(record.history);
  if (history.length === 0) return 0;
  return history.reduce((latest, entry) => Math.max(latest, toDateValue(entry?.updatedAt)), 0);
}

function uniqStable(items) {
  const seen = new Set();
  const result = [];
  for (const item of ensureArray(items)) {
    const key = String(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function normalizeHistoryEntry(entry = {}) {
  return {
    updatedAt: normalizeText(entry.updatedAt, new Date().toISOString()),
    updatedByRole: normalizeText(entry.updatedByRole, "System"),
    changeType: normalizeText(entry.changeType, "update"),
    summary: normalizeText(entry.summary, "Record updated"),
  };
}

function appendHistory(record = {}, entry = {}) {
  return [...ensureArray(record.history), normalizeHistoryEntry(entry)];
}

function normalizeStatus(status, fallback = "Deployed") {
  const value = normalizeText(status, fallback);
  return value || fallback;
}

function normalizeRedeploymentStatus(value, fallback = "NotRequested") {
  const next = normalizeText(value, fallback);
  return REDEPLOYMENT_STATUSES.includes(next) ? next : fallback;
}

function normalizeSkills(value) {
  return uniqStable(
    ensureArray(value)
      .map((item) => normalizeText(item))
      .filter(Boolean)
  );
}

function nextCandidateRecordId(records = []) {
  const existingIds = new Set(ensureArray(records).map((item) => normalizeText(item?.id)));
  let counter = ensureArray(records).length + 1;
  let next = `IM-APPLICANT-${String(counter).padStart(4, "0")}`;
  while (existingIds.has(next)) {
    counter += 1;
    next = `IM-APPLICANT-${String(counter).padStart(4, "0")}`;
  }
  return next;
}

function normalizeRequestMeta(meta = {}) {
  return {
    requestedAt: normalizeText(meta.requestedAt),
    availabilityDate: normalizeText(meta.availabilityDate),
    desiredRole: normalizeText(meta.desiredRole),
    preferredClientType: normalizeText(meta.preferredClientType),
    locationPreference: normalizeText(meta.locationPreference),
    compensationBand: normalizeText(meta.compensationBand),
    applicantNote: normalizeText(meta.applicantNote),
  };
}

function normalizeMatchMeta(meta = {}) {
  const score = clampNumber(meta.matchScore, 0, 100, null);
  return {
    matchScore: score === null ? null : Number(score.toFixed(1)),
    ratingImpact:
      meta.ratingImpact === "high" || meta.ratingImpact === "medium" || meta.ratingImpact === "low"
        ? meta.ratingImpact
        : "",
    rationale: normalizeText(meta.rationale),
    lastMatchedAt: normalizeText(meta.lastMatchedAt),
    matchedBy: normalizeText(meta.matchedBy),
    batchRunId: normalizeText(meta.batchRunId),
  };
}

export function normalizeInternalRating(internalRating) {
  const raw = internalRating && typeof internalRating === "object" ? internalRating : {};
  const scale = 5;
  const overall = clampNumber(raw.overall, 1, 5, 3);
  const dimensionsRaw = raw.dimensions && typeof raw.dimensions === "object" ? raw.dimensions : {};
  const dimensions = Object.entries(dimensionsRaw).reduce((acc, [key, value]) => {
    const nextKey = normalizeText(key);
    if (!nextKey) return acc;
    acc[nextKey] = clampNumber(value, 1, 5, 3);
    return acc;
  }, {});
  const notes = ensureArray(raw.notes)
    .map((item) => normalizeText(item))
    .filter(Boolean);

  return { overall, scale, dimensions, notes };
}

export function normalizeMobilityRecord(record = {}) {
  const deploymentStatus = normalizeStatus(record.deploymentStatus, "Deployed");
  const currentContractStatus = normalizeStatus(
    record.currentContractStatus,
    deploymentStatus === "Finished" ? "Finished" : deploymentStatus
  );
  const internalRating = normalizeInternalRating(record.internalRating);
  return {
    id: normalizeText(record.id, `IM-${Date.now().toString(36)}`),
    applicantName: normalizeText(record.applicantName, "Applicant"),
    ownerEmail: normalizeEmail(record.ownerEmail),
    skills: normalizeSkills(record.skills),
    deploymentStatus,
    currentContractStatus,
    redeploymentStatus: normalizeRedeploymentStatus(record.redeploymentStatus, "NotRequested"),
    readinessNote: normalizeText(record.readinessNote),
    requestMeta: normalizeRequestMeta(record.requestMeta),
    matchMeta: normalizeMatchMeta(record.matchMeta),
    internalRating,
    ratingWeight: Number((internalRating.overall / internalRating.scale).toFixed(2)),
    history: ensureArray(record.history).map(normalizeHistoryEntry),
  };
}

function ratingImpactLabel(weight) {
  if (weight >= 0.86) return "high";
  if (weight >= 0.66) return "medium";
  return "low";
}

/**
 * Legacy helper kept for compatibility with existing behaviors:
 * shortlist only finished contract records.
 */
export function getFinishedApplicants(records = []) {
  return ensureArray(records)
    .map((record) => normalizeMobilityRecord(record))
    .filter((record) => record.currentContractStatus === "Finished")
    .sort((left, right) => {
      if (right.internalRating.overall !== left.internalRating.overall) {
        return right.internalRating.overall - left.internalRating.overall;
      }
      return left.applicantName.localeCompare(right.applicantName);
    });
}

export function canTransitionRedeployment(currentStatus, nextStatus) {
  const current = normalizeRedeploymentStatus(currentStatus, "NotRequested");
  const next = normalizeRedeploymentStatus(nextStatus, "");
  if (!next) return false;
  if (current === next) return true;
  return REDEPLOYMENT_TRANSITIONS[current]?.has(next) || false;
}

export function upsertCandidateMobilityProfile(records = [], payload = {}, actor = "Candidate") {
  const currentRecords = ensureArray(records).map((record) => normalizeMobilityRecord(record));
  const targetId = normalizeText(payload.id);
  const ownerEmail = normalizeEmail(payload.ownerEmail);
  const applicantName = normalizeText(payload.applicantName, "Candidate");
  const skills = normalizeSkills(payload.skills);
  const readinessNote = normalizeText(payload.readinessNote);

  const index = currentRecords.findIndex((record) => {
    if (targetId && record.id === targetId) return true;
    if (ownerEmail && record.ownerEmail === ownerEmail) return true;
    return normalizeLower(record.applicantName) === normalizeLower(applicantName);
  });

  if (index === -1) {
    const nextRecord = normalizeMobilityRecord({
      id: nextCandidateRecordId(currentRecords),
      applicantName,
      ownerEmail,
      skills,
      readinessNote,
      deploymentStatus: normalizeStatus(payload.deploymentStatus, "Deployed"),
      currentContractStatus: normalizeStatus(payload.currentContractStatus, "Deployed"),
      redeploymentStatus: "NotRequested",
      history: appendHistory(
        {},
        {
          updatedByRole: "Candidate",
          changeType: "candidate_profile_created",
          summary: `${actor} created redeployment profile`,
        }
      ),
    });
    return { records: [...currentRecords, nextRecord], record: nextRecord };
  }

  const existing = currentRecords[index];
  const updated = normalizeMobilityRecord({
    ...existing,
    applicantName,
    ownerEmail: ownerEmail || existing.ownerEmail,
    skills,
    readinessNote,
    history: appendHistory(existing, {
      updatedByRole: "Candidate",
      changeType: "candidate_profile_updated",
      summary: `${actor} updated skills/readiness`,
    }),
  });
  return {
    records: currentRecords.map((record, rowIndex) => (rowIndex === index ? updated : record)),
    record: updated,
  };
}

export function getOrCreateCandidateRecordByEmail(
  records = [],
  email,
  applicantName = "",
  actor = "Candidate"
) {
  const currentRecords = ensureArray(records).map((record) => normalizeMobilityRecord(record));
  const ownerEmail = normalizeEmail(email);
  const safeName = normalizeText(applicantName, ownerEmail || "Candidate");

  if (!ownerEmail) {
    return {
      records: currentRecords,
      record:
        currentRecords.find((record) => normalizeLower(record.applicantName) === normalizeLower(safeName)) || null,
      created: false,
      migrated: false,
    };
  }

  const ownerMatches = currentRecords
    .map((record, index) => ({ record, index }))
    .filter((entry) => entry.record.ownerEmail === ownerEmail);

  if (ownerMatches.length === 1) {
    return {
      records: currentRecords,
      record: ownerMatches[0].record,
      created: false,
      migrated: false,
    };
  }

  if (ownerMatches.length > 1) {
    const sortedMatches = ownerMatches
      .slice()
      .sort((left, right) => {
        const leftFinished = left.record.currentContractStatus === "Finished" ? 1 : 0;
        const rightFinished = right.record.currentContractStatus === "Finished" ? 1 : 0;
        if (rightFinished !== leftFinished) return rightFinished - leftFinished;
        const leftUpdated = recordLastUpdatedAt(left.record);
        const rightUpdated = recordLastUpdatedAt(right.record);
        if (rightUpdated !== leftUpdated) return rightUpdated - leftUpdated;
        return left.record.applicantName.localeCompare(right.record.applicantName);
      });

    const canonical = sortedMatches[0].record;
    const duplicateIndices = new Set(sortedMatches.slice(1).map((entry) => entry.index));
    const dedupedRecords = currentRecords.filter((_, index) => !duplicateIndices.has(index));

    const withDedupHistory = normalizeMobilityRecord({
      ...canonical,
      history: appendHistory(canonical, {
        updatedByRole: "System",
        changeType: "candidate_record_deduplicated",
        summary: `${actor} account records were deduplicated`,
      }),
    });

    return {
      records: dedupedRecords.map((record) => (record.id === withDedupHistory.id ? withDedupHistory : record)),
      record: withDedupHistory,
      created: false,
      migrated: true,
    };
  }

  const legacyIndex = currentRecords.findIndex(
    (record) =>
      !record.ownerEmail && normalizeLower(record.applicantName) === normalizeLower(safeName)
  );
  if (legacyIndex >= 0) {
    const legacy = currentRecords[legacyIndex];
    const migrated = normalizeMobilityRecord({
      ...legacy,
      ownerEmail,
      history: appendHistory(legacy, {
        updatedByRole: "System",
        changeType: "candidate_owner_linked",
        summary: `${actor} record linked to account email`,
      }),
    });
    return {
      records: currentRecords.map((record, rowIndex) => (rowIndex === legacyIndex ? migrated : record)),
      record: migrated,
      created: false,
      migrated: true,
    };
  }

  const created = normalizeMobilityRecord({
    id: nextCandidateRecordId(currentRecords),
    applicantName: safeName,
    ownerEmail,
    skills: [],
    readinessNote: "",
    deploymentStatus: "Deployed",
    currentContractStatus: "Deployed",
    redeploymentStatus: "NotRequested",
    history: appendHistory(
      {},
      {
        updatedByRole: "System",
        changeType: "candidate_profile_created",
        summary: `${actor} profile initialized for mobility`,
      }
    ),
  });

  return {
    records: [...currentRecords, created],
    record: created,
    created: true,
    migrated: false,
  };
}

function requiredRequestFields(meta = {}, skills = []) {
  const required = ["desiredRole", "availabilityDate", "locationPreference", "applicantNote"];
  const missing = required.filter((key) => !normalizeText(meta[key]));
  if (ensureArray(skills).length === 0) missing.push("skills");
  return missing;
}

export function submitRedeploymentRequest(records = [], recordId, payload = {}, actor = "Candidate") {
  const currentRecords = ensureArray(records).map((record) => normalizeMobilityRecord(record));
  const index = currentRecords.findIndex((record) => record.id === normalizeText(recordId));
  if (index === -1) return { ok: false, message: "Mobility record not found." };

  const existing = currentRecords[index];
  if (existing.currentContractStatus !== "Finished") {
    return {
      ok: false,
      message: "Redeployment requests are only allowed when contract status is Finished.",
    };
  }

  if (existing.redeploymentStatus !== "NotRequested") {
    return {
      ok: false,
      message: "Redeployment request already submitted for this record.",
    };
  }

  const mergedSkills = normalizeSkills(payload.skills?.length ? payload.skills : existing.skills);
  const requestMeta = normalizeRequestMeta({
    ...existing.requestMeta,
    ...payload,
    requestedAt: new Date().toISOString(),
  });
  const missingFields = requiredRequestFields(requestMeta, mergedSkills);
  if (missingFields.length > 0) {
    return {
      ok: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
      missingFields,
    };
  }

  const updated = normalizeMobilityRecord({
    ...existing,
    skills: mergedSkills,
    requestMeta,
    redeploymentStatus: "RequestSubmitted",
    history: appendHistory(existing, {
      updatedByRole: "Candidate",
      changeType: "candidate_redeployment_requested",
      summary: `${actor} submitted redeployment request`,
    }),
  });

  return {
    ok: true,
    record: updated,
    records: currentRecords.map((record, rowIndex) => (rowIndex === index ? updated : record)),
  };
}

export function listRedeploymentQueue(records = [], filters = {}) {
  const normalized = ensureArray(records).map((record) => normalizeMobilityRecord(record));
  const skillQuery = normalizeLower(filters.skillQuery);
  const roleQuery = normalizeLower(filters.roleQuery);
  const statusFilter = normalizeText(filters.statusFilter, "Any");
  const ratingBand = normalizeText(filters.ratingBand, "Any");
  const availabilityWindow = normalizeText(filters.availabilityWindow, "Any");
  const now = Date.now();

  const filtered = normalized
    .filter((record) => {
      if (statusFilter !== "Any" && record.redeploymentStatus !== statusFilter) return false;
      if (roleQuery && !normalizeLower(record.requestMeta.desiredRole).includes(roleQuery)) return false;
      if (skillQuery) {
        const hasSkill = record.skills.some((skill) => normalizeLower(skill).includes(skillQuery));
        if (!hasSkill) return false;
      }
      if (ratingBand !== "Any") {
        const overall = record.internalRating.overall;
        if (ratingBand === "High" && overall < 4.5) return false;
        if (ratingBand === "Medium" && (overall < 3 || overall >= 4.5)) return false;
        if (ratingBand === "Low" && overall >= 3) return false;
      }
      if (availabilityWindow !== "Any") {
        const availabilityMs = toDateValue(record.requestMeta.availabilityDate);
        if (!availabilityMs) return false;
        const deltaDays = Math.ceil((availabilityMs - now) / (1000 * 60 * 60 * 24));
        if (availabilityWindow === "Within7Days" && deltaDays > 7) return false;
        if (availabilityWindow === "Within30Days" && deltaDays > 30) return false;
      }
      return true;
    })
    .sort((left, right) => {
      const rightRequested = toDateValue(right.requestMeta.requestedAt);
      const leftRequested = toDateValue(left.requestMeta.requestedAt);
      if (rightRequested !== leftRequested) return rightRequested - leftRequested;
      return left.applicantName.localeCompare(right.applicantName);
    });

  return filtered;
}

export function updateRedeploymentStatus(
  records = [],
  recordId,
  nextStatus,
  actor = "Recruiter",
  note = ""
) {
  const currentRecords = ensureArray(records).map((record) => normalizeMobilityRecord(record));
  const id = normalizeText(recordId);
  const index = currentRecords.findIndex((record) => record.id === id);
  if (index === -1) return { ok: false, message: "Mobility record not found." };

  const existing = currentRecords[index];
  const desiredStatus = normalizeRedeploymentStatus(nextStatus, "");
  if (!desiredStatus) return { ok: false, message: "Invalid redeployment status." };
  if (!canTransitionRedeployment(existing.redeploymentStatus, desiredStatus)) {
    return {
      ok: false,
      message: `Transition ${existing.redeploymentStatus} -> ${desiredStatus} is not allowed.`,
    };
  }

  const updated = normalizeMobilityRecord({
    ...existing,
    redeploymentStatus: desiredStatus,
    history: appendHistory(existing, {
      updatedByRole: "Recruiter",
      changeType: "redeployment_status_updated",
      summary: `${actor} updated redeployment status to ${desiredStatus}${note ? ` (${note})` : ""}`,
    }),
  });

  return {
    ok: true,
    record: updated,
    records: currentRecords.map((record, rowIndex) => (rowIndex === index ? updated : record)),
  };
}

function evaluateMatchResult(record) {
  const normalized = normalizeMobilityRecord(record);
  const skillScore = Math.min(40, normalized.skills.length * 6);
  const readinessScore = normalized.requestMeta.applicantNote ? 8 : 0;
  const roleSpecificityScore = normalized.requestMeta.desiredRole ? 12 : 0;
  const ratingScore = normalized.ratingWeight * 40;
  const matchScore = Math.max(
    0,
    Math.min(100, Number((skillScore + readinessScore + roleSpecificityScore + ratingScore).toFixed(1)))
  );
  const ratingImpact = ratingImpactLabel(normalized.ratingWeight);
  const rationale = [
    `Internal rating impact is ${ratingImpact}.`,
    `Skills considered: ${normalized.skills.length}.`,
    normalized.requestMeta.desiredRole
      ? `Desired role signal: ${normalized.requestMeta.desiredRole}.`
      : "Desired role signal: not provided.",
  ].join(" ");

  return { matchScore, ratingImpact, rationale };
}

function runMatchAndPersist(records = [], recordId, actor = "Recruiter", batchRunId = "") {
  const currentRecords = ensureArray(records).map((record) => normalizeMobilityRecord(record));
  const id = normalizeText(recordId);
  const index = currentRecords.findIndex((record) => record.id === id);
  if (index === -1) return { ok: false, message: "Mobility record not found." };

  const existing = currentRecords[index];
  const match = evaluateMatchResult(existing);
  const nextStatus =
    existing.redeploymentStatus === "RequestSubmitted" || existing.redeploymentStatus === "UnderReview"
      ? "Matched"
      : existing.redeploymentStatus;

  const updated = normalizeMobilityRecord({
    ...existing,
    redeploymentStatus: nextStatus,
    matchMeta: {
      ...existing.matchMeta,
      ...match,
      lastMatchedAt: new Date().toISOString(),
      matchedBy: actor,
      batchRunId: normalizeText(batchRunId),
    },
    history: appendHistory(existing, {
      updatedByRole: "Recruiter",
      changeType: "ai_match_run",
      summary: `${actor} ran AI match (score ${match.matchScore})`,
    }),
  });

  return {
    ok: true,
    record: updated,
    records: currentRecords.map((record, rowIndex) => (rowIndex === index ? updated : record)),
  };
}

export function runSingleMobilityMatch(records = [], recordId, actor = "Recruiter") {
  return runMatchAndPersist(records, recordId, actor, "");
}

export function runBatchMobilityMatch(records = [], recordIds = [], actor = "Recruiter") {
  const batchRunId = `BATCH-${Date.now().toString(36)}`;
  const selectedIds = uniqStable(ensureArray(recordIds).map((id) => normalizeText(id)).filter(Boolean));
  let nextRecords = ensureArray(records).map((record) => normalizeMobilityRecord(record));
  const matched = [];
  const skipped = [];

  for (const recordId of selectedIds) {
    const target = nextRecords.find((record) => record.id === recordId);
    if (!target) {
      skipped.push({ recordId, reason: "Record not found." });
      continue;
    }
    if (!["RequestSubmitted", "UnderReview"].includes(target.redeploymentStatus)) {
      skipped.push({
        recordId,
        applicantName: target.applicantName,
        reason: `Status ${target.redeploymentStatus} is not batch-match eligible.`,
      });
      continue;
    }
    const missing = requiredRequestFields(target.requestMeta, target.skills);
    if (missing.length > 0) {
      skipped.push({
        recordId,
        applicantName: target.applicantName,
        reason: `Missing required request fields: ${missing.join(", ")}`,
      });
      continue;
    }

    const result = runMatchAndPersist(nextRecords, recordId, actor, batchRunId);
    if (!result.ok) {
      skipped.push({ recordId, applicantName: target.applicantName, reason: result.message });
      continue;
    }
    nextRecords = result.records;
    matched.push(result.record);
  }

  return {
    ok: true,
    batchRunId,
    records: nextRecords,
    matched,
    skipped,
  };
}

export function submitDeploymentManagerRating(records = [], payload = {}, actor = "Deployment Manager") {
  const currentRecords = ensureArray(records).map((record) => normalizeMobilityRecord(record));
  const targetId = normalizeText(payload.id);
  const index = currentRecords.findIndex((record) => record.id === targetId);
  if (index === -1) return { ok: false, message: "Mobility record not found." };

  const existing = currentRecords[index];
  if (!["Deployed", "Finished"].includes(existing.currentContractStatus)) {
    return {
      ok: false,
      message: "Deployment Manager can only rate records in Deployed or Finished status.",
    };
  }

  const internalRating = normalizeInternalRating({
    overall: payload.overall,
    dimensions: payload.dimensions,
    notes: ensureArray(payload.notes),
  });
  const nextContractStatus = normalizeStatus(payload.currentContractStatus || payload.deploymentStatus, "Finished");
  const nextDeploymentStatus = normalizeStatus(payload.deploymentStatus || nextContractStatus, nextContractStatus);
  const updated = normalizeMobilityRecord({
    ...existing,
    internalRating,
    deploymentStatus: nextDeploymentStatus,
    currentContractStatus: nextContractStatus,
    history: appendHistory(existing, {
      updatedByRole: "DeploymentManager",
      changeType: "deployment_rating_submitted",
      summary: `${actor} submitted internal rating (${internalRating.overall}/5)`,
    }),
  });

  return {
    ok: true,
    record: updated,
    records: currentRecords.map((record, rowIndex) => (rowIndex === index ? updated : record)),
  };
}

export function deriveAdminMobilitySnapshot(records = []) {
  const normalized = ensureArray(records).map((record) => normalizeMobilityRecord(record));
  const totalRecords = normalized.length;
  const finishedCount = normalized.filter((record) => record.currentContractStatus === "Finished").length;
  const finishedRate = totalRecords === 0 ? 0 : Number(((finishedCount / totalRecords) * 100).toFixed(1));
  const redeploymentStatusCounts = REDEPLOYMENT_STATUSES.reduce((acc, status) => {
    acc[status] = normalized.filter((record) => record.redeploymentStatus === status).length;
    return acc;
  }, {});
  const ratingBands = normalized.reduce(
    (acc, record) => {
      const overall = record.internalRating.overall;
      if (!Number.isFinite(overall)) acc.unrated += 1;
      else if (overall >= 4.5) acc.high += 1;
      else if (overall >= 3) acc.medium += 1;
      else acc.low += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0, unrated: 0 }
  );

  const recentChanges = normalized
    .flatMap((record) =>
      ensureArray(record.history).map((entry) => ({
        id: record.id,
        applicantName: record.applicantName,
        deploymentStatus: record.deploymentStatus,
        currentContractStatus: record.currentContractStatus,
        redeploymentStatus: record.redeploymentStatus,
        updatedAt: normalizeText(entry.updatedAt),
        updatedByRole: normalizeText(entry.updatedByRole, "System"),
        changeType: normalizeText(entry.changeType, "update"),
        summary: normalizeText(entry.summary, "Record updated"),
      }))
    )
    .sort((left, right) => toDateValue(right.updatedAt) - toDateValue(left.updatedAt));

  return {
    totalRecords,
    finishedCount,
    finishedRate,
    ratingBands,
    redeploymentStatusCounts,
    recentChanges,
  };
}
