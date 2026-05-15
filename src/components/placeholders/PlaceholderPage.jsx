import React from "react";

export default function PlaceholderPage({
  eyebrow,
  title,
  description,
  meta,
}) {
  return (
    <section className="surface-card p-6 sm:p-8">
      <div className="max-w-2xl space-y-4">
        {eyebrow ? <p className="section-heading">{eyebrow}</p> : null}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        </div>
        {meta ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            {meta}
          </div>
        ) : null}
      </div>
    </section>
  );
}
