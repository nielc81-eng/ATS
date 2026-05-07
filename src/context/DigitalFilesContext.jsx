import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  cloneDigitalFile,
  createDigitalFile,
  digitalFilesSeed,
} from "../lib/digitalFilesMockData";

const DigitalFilesContext = createContext(null);

export function DigitalFilesProvider({ children }) {
  const [files, setFiles] = useState(() => digitalFilesSeed.map(cloneDigitalFile));

  const addFile = useCallback((payload) => {
    const nextFile = createDigitalFile(payload);
    setFiles((prev) => [nextFile, ...prev]);
    return nextFile;
  }, []);

  const updateFileStatus = useCallback((fileId, status, reviewSummary) => {
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
  }, []);

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

