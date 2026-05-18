import { internalMobilityApplicantsSeed } from "./internalMobilityMockData.js";
import {
  deriveAdminMobilitySnapshot,
  getOrCreateCandidateRecordByEmail as getOrCreateCandidateRecordByEmailPure,
  listRedeploymentQueue as listRedeploymentQueuePure,
  normalizeMobilityRecord,
  runBatchMobilityMatch as runBatchMobilityMatchPure,
  runSingleMobilityMatch as runSingleMobilityMatchPure,
  submitDeploymentManagerRating,
  submitRedeploymentRequest as submitRedeploymentRequestPure,
  updateRedeploymentStatus as updateRedeploymentStatusPure,
  upsertCandidateMobilityProfile,
} from "./internalMobility.js";

const INTERNAL_MOBILITY_STORAGE_KEY = "internal_mobility_records_v1";

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value, fallback = "") {
  const next = String(value || "").trim();
  return next || fallback;
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function buildSeedRecords() {
  const now = new Date().toISOString();
  return internalMobilityApplicantsSeed.map((record) =>
    normalizeMobilityRecord({
      ...record,
      currentContractStatus: record.deploymentStatus === "Finished" ? "Finished" : "Deployed",
      redeploymentStatus: "NotRequested",
      requestMeta: {},
      matchMeta: {},
      history: [
        {
          updatedAt: now,
          updatedByRole: "System",
          changeType: "seed",
          summary: "Seeded mobility record",
        },
      ],
    })
  );
}

export function getInternalMobilityStorageKey() {
  return INTERNAL_MOBILITY_STORAGE_KEY;
}

export function readInternalMobilityRecords() {
  if (typeof window === "undefined") return buildSeedRecords();

  try {
    const raw = window.localStorage.getItem(INTERNAL_MOBILITY_STORAGE_KEY);
    if (!raw) {
      const seeded = buildSeedRecords();
      window.localStorage.setItem(INTERNAL_MOBILITY_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seeded = buildSeedRecords();
      window.localStorage.setItem(INTERNAL_MOBILITY_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return parsed.map((record) => normalizeMobilityRecord(record));
  } catch {
    const seeded = buildSeedRecords();
    window.localStorage.setItem(INTERNAL_MOBILITY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

export function writeInternalMobilityRecords(records = []) {
  if (typeof window === "undefined") return;
  const normalized = ensureArray(records).map((record) => normalizeMobilityRecord(record));
  window.localStorage.setItem(INTERNAL_MOBILITY_STORAGE_KEY, JSON.stringify(normalized));
}

export function resetInternalMobilityRecords() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(INTERNAL_MOBILITY_STORAGE_KEY);
}

export function resetInternalMobilityRecordsToScenario() {
  if (typeof window === "undefined") return [];
  const seeded = buildSeedRecords();
  window.localStorage.setItem(INTERNAL_MOBILITY_STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

export function saveCandidateMobilityProfile(payload = {}, actor = "Candidate") {
  const currentRecords = readInternalMobilityRecords();
  const { records, record } = upsertCandidateMobilityProfile(currentRecords, payload, actor);
  writeInternalMobilityRecords(records);
  return { records, record };
}

export function getOrCreateCandidateRecordByEmail(email, applicantName, actor = "Candidate") {
  const currentRecords = readInternalMobilityRecords();
  const result = getOrCreateCandidateRecordByEmailPure(
    currentRecords,
    normalizeEmail(email),
    normalizeText(applicantName),
    actor
  );
  if (result.created || result.migrated) {
    writeInternalMobilityRecords(result.records);
  }
  return result;
}

export function saveDeploymentManagerRating(payload = {}, actor = "Deployment Manager") {
  const currentRecords = readInternalMobilityRecords();
  const result = submitDeploymentManagerRating(currentRecords, payload, actor);
  if (!result.ok) return result;
  writeInternalMobilityRecords(result.records);
  return result;
}

export function readAdminMobilitySnapshot() {
  return deriveAdminMobilitySnapshot(readInternalMobilityRecords());
}

export function submitRedeploymentRequest(recordId, payload = {}, actor = "Candidate") {
  const currentRecords = readInternalMobilityRecords();
  const result = submitRedeploymentRequestPure(currentRecords, normalizeText(recordId), payload, actor);
  if (!result.ok) return result;
  writeInternalMobilityRecords(result.records);
  return result;
}

export function listRedeploymentQueue(filters = {}) {
  return listRedeploymentQueuePure(readInternalMobilityRecords(), filters);
}

export function updateRedeploymentStatus(recordId, nextStatus, actor = "Recruiter", note = "") {
  const currentRecords = readInternalMobilityRecords();
  const result = updateRedeploymentStatusPure(
    currentRecords,
    normalizeText(recordId),
    normalizeText(nextStatus),
    actor,
    note
  );
  if (!result.ok) return result;
  writeInternalMobilityRecords(result.records);
  return result;
}

export function runSingleMobilityMatch(recordId, actor = "Recruiter") {
  const currentRecords = readInternalMobilityRecords();
  const result = runSingleMobilityMatchPure(currentRecords, normalizeText(recordId), actor);
  if (!result.ok) return result;
  writeInternalMobilityRecords(result.records);
  return result;
}

export function runBatchMobilityMatch(recordIds = [], actor = "Recruiter") {
  const currentRecords = readInternalMobilityRecords();
  const result = runBatchMobilityMatchPure(currentRecords, ensureArray(recordIds), actor);
  if (result.ok) writeInternalMobilityRecords(result.records);
  return result;
}
