import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { recordAdminAuditEvent } from "../lib/adminMockData";
import { createVersionedStorageAdapter } from "../lib/versionedStorage";
import {
  cloneDigitalFile,
  createDigitalFile,
  digitalFilesSeed,
} from "../lib/digitalFilesMockData";

const DigitalFilesContext = createContext(null);
const DIGITAL_FILES_STORAGE_KEY = "digital_files_state_v2";
const DIGITAL_FILES_SCHEMA_VERSION = 2;

function normalizeFiles(value) {
  const files = Array.isArray(value) ? value : [];
  return files.map((file) => cloneDigitalFile(file));
}

function createDigitalFilesStorageAdapter() {
  return createVersionedStorageAdapter({
    key: DIGITAL_FILES_STORAGE_KEY,
    version: DIGITAL_FILES_SCHEMA_VERSION,
    seed: () => digitalFilesSeed.map(cloneDigitalFile),
    migrate: (legacyValue) => {
      const migrated = normalizeFiles(legacyValue);
      return migrated.length > 0 ? migrated : digitalFilesSeed.map(cloneDigitalFile);
    },
  });
}

export function DigitalFilesProvider({ children }) {
  const { session } = useAuth();
  const storageAdapter = useMemo(() => createDigitalFilesStorageAdapter(), []);
  const [files, setFiles] = useState(() => {
    const stored = normalizeFiles(storageAdapter.read());
    return stored.length > 0 ? stored : digitalFilesSeed.map(cloneDigitalFile);
  });

  React.useEffect(() => {
    storageAdapter.save(files);
  }, [files, storageAdapter]);

  const addFile = useCallback((payload) => {
    const nextFile = createDigitalFile(payload);
    setFiles((prev) => [nextFile, ...prev]);
    recordAdminAuditEvent({
      actor: session?.name || session?.email || "Recruiter Ops",
      actorRole: session?.role || "Recruiter",
      action: "Added digital file record",
      target: nextFile.id,
      category: "records",
      detail: `${nextFile.employeeName} (${nextFile.employeeId}) was added to Digital 201 vault.`,
      sourceModule: "digital-files",
      entityType: "digital_file",
      entityId: nextFile.id,
    });
    return nextFile;
  }, [session]);

  const upsertFileForApplication = useCallback((application, payload = {}) => {
    const applicationId = String(application?.id || "").trim();
    if (!applicationId) {
      return { ok: false, message: "Application id is required." };
    }

    const employeeId = payload.employeeId || `EMP-${applicationId.slice(-4)}`;
    const matchIndex = files.findIndex((file) => {
      if (String(file.sourceApplicationId || "").trim() === applicationId) return true;
      const byEmployeeId = String(file.employeeId || "").trim();
      return Boolean(byEmployeeId && byEmployeeId === employeeId);
    });

    if (matchIndex >= 0) {
      const existing = files[matchIndex];
      return { ok: true, file: existing, created: false };
    }

    const nextFile = createDigitalFile({
      employeeName: application.candidateName,
      employeeId,
      department: payload.department || "Onboarding",
      notes:
        payload.notes ||
        `Onboarding finalized via lifecycle automation for ${application.jobTitle}.`,
    });
    nextFile.sourceApplicationId = applicationId;
    nextFile.personKey = payload.personKey || "";
    nextFile.candidateEmail = String(application?.candidateEmail || "").trim().toLowerCase();
    setFiles((prev) => [nextFile, ...prev]);

    recordAdminAuditEvent({
      actor: payload.actor || session?.name || session?.email || "System",
      actorRole: payload.actorRole || session?.role || "System",
      action: "Lifecycle upserted digital file record",
      target: nextFile.id,
      category: "records",
      detail: `Lifecycle linked ${nextFile.employeeName} (${applicationId}) to Digital 201 vault.`,
      sourceModule: "lifecycle",
      entityType: "digital_file",
      entityId: nextFile.id,
      correlationId: payload.correlationId || "",
    });

    return { ok: true, file: nextFile, created: true };
  }, [files, session]);

  const updateFileStatus = useCallback((fileId, status, reviewSummary) => {
    const currentFile = files.find((file) => file.id === fileId);
    if (!currentFile) {
      return { ok: false, message: "File not found." };
    }

    const previousStatus = currentFile.status;
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              status,
              lastReviewedOn: new Date().toISOString().slice(0, 10),
              reviewer: "HR Ops",
              reviewSummary: reviewSummary || file.reviewSummary,
            }
          : file
      )
    );

    if (previousStatus !== status) {
      const actor = session?.name || session?.email || "Recruiter Ops";
      const detailParts = [
        `${currentFile.employeeName} (${currentFile.id}) moved from ${previousStatus} to ${status}.`,
      ];
      if (reviewSummary) {
        detailParts.push(`Summary: ${reviewSummary}`);
      }

      recordAdminAuditEvent({
        actor,
        actorRole: session?.role || "Recruiter",
        action: "Updated digital file status",
        target: currentFile.id,
        category: "records",
        detail: detailParts.join(" "),
        sourceModule: "digital-files",
        entityType: "digital_file",
        entityId: currentFile.id,
      });
    }

    return { ok: true };
  }, [files, session]);

  const value = useMemo(
    () => ({
      files,
      addFile,
      upsertFileForApplication,
      updateFileStatus,
    }),
    [files, addFile, upsertFileForApplication, updateFileStatus]
  );

  return (
    <DigitalFilesContext.Provider value={value}>
      {children}
    </DigitalFilesContext.Provider>
  );
}

export function useDigitalFiles() {
  const context = useContext(DigitalFilesContext);

  if (!context) {
    throw new Error("useDigitalFiles must be used within a DigitalFilesProvider");
  }

  return context;
}
