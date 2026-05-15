import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PageFrame } from "../../components/layout/ShellPrimitives";
import UploadDropzone, {
  validateResumeFile,
} from "../../components/candidate/UploadDropzone";
import { useAuth } from "../../context/AuthContext";
import { useCandidate201Files } from "../../context/Candidate201FilesContext";
import { useRecruitmentData } from "../../context/RecruitmentDataContext";
import { writeStoredResumeProfile } from "../../lib/candidateProfileStorage";
import { buildResumeBaselineFromParsed } from "../../lib/resumeExtractionMocks";
import {
  candidate201Statuses,
  get201StatusTone,
} from "../../lib/digitalFileStatusConfig";

const stageOrder = ["idle", "uploading", "parsing", "complete"];
const docStageOrder = ["idle", "uploading", "complete"];
const requiredDocOrder = [
  "Government ID",
  "Tax Form 2316",
  "Employment Contract",
  "Emergency Contact Sheet",
];
const ACCEPTED_DOC_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);
const ACCEPTED_DOC_EXTENSIONS = [".pdf", ".docx", ".jpg", ".jpeg", ".png"];

function getStageLabel(stage) {
  if (stage === "uploading") return "Uploading...";
  if (stage === "parsing") return "Parsing with AI...";
  if (stage === "complete") return "Complete";
  return "Ready for upload";
}

function getDocStageLabel(stage) {
  if (stage === "uploading") return "Uploading...";
  if (stage === "complete") return "Complete";
  return "Ready for upload";
}

function buildMockParsedData(fileName) {
  return {
    fileName,
    skills: [
      "React.js",
      "JavaScript (ES6+)",
      "Tailwind CSS",
      "REST API Integration",
      "UI Accessibility (WCAG)",
    ],
    experience: [
      "3+ years as Frontend Developer in SaaS products",
      "Built recruiter-facing dashboards with data visualizations",
      "Partnered with product and design in agile delivery cycles",
    ],
    education: [
      "BS Computer Science",
      "Frontend-focused bootcamp certification",
    ],
  };
}

function extractYearsExperience(experienceItems) {
  if (!Array.isArray(experienceItems)) return 3;

  const match = experienceItems
    .map((item) => String(item || ""))
    .join(" ")
    .match(/(\d+)\+?\s*years?/i);

  if (!match) return 3;

  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) && value > 0 ? value : 3;
}

function formatFileSize(sizeInBytes) {
  if (!Number.isFinite(sizeInBytes) || sizeInBytes <= 0) return "N/A";
  if (sizeInBytes >= 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`;
}

function formatDate(value) {
  if (!value) return "Not yet uploaded";
  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) return value;
  return asDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateValue(value) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function hasAllowedExtension(fileName = "") {
  const lower = fileName.toLowerCase();
  return ACCEPTED_DOC_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

function validateCandidateDocFile(file) {
  if (!file) {
    return { ok: false, message: "Please select a file to upload." };
  }

  const isAllowedType = ACCEPTED_DOC_MIME_TYPES.has(file.type);
  const isAllowedExtension = hasAllowedExtension(file.name);

  if (!isAllowedType && !isAllowedExtension) {
    return {
      ok: false,
      message: "Only PDF, DOCX, JPG, and PNG files are allowed for onboarding docs.",
    };
  }

  return { ok: true };
}

function StageIndicator({ currentStage, uploadProgress }) {
  return (
    <div className="surface-card p-5">
      <p className="section-heading">Upload Status</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {stageOrder.slice(1).map((stage) => {
          const stageIndex = stageOrder.indexOf(stage);
          const currentIndex = stageOrder.indexOf(currentStage);
          const active = currentIndex >= stageIndex;

          return (
            <div
              key={stage}
              className={[
                "rounded-2xl border px-4 py-3 text-sm",
                active
                  ? "border-blue-200 bg-blue-50 text-blue-800"
                  : "border-slate-200 bg-white text-slate-500",
              ].join(" ")}
            >
              {getStageLabel(stage)}
            </div>
          );
        })}
      </div>

      {currentStage === "uploading" ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
            <span>File transfer progress</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Candidate201DocCard({
  doc,
  uploadState,
  onFilePicked,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onClearUpload,
}) {
  const tone = get201StatusTone(doc.status);
  const inputId = `doc-upload-${doc.docType.replace(/\s+/g, "-").toLowerCase()}`;
  const isBusy = uploadState.stage === "uploading";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{doc.docType}</h3>
          <p className="mt-1 text-xs text-slate-500">
            Last updated: {formatDate(doc.lastUpdated)}
          </p>
        </div>
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-semibold",
            tone.pill,
          ].join(" ")}
        >
          {doc.status}
        </span>
      </div>

      <div
        className={[
          "mt-4 rounded-2xl border-2 border-dashed p-4 transition",
          uploadState.dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-slate-50",
          isBusy ? "opacity-80" : "",
        ].join(" ")}
        onDragEnter={(event) => onDragEnter(doc.docType, event)}
        onDragLeave={(event) => onDragLeave(doc.docType, event)}
        onDragOver={onDragOver}
        onDrop={(event) => onDrop(doc.docType, event)}
      >
        <input
          id={inputId}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
          disabled={isBusy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onFilePicked(doc.docType, file);
            }
            event.target.value = "";
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            Drag and drop a file, or use the upload button.
          </p>
          <label
            htmlFor={inputId}
            className={[
              "cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold transition",
              isBusy
                ? "bg-slate-200 text-slate-500"
              : "bg-slate-900 text-white hover:bg-slate-800",
            ].join(" ")}
          >
            {isBusy ? "Uploading..." : doc.fileName ? "Replace File" : "Upload File"}
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {docStageOrder.slice(1).map((stage) => {
            const stageIndex = docStageOrder.indexOf(stage);
            const currentIndex = docStageOrder.indexOf(uploadState.stage || "idle");
            const active = currentIndex >= stageIndex;

            return (
              <span
                key={stage}
                className={[
                  "rounded-full px-2 py-1 font-medium",
                  active
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {getDocStageLabel(stage)}
              </span>
            );
          })}
        </div>

        {uploadState.stage === "uploading" ? (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-600">
              <span>Transfer progress</span>
              <span>{uploadState.progress || 0}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${uploadState.progress || 0}%` }}
              />
            </div>
          </div>
        ) : null}

        {uploadState.statusMessage ? (
          <p className="mt-3 text-xs text-blue-700">{uploadState.statusMessage}</p>
        ) : null}
        {uploadState.errorMessage ? (
          <p className="mt-3 text-xs text-red-700">{uploadState.errorMessage}</p>
        ) : null}
      </div>

      {doc.fileName ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <p>
            Latest file: <span className="font-medium">{doc.fileName}</span>
          </p>
          <button
            type="button"
            onClick={() => onClearUpload(doc.docType)}
            className="rounded-lg border border-slate-300 px-2 py-1 font-medium text-slate-700 transition hover:border-slate-400"
          >
            Clear
          </button>
        </div>
      ) : null}
    </article>
  );
}

function ParsedDataCard({ parsed }) {
  return (
    <section className="surface-card p-6">
      <p className="section-heading">Parsed Resume Review</p>
      <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        Extraction complete for <span className="font-semibold">{parsed.fileName}</span>.
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Skills</h3>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-700">
            {parsed.skills.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Experience</h3>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-700">
            {parsed.experience.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Education</h3>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-700">
            {parsed.education.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to="/account/profile"
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Edit Profile
        </Link>
      </div>
    </section>
  );
}

export default function CandidateDashboard() {
  const { session } = useAuth();
  const { getApplicationsForCandidate } = useRecruitmentData();
  const [dragActive, setDragActive] = useState(false);
  const [stage, setStage] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const [docUploadStates, setDocUploadStates] = useState({});
  const [docNotice, setDocNotice] = useState("");
  const { docs, submitDoc, setDocStatus } = useCandidate201Files();
  const timersRef = useRef([]);
  const docTimersRef = useRef({});
  const [lastSeenUpdates, setLastSeenUpdates] = useState("");
  const applications = useMemo(
    () => getApplicationsForCandidate(session?.email || ""),
    [getApplicationsForCandidate, session?.email]
  );

  const isBusy = stage === "uploading" || stage === "parsing";

  const currentStageLabel = useMemo(() => getStageLabel(stage), [stage]);
  const newestApplicationUpdate = useMemo(() => {
    return applications.reduce((latest, application) => {
      const marker = application?.updatedOn || application?.appliedOn || "";
      return toDateValue(marker) > toDateValue(latest) ? marker : latest;
    }, "");
  }, [applications]);

  const hasUnreadUpdates = useMemo(() => {
    return toDateValue(newestApplicationUpdate) > toDateValue(lastSeenUpdates);
  }, [lastSeenUpdates, newestApplicationUpdate]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => {
      window.clearTimeout(timer);
      window.clearInterval(timer);
    });
    timersRef.current = [];
  }, []);

  const clearDocTimers = useCallback((docType) => {
    const docTimers = docTimersRef.current[docType];
    if (!docTimers?.length) return;

    docTimers.forEach((timer) => {
      window.clearTimeout(timer);
      window.clearInterval(timer);
    });
    docTimersRef.current[docType] = [];
  }, []);

  const clearAllDocTimers = useCallback(() => {
    Object.keys(docTimersRef.current).forEach((docType) => {
      clearDocTimers(docType);
    });
  }, [clearDocTimers]);

  useEffect(
    () => () => {
      clearTimers();
      clearAllDocTimers();
    },
    [clearTimers, clearAllDocTimers]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !session?.email) return;

    const markerKey = `lastSeenCandidateUpdates:${session.email}`;
    const stored = window.localStorage.getItem(markerKey) || "";
    setLastSeenUpdates(stored);
  }, [session?.email]);

  const processFile = (file) => {
    const validation = validateResumeFile(file);
    if (!validation.ok) {
      setErrorMessage(validation.message);
      setStatusMessage("");
      setParsedData(null);
      setStage("idle");
      setUploadProgress(0);
      return;
    }

    clearTimers();
    setErrorMessage("");
    setParsedData(null);
    setStatusMessage("Uploading your resume securely...");
    setStage("uploading");
    setUploadProgress(0);

    const uploadInterval = window.setInterval(() => {
      setUploadProgress((prev) => {
        const next = Math.min(prev + 8, 100);
        if (next >= 100) {
          window.clearInterval(uploadInterval);
          setStage("parsing");
          setStatusMessage("Parsing with AI and extracting profile signals...");

          const parseTimer = window.setTimeout(() => {
            const parsed = buildMockParsedData(file.name);
            const resumeBaseline = buildResumeBaselineFromParsed(parsed);
            setStage("complete");
            setStatusMessage("Resume processed successfully.");
            setParsedData(parsed);

            if (typeof window !== "undefined" && session?.email) {
              writeStoredResumeProfile(session.email, resumeBaseline);
            }
          }, 1800);

          timersRef.current.push(parseTimer);
        }
        return next;
      });
    }, 150);

    timersRef.current.push(uploadInterval);
  };

  const setDocUploadState = useCallback((docType, patch) => {
    setDocUploadStates((prev) => ({
      ...prev,
      [docType]: {
        stage: "idle",
        progress: 0,
        statusMessage: "",
        errorMessage: "",
        dragActive: false,
        ...(prev[docType] || {}),
        ...patch,
      },
    }));
  }, []);

  const processCandidateDoc = useCallback(
    (docType, file) => {
      const validation = validateCandidateDocFile(file);
      if (!validation.ok) {
        setDocUploadState(docType, {
          stage: "idle",
          progress: 0,
          statusMessage: "",
          errorMessage: validation.message,
          dragActive: false,
        });
        return;
      }

      clearDocTimers(docType);
      setDocUploadState(docType, {
        stage: "uploading",
        progress: 0,
        statusMessage: "Uploading onboarding document securely...",
        errorMessage: "",
        dragActive: false,
      });

      const uploadInterval = window.setInterval(() => {
        setDocUploadStates((prev) => {
          const current = prev[docType] || {};
          const nextProgress = Math.min((current.progress || 0) + 10, 100);

          if (nextProgress >= 100) {
            window.clearInterval(uploadInterval);
            submitDoc(docType, {
              name: file.name,
              size: formatFileSize(file.size),
              sizeInBytes: file.size,
              type: file.type,
            });
            setDocNotice(`${docType} uploaded and marked as submitted.`);

            return {
              ...prev,
              [docType]: {
                ...current,
                stage: "complete",
                progress: 100,
                statusMessage: "Upload complete. Waiting for HR review.",
                errorMessage: "",
                dragActive: false,
              },
            };
          }

          return {
            ...prev,
            [docType]: {
              ...current,
              stage: "uploading",
              progress: nextProgress,
              statusMessage: "Uploading onboarding document securely...",
              errorMessage: "",
              dragActive: false,
            },
          };
        });
      }, 120);

      docTimersRef.current[docType] = [
        ...(docTimersRef.current[docType] || []),
        uploadInterval,
      ];
    },
    [clearDocTimers, setDocUploadState, submitDoc]
  );

  const handleDocDragEnter = (docType, event) => {
    event.preventDefault();
    if (docUploadStates[docType]?.stage === "uploading") return;
    setDocUploadState(docType, { dragActive: true });
  };

  const handleDocDragLeave = (docType, event) => {
    event.preventDefault();
    if (docUploadStates[docType]?.stage === "uploading") return;
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDocUploadState(docType, { dragActive: false });
    }
  };

  const handleDocDragOver = (event) => {
    event.preventDefault();
  };

  const handleDocDrop = (docType, event) => {
    event.preventDefault();
    if (docUploadStates[docType]?.stage === "uploading") return;
    setDocUploadState(docType, { dragActive: false });
    const file = event.dataTransfer.files?.[0];
    if (file) processCandidateDoc(docType, file);
  };

  const sortedDocs = useMemo(() => {
    const byType = new Map(docs.map((doc) => [doc.docType, doc]));

    const ordered = requiredDocOrder
      .map((docType) => byType.get(docType))
      .filter(Boolean);

    docs.forEach((doc) => {
      if (!requiredDocOrder.includes(doc.docType)) ordered.push(doc);
    });

    return ordered;
  }, [docs]);

  const docStats = useMemo(() => {
    return candidate201Statuses.reduce((acc, status) => {
      acc[status] = docs.filter((doc) => doc.status === status).length;
      return acc;
    }, {});
  }, [docs]);

  const checklistRows = useMemo(() => {
    return requiredDocOrder.map((docType) => {
      const doc = docs.find((item) => item.docType === docType);
      return (
        doc || {
          docType,
          status: "Missing",
          lastUpdated: "",
          fileName: "",
          notes: "Not uploaded yet.",
        }
      );
    });
  }, [docs]);

  const handleClearDoc = useCallback(
    (docType) => {
      setDocStatus(
        docType,
        "Missing",
        "Document removed by candidate. Please upload a fresh copy."
      );
      setDocNotice(`${docType} was reset to missing.`);
      setDocUploadState(docType, {
        stage: "idle",
        progress: 0,
        statusMessage: "",
        errorMessage: "",
        dragActive: false,
      });
    },
    [setDocStatus, setDocUploadState]
  );

  const handleDragEnter = (event) => {
    event.preventDefault();
    if (isBusy) return;
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    if (isBusy) return;
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDragActive(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (isBusy) return;
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <PageFrame size="standard">
      <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Candidate Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Resume Upload and Parsing Feedback
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Upload your latest resume. We will simulate document upload, AI parsing,
          and show extracted skills, experience, and education for review.
        </p>
      </section>

      {hasUnreadUpdates ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <p className="text-sm font-semibold uppercase tracking-[0.14em]">Status Updates</p>
          <p className="mt-2 text-sm">
            You have new application updates waiting in your tracker.
          </p>
          <div className="mt-4">
            <Link
              to="/candidate/applications"
              className="inline-flex rounded-2xl bg-amber-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
            >
              View updates
            </Link>
          </div>
        </section>
      ) : null}

      <UploadDropzone
        dragActive={dragActive}
        disabled={isBusy}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onFileSelected={processFile}
      />

      <StageIndicator currentStage={stage} uploadProgress={uploadProgress} />

      {statusMessage ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Current state: <span className="font-semibold">{currentStageLabel}</span>.{" "}
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {parsedData ? <ParsedDataCard parsed={parsedData} /> : null}

      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">My Onboarding Documents</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Digital 201 Files (Onboarding Docs)
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          This is your personal onboarding checklist only. Recruiters manage a separate
          employee file vault view.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {candidate201Statuses.map((status) => {
            const tone = get201StatusTone(status);
            return (
              <article
                key={status}
                className={[
                  "rounded-2xl border px-4 py-3",
                  tone.card,
                ].join(" ")}
              >
                <p className="text-xs uppercase tracking-[0.14em] text-slate-600">{status}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {docStats[status] || 0}
                </p>
              </article>
            );
          })}
        </div>

        {docNotice ? (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {docNotice}
          </div>
        ) : null}
      </section>

      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="section-heading">Document Grid</p>
          <p className="text-xs text-slate-500">
            Required: Government ID, tax form, contract, emergency contact
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {sortedDocs.map((doc) => (
            <Candidate201DocCard
              key={doc.docType}
              doc={doc}
              uploadState={docUploadStates[doc.docType] || {}}
              onFilePicked={processCandidateDoc}
              onDragEnter={handleDocDragEnter}
              onDragLeave={handleDocDragLeave}
              onDragOver={handleDocDragOver}
              onDrop={handleDocDrop}
              onClearUpload={handleClearDoc}
            />
          ))}
        </div>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <p className="section-heading">Checklist</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
          Required 201 Document Checklist
        </h2>
        <div className="mt-5 space-y-3">
          {checklistRows.map((doc) => {
            const tone = get201StatusTone(doc.status);
            const complete = doc.status === "Approved" || doc.status === "Submitted";

            return (
              <article
                key={doc.docType}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{doc.docType}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Last updated: {formatDate(doc.lastUpdated)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        tone.pill,
                      ].join(" ")}
                    >
                      {doc.status}
                    </span>
                    <span
                      className={[
                        "rounded-full px-2 py-1 text-[11px] font-semibold",
                        complete
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700",
                      ].join(" ")}
                    >
                      {complete ? "On Track" : "Action Needed"}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-800">Review note:</span>{" "}
                  {doc.notes || "No note yet."}
                </p>
              </article>
            );
          })}
        </div>
      </section>
      </div>
    </PageFrame>
  );
}

