import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { recordAdminAuditEvent } from "../lib/adminMockData";
import {
  cloneDigitalFile,
  createDigitalFile,
  digitalFilesSeed,
} from "../lib/digitalFilesMockData";

const DigitalFilesContext = createContext(null);

export function DigitalFilesProvider({ children }) {
  const { session } = useAuth();
  const [files, setFiles] = useState(() => digitalFilesSeed.map(cloneDigitalFile));

  const addFile = useCallback((payload) => {
    const nextFile = createDigitalFile(payload);
    setFiles((prev) => [nextFile, ...prev]);
    return nextFile;
  }, []);

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
        action: "Updated digital file status",
        target: currentFile.id,
        category: "records",
        detail: detailParts.join(" "),
      });
    }

    return { ok: true };
  }, [files, session]);

  const value = useMemo(
    () => ({
      files,
      addFile,
      updateFileStatus,
    }),
    [files, addFile, updateFileStatus]
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
