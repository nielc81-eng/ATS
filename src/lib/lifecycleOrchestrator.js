import { APPLICATION_STATUS } from "./applicationStatuses.js";
import { buildCanonicalPersonRef } from "./canonicalPerson.js";

export const LIFECYCLE_EVENT_NAME = {
  ApplicationSubmitted: "application.submitted",
  ApplicationStatusChanged: "application.status_changed",
  CompliancePassed: "compliance.passed",
  DeploymentRequestApproved: "deployment.request_approved",
};

function createLifecycleEventId() {
  return `lifecycle-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function createLifecycleEvent(name, payload = {}) {
  return {
    id: createLifecycleEventId(),
    name,
    at: new Date().toISOString(),
    payload,
  };
}

export function resolvePersonRefFromApplication(application = {}) {
  return buildCanonicalPersonRef({
    email: application.candidateEmail,
    name: application.candidateName,
    legacyId: application.id,
  });
}

export function runLifecycleOrchestrator(event, deps = {}) {
  if (!event || typeof event !== "object") return { ok: false, handled: false };
  const { payload = {} } = event;

  if (
    event.name === LIFECYCLE_EVENT_NAME.ApplicationStatusChanged &&
    payload.nextStatus === APPLICATION_STATUS.HiredOnboarding &&
    typeof deps.upsertWorkforceTalentFromApplication === "function" &&
    payload.application
  ) {
    const result = deps.upsertWorkforceTalentFromApplication(payload.application, {
      actor: payload.actor || "System",
      actorRole: payload.actorRole || "System",
      correlationId: event.id,
    });
    return { ok: Boolean(result?.ok), handled: true, result };
  }

  if (
    event.name === LIFECYCLE_EVENT_NAME.CompliancePassed &&
    typeof deps.upsertWorkforceTalentFromApplication === "function" &&
    payload.application
  ) {
    const result = deps.upsertWorkforceTalentFromApplication(payload.application, {
      actor: payload.actor || "System",
      actorRole: payload.actorRole || "Recruiter",
      correlationId: event.id,
    });
    return { ok: Boolean(result?.ok), handled: true, result };
  }

  return { ok: true, handled: false };
}
