export const AUTH_ATTEMPTS_STORAGE_KEY = "ai_resume_auth_attempts_v1";
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_DURATION_MINUTES = 15;

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function readAttemptsMap() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(AUTH_ATTEMPTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeAttemptsMap(value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_ATTEMPTS_STORAGE_KEY, JSON.stringify(value));
}

function sanitizeEntry(entry) {
  const attempts =
    typeof entry?.attempts === "number" && Number.isFinite(entry.attempts)
      ? Math.max(0, Math.floor(entry.attempts))
      : 0;
  const lockedUntil =
    typeof entry?.lockedUntil === "number" && Number.isFinite(entry.lockedUntil)
      ? entry.lockedUntil
      : 0;

  return { attempts, lockedUntil };
}

export function getLoginPolicyState(email, now = Date.now()) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return {
      attempts: 0,
      remainingAttempts: MAX_LOGIN_ATTEMPTS,
      isLocked: false,
      lockRemainingMs: 0,
      lockedUntil: 0,
    };
  }

  const map = readAttemptsMap();
  let entry = sanitizeEntry(map[normalizedEmail]);

  if (entry.lockedUntil > 0 && entry.lockedUntil <= now) {
    entry = { attempts: 0, lockedUntil: 0 };
    map[normalizedEmail] = entry;
    writeAttemptsMap(map);
  }

  const lockRemainingMs = Math.max(0, entry.lockedUntil - now);
  const isLocked = lockRemainingMs > 0;
  const attempts = isLocked ? entry.attempts : Math.min(entry.attempts, MAX_LOGIN_ATTEMPTS - 1);
  const remainingAttempts = isLocked
    ? 0
    : Math.max(0, MAX_LOGIN_ATTEMPTS - attempts);

  return {
    attempts,
    remainingAttempts,
    isLocked,
    lockRemainingMs,
    lockedUntil: entry.lockedUntil,
  };
}

export function clearLoginPolicyState(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || typeof window === "undefined") return;

  const map = readAttemptsMap();
  if (!map[normalizedEmail]) return;

  delete map[normalizedEmail];
  writeAttemptsMap(map);
}

export function recordFailedLoginAttempt(email, now = Date.now()) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return getLoginPolicyState("", now);
  }

  const map = readAttemptsMap();
  const current = sanitizeEntry(map[normalizedEmail]);
  const currentlyLocked = current.lockedUntil > now;
  if (currentlyLocked) {
    return getLoginPolicyState(normalizedEmail, now);
  }

  const attempts = current.attempts + 1;
  const reachedMax = attempts >= MAX_LOGIN_ATTEMPTS;
  const lockedUntil = reachedMax
    ? now + LOCK_DURATION_MINUTES * 60 * 1000
    : 0;

  map[normalizedEmail] = { attempts, lockedUntil };
  writeAttemptsMap(map);

  return getLoginPolicyState(normalizedEmail, now);
}

export function formatLockRemaining(lockRemainingMs) {
  const totalSeconds = Math.ceil(Math.max(0, lockRemainingMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}
