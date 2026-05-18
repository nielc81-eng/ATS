import { APPLICATION_STATUS } from "./applicationStatuses.js";

const REJECTED_STATUSES = new Set([
  APPLICATION_STATUS.Rejected,
  APPLICATION_STATUS.BackoutArchived,
]);

const DEFAULT_ALLOWED_NEXT = new Set([
  APPLICATION_STATUS.Submitted,
  APPLICATION_STATUS.PooledForFutureOpportunities,
  APPLICATION_STATUS.Shortlisted,
  APPLICATION_STATUS.Interview,
  APPLICATION_STATUS.InterviewInitial,
  APPLICATION_STATUS.InterviewFinal,
  APPLICATION_STATUS.Offer,
  APPLICATION_STATUS.PostHireDocsSubmitted,
  APPLICATION_STATUS.Hired,
  APPLICATION_STATUS.HiredOnboarding,
  APPLICATION_STATUS.BackoutArchived,
  APPLICATION_STATUS.Rejected,
]);

export const APPLICATION_TRANSITION_RULES = {
  [APPLICATION_STATUS.Submitted]: new Set([
    APPLICATION_STATUS.PooledForFutureOpportunities,
    APPLICATION_STATUS.Shortlisted,
    APPLICATION_STATUS.InterviewInitial,
    APPLICATION_STATUS.Rejected,
  ]),
  [APPLICATION_STATUS.PooledForFutureOpportunities]: new Set([
    APPLICATION_STATUS.Shortlisted,
    APPLICATION_STATUS.InterviewInitial,
    APPLICATION_STATUS.Rejected,
  ]),
  [APPLICATION_STATUS.Shortlisted]: new Set([
    APPLICATION_STATUS.Interview,
    APPLICATION_STATUS.InterviewInitial,
    APPLICATION_STATUS.Rejected,
  ]),
  [APPLICATION_STATUS.Interview]: new Set([
    APPLICATION_STATUS.InterviewFinal,
    APPLICATION_STATUS.Offer,
    APPLICATION_STATUS.Rejected,
  ]),
  [APPLICATION_STATUS.InterviewInitial]: new Set([
    APPLICATION_STATUS.InterviewFinal,
    APPLICATION_STATUS.PostHireDocsSubmitted,
    APPLICATION_STATUS.BackoutArchived,
    APPLICATION_STATUS.Rejected,
  ]),
  [APPLICATION_STATUS.InterviewFinal]: new Set([
    APPLICATION_STATUS.PostHireDocsSubmitted,
    APPLICATION_STATUS.BackoutArchived,
    APPLICATION_STATUS.Rejected,
  ]),
  [APPLICATION_STATUS.Offer]: new Set([
    APPLICATION_STATUS.PostHireDocsSubmitted,
    APPLICATION_STATUS.Rejected,
  ]),
  [APPLICATION_STATUS.PostHireDocsSubmitted]: new Set([
    APPLICATION_STATUS.HiredOnboarding,
    APPLICATION_STATUS.BackoutArchived,
    APPLICATION_STATUS.Rejected,
  ]),
  [APPLICATION_STATUS.Hired]: new Set([APPLICATION_STATUS.HiredOnboarding]),
  [APPLICATION_STATUS.HiredOnboarding]: new Set([]),
  [APPLICATION_STATUS.BackoutArchived]: new Set([]),
  [APPLICATION_STATUS.Rejected]: new Set([]),
};

function normalizeText(value) {
  return String(value || "").trim();
}

export function toCanonicalReportingStatus(status) {
  switch (status) {
    case APPLICATION_STATUS.Shortlisted:
      return "Shortlisted";
    case APPLICATION_STATUS.Interview:
    case APPLICATION_STATUS.InterviewInitial:
    case APPLICATION_STATUS.InterviewFinal:
      return "Interview";
    case APPLICATION_STATUS.Offer:
    case APPLICATION_STATUS.PostHireDocsSubmitted:
      return "Offer";
    case APPLICATION_STATUS.Hired:
    case APPLICATION_STATUS.HiredOnboarding:
      return "Hired";
    case APPLICATION_STATUS.BackoutArchived:
    case APPLICATION_STATUS.Rejected:
      return "Rejected";
    case APPLICATION_STATUS.Submitted:
    case APPLICATION_STATUS.PooledForFutureOpportunities:
    default:
      return "Submitted";
  }
}

export function validateApplicationTransition({
  currentStatus = "",
  nextStatus = "",
  actorRole = "",
  note = "",
  docsComplete = true,
  allowAdministrator = true,
}) {
  const normalizedCurrent = normalizeText(currentStatus);
  const normalizedNext = normalizeText(nextStatus);
  const normalizedActorRole = normalizeText(actorRole);
  const normalizedNote = normalizeText(note);

  if (!normalizedNext) {
    return { ok: false, code: "INVALID_STATUS", message: "Unsupported application status." };
  }

  if (normalizedCurrent === normalizedNext) {
    return { ok: true };
  }

  const allowedTransitions =
    APPLICATION_TRANSITION_RULES[normalizedCurrent] || DEFAULT_ALLOWED_NEXT;
  if (!allowedTransitions.has(normalizedNext)) {
    return {
      ok: false,
      code: "INVALID_TRANSITION",
      message: `Transition from ${normalizedCurrent || "Unknown"} to ${normalizedNext} is not allowed.`,
    };
  }

  if (REJECTED_STATUSES.has(normalizedNext) && !normalizedNote) {
    return {
      ok: false,
      code: "NOTE_REQUIRED",
      message: "A note is required when rejecting or archiving an application.",
    };
  }

  if (normalizedNext === APPLICATION_STATUS.HiredOnboarding && !docsComplete) {
    return {
      ok: false,
      code: "DOCS_INCOMPLETE",
      message:
        "Required onboarding documents must be submitted (or approved) before finalizing onboarding.",
    };
  }

  const privilegedRoles = allowAdministrator
    ? new Set(["Recruiter", "Administrator", "System"])
    : new Set(["Recruiter", "System"]);
  const candidateWithdrawAllowed =
    normalizedActorRole === "Candidate" &&
    REJECTED_STATUSES.has(normalizedNext) &&
    normalizedNote.toLowerCase().includes("withdraw");

  if (normalizedActorRole && !privilegedRoles.has(normalizedActorRole) && !candidateWithdrawAllowed) {
    return {
      ok: false,
      code: "UNAUTHORIZED_ROLE",
      message: `${normalizedActorRole} cannot update application lifecycle status.`,
    };
  }

  return { ok: true };
}
