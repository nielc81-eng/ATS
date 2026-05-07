import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UploadDropzone, {
  validateResumeFile,
} from "../../components/candidate/UploadDropzone";

const stageOrder = ["idle", "uploading", "parsing", "complete"];

function getStageLabel(stage) {
  if (stage === "uploading") return "Uploading...";
  if (stage === "parsing") return "Parsing with AI...";
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
    </section>
  );
}

export default function CandidateDashboard() {
  const [dragActive, setDragActive] = useState(false);
  const [stage, setStage] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const timersRef = useRef([]);

  const isBusy = stage === "uploading" || stage === "parsing";

  const currentStageLabel = useMemo(() => getStageLabel(stage), [stage]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => {
      window.clearTimeout(timer);
      window.clearInterval(timer);
    });
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

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
            setStage("complete");
            setStatusMessage("Resume processed successfully.");
            setParsedData(buildMockParsedData(file.name));
          }, 1800);

          timersRef.current.push(parseTimer);
        }
        return next;
      });
    }, 150);

    timersRef.current.push(uploadInterval);
  };

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
    </div>
  );
}

