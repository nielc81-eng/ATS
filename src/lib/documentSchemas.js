export const candidateOnboardingDocTypes = [
  "Government ID",
  "Tax Form 2316",
  "Employment Contract",
  "Emergency Contact Sheet",
];

export const candidateDocStatuses = ["Submitted", "Approved", "Needs Action"];

export const candidate201DocsStateKey = "candidate_201_docs_state_v1";
export const candidate201ReviewUpdatesKey = "candidate_201_review_updates_v1";
export const CANDIDATE_DOC_SUBMISSION_QUEUE_KEY = "candidate_docs_events";
export const CANDIDATE_DOC_QUEUE_EVENT_NAME =
  "candidate-doc-submission-queued";
export const RECRUITER_DOC_PROCESSED_SET_KEY =
  "recruiter_doc_submission_processed_v1";
export const RECRUITER_DOC_INBOX_STORAGE_KEY =
  "recruiter_candidate_docs_inbox_v1";
export const candidateDocsEventsKey = CANDIDATE_DOC_SUBMISSION_QUEUE_KEY;

function getTodayStamp() {
  return new Date().toISOString();
}

function createId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeText(value, fallback) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeFileMeta(fileMeta) {
  if (!fileMeta || typeof fileMeta !== "object") return null;

  return {
    name: normalizeText(fileMeta.name, "uploaded-file"),
    size: normalizeText(fileMeta.size, "N/A"),
    type: normalizeText(fileMeta.type, "application/octet-stream"),
  };
}

export function toTodayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function createCandidateDocSubmissionEvent(payload = {}) {
  const docType = normalizeText(payload.docType, "");
  if (!docType) return null;

  const eventId = createId("doc-event");
  const submittedAt = normalizeText(payload.submittedAt, getTodayStamp());

  return {
    id: eventId,
    eventId,
    kind: "candidate-doc-submitted",
    candidateId: normalizeText(payload.candidateId, "candidate"),
    candidateAlias: normalizeText(payload.candidateAlias, "Candidate"),
    candidateIdentifier: normalizeText(
      payload.candidateIdentifier || payload.candidateId,
      "Unknown candidate"
    ),
    docType,
    submittedOn: submittedAt,
    submittedAt,
    notes: normalizeText(payload.notes, "Submitted from the candidate portal."),
    fileMeta: normalizeFileMeta(payload.fileMeta),
    fileName: normalizeText(payload.fileName, "uploaded-file"),
  };
}

export function createCandidate201SubmissionEvent(payload = {}) {
  const event = createCandidateDocSubmissionEvent(payload);
  if (!event) return null;

  return {
    ...event,
    candidateId: normalizeText(payload.candidateId, "candidate"),
    fileName: normalizeText(payload.fileName, event.fileMeta?.name || "uploaded-file"),
  };
}

export function normalizeCandidateDocSubmissionEvent(event) {
  const docType = normalizeText(event?.docType, "");
  if (!docType) return null;

  const eventId = normalizeText(event?.eventId, normalizeText(event?.id, createId("doc-event")));
  const submittedAt = normalizeText(
    event?.submittedAt,
    normalizeText(event?.submittedOn, getTodayStamp())
  );

  return {
    id: eventId,
    eventId,
    kind: "candidate-doc-submitted",
    candidateId: normalizeText(event?.candidateId, "candidate"),
    candidateAlias: normalizeText(event?.candidateAlias, "Candidate"),
    candidateIdentifier: normalizeText(
      event?.candidateIdentifier || event?.candidateId,
      "Unknown candidate"
    ),
    docType,
    submittedOn: submittedAt,
    submittedAt,
    notes: normalizeText(event?.notes, "Submitted from the candidate portal."),
    fileMeta: normalizeFileMeta(event?.fileMeta) || normalizeFileMeta({
      name: event?.fileName,
    }),
    fileName: normalizeText(event?.fileName, event?.fileMeta?.name || "uploaded-file"),
  };
}

export function getCandidate201SeedDocs() {
  return [
    {
      docType: "Government ID",
      status: "Needs Action",
      lastUpdated: "2026-05-06",
      fileName: "gov-id-front.jpg",
      notes: "ID is readable but the expiration date is unclear. Please re-upload.",
    },
    {
      docType: "Tax Form 2316",
      status: "Missing",
      lastUpdated: "2026-05-03",
      fileName: "",
      notes: "Required before payroll activation.",
    },
    {
      docType: "Employment Contract",
      status: "Approved",
      lastUpdated: "2026-05-01",
      fileName: "signed-employment-contract.pdf",
      notes: "Signed contract verified by HR.",
    },
    {
      docType: "Emergency Contact Sheet",
      status: "Submitted",
      lastUpdated: "2026-05-08",
      fileName: "emergency-contact-form.pdf",
      notes: "Received and queued for review.",
    },
  ];
}

export function createRecruiterInboxItemFromSubmission(submission) {
  const event = normalizeCandidateDocSubmissionEvent(submission);
  if (!event) return null;

  return {
    id: event.id,
    sourceEventId: event.id,
    candidateId: event.candidateId,
    candidateAlias: event.candidateAlias,
    candidateIdentifier: event.candidateIdentifier,
    docType: event.docType,
    submittedOn: event.submittedOn,
    status: "Submitted",
    notes: event.notes,
    fileMeta: event.fileMeta,
    reviewedAt: "",
    reviewedBy: "",
    reviewSummary: "Awaiting recruiter review.",
  };
}

export function normalizeRecruiterInboxItem(item) {
  const id = normalizeText(item?.id, "");
  if (!id) return null;

  const status = candidateDocStatuses.includes(item?.status)
    ? item.status
    : "Submitted";

  return {
    id,
    sourceEventId: normalizeText(item?.sourceEventId, id),
    candidateId: normalizeText(item?.candidateId, "candidate"),
    candidateAlias: normalizeText(item?.candidateAlias, "Candidate"),
    candidateIdentifier: normalizeText(item?.candidateIdentifier, "Unknown candidate"),
    docType: normalizeText(item?.docType, "Unknown document"),
    submittedOn: normalizeText(item?.submittedOn, getTodayStamp()),
    status,
    notes: normalizeText(item?.notes, ""),
    fileMeta: normalizeFileMeta(item?.fileMeta),
    reviewedAt: normalizeText(item?.reviewedAt, ""),
    reviewedBy: normalizeText(item?.reviewedBy, ""),
    reviewSummary: normalizeText(
      item?.reviewSummary,
      "Awaiting recruiter review."
    ),
  };
}

export function appendCandidateDocSubmissionEvent(payload = {}) {
  if (typeof window === "undefined") return null;

  const event = createCandidateDocSubmissionEvent(payload);
  if (!event) return null;

  const rawQueue = window.localStorage.getItem(CANDIDATE_DOC_SUBMISSION_QUEUE_KEY);
  const queue = rawQueue ? JSON.parse(rawQueue) : [];
  const nextQueue = Array.isArray(queue) ? [...queue, event] : [event];

  window.localStorage.setItem(
    CANDIDATE_DOC_SUBMISSION_QUEUE_KEY,
    JSON.stringify(nextQueue)
  );
  window.dispatchEvent(
    new CustomEvent(CANDIDATE_DOC_QUEUE_EVENT_NAME, { detail: event })
  );

  return event;
}
