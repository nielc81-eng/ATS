import React from "react";

export default function BrandMark({ compact = false, inverse = false }) {
  const markClassName = inverse
    ? "bg-white text-slate-950"
    : "bg-slate-950 text-white";
  const titleClassName = inverse ? "text-white" : "text-slate-900";
  const subtitleClassName = inverse ? "text-slate-300" : "text-slate-500";

  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          "flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold shadow-soft",
          markClassName,
        ].join(" ")}
      >
        AR
      </div>
      {!compact ? (
        <div>
          <div className={["text-sm font-semibold", titleClassName].join(" ")}>
            AI Resume Screening
          </div>
          <div className={["text-xs", subtitleClassName].join(" ")}>
            Recruitment workspace
          </div>
        </div>
      ) : null}
    </div>
  );
}
