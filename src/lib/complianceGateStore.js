const STORAGE_KEY = "ta_compliance_gate_decisions_v1";

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

export function getComplianceGateDecisions() {
  return readRaw()
    .map((entry) => ({
      applicationId: String(entry?.applicationId || "").trim(),
      result: entry?.result === "pass" ? "pass" : "fail",
      reason: String(entry?.reason || "").trim(),
      actor: String(entry?.actor || "Talent Acquisition").trim(),
      decidedAt: String(entry?.decidedAt || ""),
    }))
    .filter((entry) => entry.applicationId);
}

export function upsertComplianceGateDecision(payload) {
  const applicationId = String(payload?.applicationId || "").trim();
  if (!applicationId) {
    return { ok: false, message: "Application id is required." };
  }

  const nextEntry = {
    applicationId,
    result: payload?.result === "pass" ? "pass" : "fail",
    reason: String(payload?.reason || "").trim(),
    actor: String(payload?.actor || "Talent Acquisition").trim() || "Talent Acquisition",
    decidedAt: new Date().toISOString(),
  };

  const current = getComplianceGateDecisions();
  const exists = current.some((entry) => entry.applicationId === applicationId);
  const next = exists
    ? current.map((entry) => (entry.applicationId === applicationId ? nextEntry : entry))
    : [nextEntry, ...current];

  writeRaw(next);
  return { ok: true, decision: nextEntry };
}

