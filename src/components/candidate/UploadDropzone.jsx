import React, { useRef } from "react";

const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];

function hasAllowedExtension(fileName = "") {
  const lower = fileName.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function validateResumeFile(file) {
  if (!file) {
    return { ok: false, message: "Please select a file to upload." };
  }

  const isAllowedType = ACCEPTED_MIME_TYPES.has(file.type);
  const isAllowedExtension = hasAllowedExtension(file.name);

  if (!isAllowedType && !isAllowedExtension) {
    return {
      ok: false,
      message: "Only PDF and DOCX files are allowed.",
    };
  }

  return { ok: true };
}

export default function UploadDropzone({
  dragActive,
  disabled,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelected,
}) {
  const inputRef = useRef(null);

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
    event.target.value = "";
  };

  return (
    <section
      className={[
        "rounded-3xl border-2 border-dashed bg-white p-6 transition sm:p-8",
        dragActive
          ? "border-blue-500 bg-blue-50"
          : "border-slate-300 hover:border-slate-400",
        disabled ? "opacity-70" : "",
      ].join(" ")}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled) inputRef.current?.click();
      }}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      aria-disabled={disabled}
      aria-label="Resume upload area"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      <div className="mx-auto max-w-xl text-center">
        <p className="text-lg font-semibold text-slate-900">
          Drag and drop your resume
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Drop a `.pdf` or `.docx` file here, or click to browse your files.
        </p>
        <div className="mt-4 inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600">
          Accepted formats: PDF, DOCX
        </div>
      </div>
    </section>
  );
}
