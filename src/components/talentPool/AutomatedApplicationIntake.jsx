import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UploadDropzone, { validateResumeFile } from "../candidate/UploadDropzone";
import {
  buildMockParsedData,
  buildResumeBaselineFromParsed,
} from "../../lib/resumeExtractionMocks";

function titleCaseWords(value) {
  return String(value || "")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function deriveCandidateNameFromFileName(fileName = "") {
  const withoutExtension = String(fileName || "").replace(/\.[^/.]+$/, "");
  const normalized = withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const titled = titleCaseWords(normalized);
  return titled || "Candidate";
}

export default function AutomatedApplicationIntake({
  pools,
  addCandidateFromResumeUpload,
  onCandidateAdded,
}) {
  const availablePools = Array.isArray(pools) ? pools : [];
  const hasPools = availablePools.length > 0;
  const [selectedPoolId, setSelectedPoolId] = useState(() => availablePools[0]?.id || "");
  const [stage, setStage] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const timersRef = useRef([]);

  useEffect(() => {
    if (hasPools) {
      setSelectedPoolId((prev) => prev || availablePools[0]?.id || "");
    } else {
      setSelectedPoolId("");
    }
  }, [availablePools, hasPools]);

  const isBusy = stage === "uploading" || stage === "parsing";

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => {
      window.clearTimeout(timer);
      window.clearInterval(timer);
    });
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const poolOptions = useMemo(
    () => availablePools.map((pool) => ({ id: pool.id, label: `${pool.id} • ${pool.department}` })),
    [availablePools]
  );

  const processFile = (file) => {
    if (!hasPools) return;

    const validation = validateResumeFile(file);
    if (!validation.ok) {
      setErrorMessage(validation.message);
      setStatusMessage("");
      setStage("idle");
      setUploadProgress(0);
      return;
    }

    clearTimers();
    setErrorMessage("");
    setStatusMessage("Uploading resume for automated intake...");
    setStage("uploading");
    setUploadProgress(0);

    const uploadInterval = window.setInterval(() => {
      setUploadProgress((prev) => {
        const next = Math.min(prev + 10, 100);
        if (next >= 100) {
          window.clearInterval(uploadInterval);
          setStage("parsing");
          setStatusMessage("Parsing resume and generating candidate profile...");

          const parseTimer = window.setTimeout(() => {
            try {
              const parsed = buildMockParsedData(file.name);
              const baseline = buildResumeBaselineFromParsed(parsed);
              const candidateName = deriveCandidateNameFromFileName(file.name);

              const result = addCandidateFromResumeUpload({
                name: candidateName,
                email: "",
                location: "Remote",
                availability: "Immediate",
                skills: baseline.skills,
                tags: ["ResumeUpload"],
                poolIds: selectedPoolId ? [selectedPoolId] : [],
                status: "New",
                confidence: 70,
                note: `Imported from resume upload: ${baseline.fileName}.`,
              });

              if (!result?.ok) {
                setStage("idle");
                setStatusMessage("");
                setUploadProgress(0);
                setErrorMessage(result?.message || "Unable to add candidate from resume.");
                return;
              }

              setStage("complete");
              setStatusMessage(`Added ${result.candidate.name} from resume upload.`);
              setUploadProgress(100);
              onCandidateAdded?.(result.candidate);
            } catch (error) {
              setStage("idle");
              setStatusMessage("");
              setUploadProgress(0);
              setErrorMessage(
                error instanceof Error ? error.message : "Resume intake failed."
              );
            }
          }, 1400);

          timersRef.current.push(parseTimer);
        }
        return next;
      });
    }, 140);

    timersRef.current.push(uploadInterval);
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    if (isBusy || !hasPools) return;
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (isBusy || !hasPools) return;
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    if (isBusy || !hasPools) return;
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <article className="surface-card p-6">
      <h2 className="text-lg font-semibold text-slate-950">Automated Application Intake</h2>
      <p className="mt-1 text-sm text-slate-600">
        Upload a resume to auto-generate a candidate profile and add it to a pool.
      </p>

      {!hasPools ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Assign at least one pool to enable automated intake.
        </div>
      ) : (
        <label className="mt-4 block space-y-2 text-sm text-slate-700">
          <span className="font-medium">Target pool</span>
          <select
            value={selectedPoolId}
            onChange={(event) => setSelectedPoolId(event.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            disabled={isBusy}
          >
            {poolOptions.map((pool) => (
              <option key={pool.id} value={pool.id}>
                {pool.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="mt-4">
        <UploadDropzone
          dragActive={dragActive}
          disabled={!hasPools || isBusy}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onFileSelected={processFile}
        />
      </div>

      {isBusy ? (
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {statusMessage} {uploadProgress ? `(${uploadProgress}%)` : ""}
        </div>
      ) : statusMessage ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
    </article>
  );
}

