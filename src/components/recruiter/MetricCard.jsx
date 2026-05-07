import React from "react";

export default function MetricCard({ label, value, detail, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-white",
    blue: "border-blue-200 bg-blue-50",
    emerald: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
  };

  return (
    <article className={["rounded-3xl border p-5", tones[tone] ?? tones.slate].join(" ")}>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p> : null}
    </article>
  );
}
