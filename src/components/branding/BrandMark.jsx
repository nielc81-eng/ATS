import React from "react";

export default function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-soft">
        AR
      </div>
      {!compact ? (
        <div>
          <div className="text-sm font-semibold text-slate-900">
            AI Resume Screening
          </div>
          <div className="text-xs text-slate-500">Recruitment workspace</div>
        </div>
      ) : null}
    </div>
  );
}
