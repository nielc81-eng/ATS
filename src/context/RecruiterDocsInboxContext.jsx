import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { recordAdminAuditEvent } from "../lib/adminMockData";
import {
  CANDIDATE_DOC_QUEUE_EVENT_NAME,
  CANDIDATE_DOC_SUBMISSION_QUEUE_KEY,
  candidate201ReviewUpdatesKey,
  RECRUITER_DOC_INBOX_STORAGE_KEY,
  RECRUITER_DOC_PROCESSED_SET_KEY,
  candidateDocStatuses,
  createRecruiterInboxItemFromSubmission,
  normalizeCandidateDocSubmissionEvent,
  normalizeRecruiterInboxItem,
} from "../lib/documentSchemas";

const RecruiterDocsInboxContext = createContext(null);

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

function sortInboxItems(items) {
  return [...items].sort((left, right) => {
    const submittedDelta =
      Date.parse(right.submittedOn || "") - Date.parse(left.submittedOn || "");
    if (submittedDelta !== 0) return submittedDelta;

    return Date.parse(right.reviewedAt || "") - Date.parse(left.reviewedAt || "");
  });
}

function readStoredState() {
  const storedItems = readJsonArray(RECRUITER_DOC_INBOX_STORAGE_KEY)
    .map(normalizeRecruiterInboxItem)
    .filter(Boolean);
  const processedIds = new Set(
    readJsonArray(RECRUITER_DOC_PROCESSED_SET_KEY)
      .map((value) => String(value || "").trim())
      .filter(Boolean)
  );

  storedItems.forEach((item) => {
    processedIds.add(item.sourceEventId || item.id);
  });

  return {
    items: sortInboxItems(storedItems),
    processedIds: [...processedIds],
  };
}

function getReviewTimestamp() {
  return new Date().toISOString();
}

function appendCandidateReviewUpdate(item, status, reviewSummary, reviewedBy) {
  if (typeof window === "undefined") return;

  const update = {
    reviewId: `review-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    eventId: item.sourceEventId || item.id,
    reviewedAt: getReviewTimestamp(),
    candidateId: item.candidateId || "candidate",
    candidateEmail: item.candidateEmail || "",
    personKey: item.personKey || "",
    candidateAlias: item.candidateAlias || "Candidate",
    docType: item.docType,
    fileName: item.fileMeta?.name || item.docType,
    status,
    note: reviewSummary,
    reviewer: reviewedBy || "Recruiter Ops",
  };

  const updates = readJsonArray(candidate201ReviewUpdatesKey);
  updates.push(update);
  writeJsonArray(candidate201ReviewUpdatesKey, updates);
}

function setInboxItem(prevItems, itemId, updater) {
  return sortInboxItems(
    prevItems.map((item) => {
      if (item.id !== itemId) return item;
      return normalizeRecruiterInboxItem(updater(item));
    })
  );
}

export function RecruiterDocsInboxProvider({ children }) {
  const initialState = useMemo(() => readStoredState(), []);
  const [items, setItems] = useState(initialState.items);
  const [processedIds, setProcessedIds] = useState(initialState.processedIds);
  const itemsRef = useRef(items);
  const processedIdsRef = useRef(processedIds);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    processedIdsRef.current = processedIds;
  }, [processedIds]);

  useEffect(() => {
    writeJsonArray(RECRUITER_DOC_INBOX_STORAGE_KEY, items);
  }, [items]);

  useEffect(() => {
    writeJsonArray(RECRUITER_DOC_PROCESSED_SET_KEY, processedIds);
  }, [processedIds]);

  const syncFromQueue = useCallback(() => {
    const queue = readJsonArray(CANDIDATE_DOC_SUBMISSION_QUEUE_KEY)
      .map(normalizeCandidateDocSubmissionEvent)
      .filter(Boolean);

    const nextItems = new Map(itemsRef.current.map((item) => [item.id, item]));
    const nextProcessedIds = new Set(processedIdsRef.current);
    let didChange = false;

    queue.forEach((submission) => {
      if (nextProcessedIds.has(submission.id)) return;
      nextProcessedIds.add(submission.id);
      const inboxItem = createRecruiterInboxItemFromSubmission(submission);
      if (!inboxItem) return;
      nextItems.set(inboxItem.id, inboxItem);
      didChange = true;
    });

    if (!didChange) return;

    setItems(sortInboxItems([...nextItems.values()]));
    setProcessedIds([...nextProcessedIds]);
  }, []);

  useEffect(() => {
    syncFromQueue();

    const handleQueueUpdate = () => syncFromQueue();
    const handleStorage = (event) => {
      if (
        event.key === CANDIDATE_DOC_SUBMISSION_QUEUE_KEY ||
        event.key === RECRUITER_DOC_INBOX_STORAGE_KEY ||
        event.key === RECRUITER_DOC_PROCESSED_SET_KEY
      ) {
        syncFromQueue();
      }
    };

    window.addEventListener(CANDIDATE_DOC_QUEUE_EVENT_NAME, handleQueueUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(CANDIDATE_DOC_QUEUE_EVENT_NAME, handleQueueUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [syncFromQueue]);

  const approveInboxItem = useCallback((itemId, reviewSummary) => {
    const reviewedAt = getReviewTimestamp();
    setItems((prev) =>
      setInboxItem(prev, itemId, (item) => ({
        ...item,
        status: "Approved",
        reviewedAt,
        reviewedBy: "Recruiter Ops",
        reviewSummary: reviewSummary || "Approved for record.",
      }))
    );
    const current = itemsRef.current.find((item) => item.id === itemId);
    if (current) {
      appendCandidateReviewUpdate(
        current,
        "Approved",
        reviewSummary || "Approved for record.",
        "Recruiter Ops"
      );
      recordAdminAuditEvent({
        actor: "Recruiter Ops",
        actorRole: "Recruiter",
        action: "Approved candidate document",
        target: current.id,
        category: "records",
        detail: `${current.candidateAlias} ${current.docType} approved.`,
        sourceModule: "recruiter-docs-inbox",
        entityType: "candidate_document",
        entityId: current.id,
      });
    }
  }, []);

  const requestActionForItem = useCallback((itemId, reviewSummary) => {
    const reviewedAt = getReviewTimestamp();
    setItems((prev) =>
      setInboxItem(prev, itemId, (item) => ({
        ...item,
        status: "Needs Action",
        reviewedAt,
        reviewedBy: "Recruiter Ops",
        reviewSummary: reviewSummary || "Additional information is required.",
      }))
    );
    const current = itemsRef.current.find((item) => item.id === itemId);
    if (current) {
      appendCandidateReviewUpdate(
        current,
        "Needs Action",
        reviewSummary || "Additional information is required.",
        "Recruiter Ops"
      );
      recordAdminAuditEvent({
        actor: "Recruiter Ops",
        actorRole: "Recruiter",
        action: "Requested candidate document action",
        target: current.id,
        category: "records",
        detail: `${current.candidateAlias} ${current.docType} marked as needs action.`,
        sourceModule: "recruiter-docs-inbox",
        entityType: "candidate_document",
        entityId: current.id,
      });
    }
  }, []);

  const markInboxItemReviewed = useCallback((itemId, reviewSummary) => {
    const reviewedAt = getReviewTimestamp();
    setItems((prev) =>
      setInboxItem(prev, itemId, (item) => ({
        ...item,
        reviewedAt,
        reviewedBy: "Recruiter Ops",
        reviewSummary: reviewSummary || "Reviewed by recruiter.",
      }))
    );
    const current = itemsRef.current.find((item) => item.id === itemId);
    if (current) {
      appendCandidateReviewUpdate(
        current,
        current.status,
        reviewSummary || "Reviewed by recruiter.",
        "Recruiter Ops"
      );
      recordAdminAuditEvent({
        actor: "Recruiter Ops",
        actorRole: "Recruiter",
        action: "Reviewed candidate document",
        target: current.id,
        category: "records",
        detail: `${current.candidateAlias} ${current.docType} reviewed.`,
        sourceModule: "recruiter-docs-inbox",
        entityType: "candidate_document",
        entityId: current.id,
      });
    }
  }, []);

  const value = useMemo(
    () => ({
      items,
      statuses: candidateDocStatuses,
      refreshInbox: syncFromQueue,
      approveInboxItem,
      requestActionForItem,
      markInboxItemReviewed,
    }),
    [items, syncFromQueue, approveInboxItem, requestActionForItem, markInboxItemReviewed]
  );

  return (
    <RecruiterDocsInboxContext.Provider value={value}>
      {children}
    </RecruiterDocsInboxContext.Provider>
  );
}

export function useRecruiterDocsInbox() {
  const context = useContext(RecruiterDocsInboxContext);

  if (!context) {
    throw new Error(
      "useRecruiterDocsInbox must be used within a RecruiterDocsInboxProvider"
    );
  }

  return context;
}
