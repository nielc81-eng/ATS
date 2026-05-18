import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { candidate201Statuses } from "../lib/digitalFileStatusConfig";
import { buildCanonicalPersonRef } from "../lib/canonicalPerson";
import { createVersionedStorageAdapter } from "../lib/versionedStorage";
import {
  candidate201DocsStateKey,
  candidate201ReviewUpdatesKey,
  CANDIDATE_DOC_QUEUE_EVENT_NAME,
  candidateDocsEventsKey,
  createCandidate201SubmissionEvent,
  getCandidate201SeedDocs,
  toTodayStamp,
} from "../lib/documentSchemas";

const Candidate201FilesContext = createContext(null);
const DEFAULT_ALIAS = "Candidate";
const CANDIDATE_ID_KEY = "candidate_201_identity_v1";
const CANDIDATE_DOCS_SCHEMA_VERSION = 2;
const CANDIDATE_DOCS_STORAGE_PREFIX = "candidate_201_docs_state_v2";

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

function normalizeDocs(value) {
  const docs = Array.isArray(value) ? value : [];
  const normalized = docs
    .map((doc) => ({
      docType: String(doc?.docType || "").trim(),
      status: candidate201Statuses.includes(doc?.status) ? doc.status : "Missing",
      lastUpdated:
        typeof doc?.lastUpdated === "string" && doc.lastUpdated.trim()
          ? doc.lastUpdated.trim()
          : toTodayStamp(),
      fileName:
        typeof doc?.fileName === "string" && doc.fileName.trim()
          ? doc.fileName.trim()
          : typeof doc?.fileMeta?.name === "string" && doc.fileMeta.name.trim()
            ? doc.fileMeta.name.trim()
            : "",
      notes:
        typeof doc?.notes === "string"
          ? doc.notes
          : typeof doc?.note === "string"
            ? doc.note
            : "",
    }))
    .filter((doc) => doc.docType);

  return normalized.length > 0 ? normalized : null;
}

function readLegacyDocs(legacyStorageKey) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(legacyStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeDocs(parsed);
  } catch {
    return null;
  }
}

function buildDocsStorageKey(personKey) {
  return `${CANDIDATE_DOCS_STORAGE_PREFIX}:${personKey}`;
}

function createDocsStorageAdapter(storageKey) {
  return createVersionedStorageAdapter({
    key: storageKey,
    version: CANDIDATE_DOCS_SCHEMA_VERSION,
    seed: getCandidate201SeedDocs,
    migrate: (legacyValue) => normalizeDocs(legacyValue) || getCandidate201SeedDocs(),
  });
}

function getIdentity(session) {
  const sessionAlias =
    typeof session?.name === "string" && session.name.trim()
      ? session.name.trim()
      : DEFAULT_ALIAS;
  const sessionEmail =
    typeof session?.email === "string" ? session.email.trim().toLowerCase() : "";
  const sessionId = typeof session?.token === "string" ? session.token.trim() : "";

  const personRef = buildCanonicalPersonRef({
    email: sessionEmail,
    name: sessionAlias,
    legacyId: sessionId,
    role: session?.role,
  });

  if (typeof window === "undefined") {
    return {
      candidateId: sessionId || personRef.personKey,
      candidateAlias: sessionAlias,
      candidateEmail: sessionEmail,
      personKey: personRef.personKey,
    };
  }

  if (sessionEmail) {
    return {
      candidateId: personRef.personKey,
      candidateAlias: sessionAlias,
      candidateEmail: sessionEmail,
      personKey: personRef.personKey,
    };
  }

  try {
    const stored = window.localStorage.getItem(CANDIDATE_ID_KEY);
    if (stored) {
      return {
        candidateId: stored,
        candidateAlias: sessionAlias,
        candidateEmail: "",
        personKey: stored,
      };
    }

    const generated = `cand-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    window.localStorage.setItem(CANDIDATE_ID_KEY, generated);
    return {
      candidateId: generated,
      candidateAlias: sessionAlias,
      candidateEmail: "",
      personKey: generated,
    };
  } catch {
    const fallbackId = `cand-${Date.now().toString(36)}`;
    return {
      candidateId: fallbackId,
      candidateAlias: sessionAlias,
      candidateEmail: "",
      personKey: fallbackId,
    };
  }
}

function getLatestReviewUpdates({ candidateId, candidateEmail, personKey }) {
  const updates = readJsonArray(candidate201ReviewUpdatesKey);
  const normalizedEmail = String(candidateEmail || "").trim().toLowerCase();
  return updates.filter((update) => {
    if (!update) return false;
    if (personKey && String(update.personKey || "").trim() === personKey) return true;
    if (normalizedEmail && String(update.candidateEmail || "").trim().toLowerCase() === normalizedEmail) {
      return true;
    }
    return update.candidateId === candidateId;
  });
}

function mergeReviewUpdates(docs, identity) {
  const updates = getLatestReviewUpdates(identity);
  if (updates.length === 0) return docs;

  const latestByDocType = new Map();

  updates.forEach((update) => {
    const docType = String(update.docType || "").trim();
    if (!docType) return;

    const previous = latestByDocType.get(docType);
    const nextTime = Date.parse(update.reviewedAt || "");
    const previousTime = Date.parse(previous?.reviewedAt || "");

    if (!previous || nextTime >= previousTime) {
      latestByDocType.set(docType, update);
    }
  });

  let changed = false;
  const nextDocs = docs.map((doc) => {
    const review = latestByDocType.get(doc.docType);
    if (!review) return doc;

    const nextStatus = candidate201Statuses.includes(review.status)
      ? review.status
      : doc.status;
    const nextNotes =
      typeof review.note === "string" && review.note.trim()
        ? review.note.trim()
        : doc.notes;
    const nextLastUpdated =
      typeof review.reviewedAt === "string" && review.reviewedAt.trim()
        ? review.reviewedAt.slice(0, 10)
        : doc.lastUpdated;

    if (
      doc.status !== nextStatus ||
      doc.notes !== nextNotes ||
      doc.lastUpdated !== nextLastUpdated
    ) {
      changed = true;
      return {
        ...doc,
        status: nextStatus,
        notes: nextNotes,
        lastUpdated: nextLastUpdated,
      };
    }

    return doc;
  });

  return changed ? nextDocs : docs;
}

export function Candidate201FilesProvider({ children }) {
  const { session } = useAuth();
  const identity = useMemo(() => getIdentity(session), [session]);
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const storageKey = useMemo(() => buildDocsStorageKey(identity.personKey), [identity.personKey]);
  const legacyStorageKey = useMemo(
    () => `${candidate201DocsStateKey}:${identity.candidateId}`,
    [identity.candidateId]
  );
  const storageAdapter = useMemo(() => createDocsStorageAdapter(storageKey), [storageKey]);

  const [docs, setDocs] = useState(() => {
    const nextDocs = normalizeDocs(storageAdapter.read());
    if (nextDocs) return nextDocs;
    const legacyDocs = readLegacyDocs(legacyStorageKey);
    if (legacyDocs) return legacyDocs;
    return getCandidate201SeedDocs();
  });

  useEffect(() => {
    const nextDocs = normalizeDocs(storageAdapter.read());
    if (nextDocs) {
      setDocs(nextDocs);
      return;
    }
    const legacyDocs = readLegacyDocs(legacyStorageKey);
    if (legacyDocs) {
      storageAdapter.save(legacyDocs);
      setDocs(legacyDocs);
      return;
    }
    setDocs(getCandidate201SeedDocs());
  }, [legacyStorageKey, storageAdapter]);

  useEffect(() => {
    storageAdapter.save(docs);
  }, [docs, storageAdapter]);

  const syncReviewUpdates = useCallback(() => {
    setDocs((prev) => mergeReviewUpdates(prev, identityRef.current));
  }, []);

  useEffect(() => {
    syncReviewUpdates();

    const handleStorage = (event) => {
      if (event.key === candidate201ReviewUpdatesKey) {
        syncReviewUpdates();
      }
    };

    window.addEventListener("storage", handleStorage);
    const timer = window.setInterval(syncReviewUpdates, 1500);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(timer);
    };
  }, [syncReviewUpdates]);

  const submitDoc = useCallback((docType, fileMeta = {}) => {
    const normalizedDocType = String(docType || "").trim();
    if (!normalizedDocType) return;

    const fileName =
      typeof fileMeta.name === "string" && fileMeta.name.trim()
        ? fileMeta.name.trim()
        : "uploaded-file";

    setDocs((prev) => {
      const next = [...prev];
      const index = next.findIndex((item) => item.docType === normalizedDocType);
      const nextDoc = {
        docType: normalizedDocType,
        status: "Submitted",
        lastUpdated: toTodayStamp(),
        fileName,
        notes: "Submitted and waiting for recruiter review.",
      };

      if (index >= 0) {
        next[index] = {
          ...next[index],
          ...nextDoc,
        };
      } else {
        next.push(nextDoc);
      }

      return next;
    });

    const event = createCandidate201SubmissionEvent({
      candidateId: identityRef.current.candidateId,
      candidateEmail: identityRef.current.candidateEmail,
      personKey: identityRef.current.personKey,
      candidateAlias: identityRef.current.candidateAlias,
      docType: normalizedDocType,
      fileName,
      fileMeta,
    });

    if (event) {
      const queue = readJsonArray(candidateDocsEventsKey);
      queue.push(event);
      writeJsonArray(candidateDocsEventsKey, queue);
      window.dispatchEvent(
        new CustomEvent(CANDIDATE_DOC_QUEUE_EVENT_NAME, { detail: event })
      );
    }
  }, []);

  const setDocStatus = useCallback((docType, status, note) => {
    const normalizedDocType = String(docType || "").trim();
    if (!normalizedDocType || !candidate201Statuses.includes(status)) return;

    setDocs((prev) =>
      prev.map((doc) =>
        doc.docType === normalizedDocType
          ? {
              ...doc,
              status,
              lastUpdated: toTodayStamp(),
              fileName: status === "Missing" ? "" : doc.fileName,
              notes:
                typeof note === "string" && note.trim() ? note.trim() : doc.notes,
            }
          : doc
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      docs,
      submitDoc,
      setDocStatus,
      candidateId: identity.candidateId,
      candidateAlias: identity.candidateAlias,
      candidateEmail: identity.candidateEmail,
      personKey: identity.personKey,
    }),
    [
      docs,
      submitDoc,
      setDocStatus,
      identity.candidateAlias,
      identity.candidateEmail,
      identity.candidateId,
      identity.personKey,
    ]
  );

  return (
    <Candidate201FilesContext.Provider value={value}>
      {children}
    </Candidate201FilesContext.Provider>
  );
}

export function useCandidate201Files() {
  const context = useContext(Candidate201FilesContext);
  if (!context) {
    throw new Error(
      "useCandidate201Files must be used within a Candidate201FilesProvider"
    );
  }
  return context;
}
