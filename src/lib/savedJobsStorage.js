const SAVED_JOBS_STORAGE_PREFIX = "ai_resume_screening_saved_jobs_v1:";
const MAX_SAVED_JOBS = 200;

function normalizeIdentity(identity) {
  const normalized = String(identity || "").trim().toLowerCase();
  return normalized || "guest";
}

export function normalizeSavedJobIds(input) {
  const list = Array.isArray(input)
    ? input
    : input instanceof Set
      ? Array.from(input)
      : [];

  const seen = new Set();
  const result = [];

  for (const item of list) {
    const value = String(item || "").trim();
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
    if (result.length >= MAX_SAVED_JOBS) break;
  }

  return result;
}

export function getSavedJobsKey(identity) {
  return `${SAVED_JOBS_STORAGE_PREFIX}${normalizeIdentity(identity)}`;
}

export function readSavedJobIds(identity) {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(getSavedJobsKey(identity));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return normalizeSavedJobIds(parsed);
  } catch {
    return [];
  }
}

export function writeSavedJobIds(identity, ids) {
  if (typeof window === "undefined") return;

  const normalized = normalizeSavedJobIds(ids);
  const key = getSavedJobsKey(identity);

  if (normalized.length === 0) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(normalized));
}

export function mergeGuestSavedIntoUser(guestIdentity, userIdentity) {
  if (typeof window === "undefined") return [];

  const guest = readSavedJobIds(guestIdentity);
  const user = readSavedJobIds(userIdentity);
  const merged = normalizeSavedJobIds([...guest, ...user]);

  writeSavedJobIds(userIdentity, merged);
  writeSavedJobIds(guestIdentity, []);

  return merged;
}

