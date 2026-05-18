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
import {
  getSavedJobsKey,
  mergeGuestSavedIntoUser,
  readSavedJobIds,
  writeSavedJobIds,
} from "../lib/savedJobsStorage";

const SavedJobsContext = createContext(null);

function resolveIdentity(session, isAuthenticated) {
  const email = String(session?.email || "").trim().toLowerCase();
  if (isAuthenticated && email) return email;
  return "guest";
}

export function SavedJobsProvider({ children }) {
  const { session, isAuthenticated } = useAuth();
  const identity = useMemo(
    () => resolveIdentity(session, isAuthenticated),
    [isAuthenticated, session?.email]
  );

  const [savedJobIds, setSavedJobIds] = useState(() => readSavedJobIds(identity));
  const previousIdentityRef = useRef(identity);

  const savedJobIdSet = useMemo(() => new Set(savedJobIds), [savedJobIds]);

  useEffect(() => {
    const previousIdentity = previousIdentityRef.current;
    if (previousIdentity === identity) return;

    if (previousIdentity === "guest" && identity !== "guest") {
      mergeGuestSavedIntoUser(previousIdentity, identity);
    }

    setSavedJobIds(readSavedJobIds(identity));
    previousIdentityRef.current = identity;
  }, [identity]);

  useEffect(() => {
    writeSavedJobIds(identity, savedJobIds);
  }, [identity, savedJobIds]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleStorage = (event) => {
      if (!event?.key) return;
      if (event.key !== getSavedJobsKey(identity)) return;
      setSavedJobIds(readSavedJobIds(identity));
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [identity]);

  const isSaved = useCallback(
    (jobId) => savedJobIdSet.has(String(jobId || "").trim()),
    [savedJobIdSet]
  );

  const save = useCallback((jobId) => {
    const normalized = String(jobId || "").trim();
    if (!normalized) return;

    setSavedJobIds((prev) => {
      if (prev.includes(normalized)) return prev;
      return [normalized, ...prev];
    });
  }, []);

  const unsave = useCallback((jobId) => {
    const normalized = String(jobId || "").trim();
    if (!normalized) return;

    setSavedJobIds((prev) => prev.filter((id) => id !== normalized));
  }, []);

  const toggleSaved = useCallback(
    (jobId) => {
      const normalized = String(jobId || "").trim();
      if (!normalized) return;

      setSavedJobIds((prev) => {
        if (prev.includes(normalized)) {
          return prev.filter((id) => id !== normalized);
        }
        return [normalized, ...prev];
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      savedJobIds,
      isSaved,
      save,
      unsave,
      toggleSaved,
    }),
    [savedJobIds, isSaved, save, unsave, toggleSaved]
  );

  return (
    <SavedJobsContext.Provider value={value}>{children}</SavedJobsContext.Provider>
  );
}

export function useSavedJobs() {
  const context = useContext(SavedJobsContext);

  if (!context) {
    throw new Error("useSavedJobs must be used within a SavedJobsProvider");
  }

  return context;
}
