import React from "react";
import { getDigitalFileStatusTone } from "../../lib/digitalFilesMockData";

export default function DigitalFileCard({ file, selected, onClick }) {
  const tone = getDigitalFileStatusTone(file.status);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-soft",
        selected ? "ring-2 ring-slate-950" : "border-slate-200",
        tone.card,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-950">
            {file.employeeName}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {file.employeeId} - {file.department}
          </p>
        </div>
        <span className={["rounded-full px-3 py-1 text-xs font-semibold", tone.pill].join(" ")}>
          {file.status}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/70 px-3 py-2">
          File: <span className="font-semibold text-slate-900">{file.fileName}</span>
        </div>
        <div className="rounded-2xl bg-white/70 px-3 py-2">
          Size: <span className="font-semibold text-slate-900">{file.size}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {file.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 text-sm text-slate-600">
        Reviewed by <span className="font-semibold text-slate-900">{file.reviewer}</span>
      </div>
    </button>
  );
}

