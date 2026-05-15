import React from "react";

const sizeClassMap = {
  wide: "max-w-[var(--layout-max-wide)]",
  standard: "max-w-[var(--layout-max-standard)]",
  narrow: "max-w-[var(--layout-max-narrow)]",
  full: "max-w-none",
};

export function ShellContainer({ children, className = "", size = "full" }) {
  const sizeClass = sizeClassMap[size] || sizeClassMap.full;
  return (
    <div
      className={[
        "w-full px-4 sm:px-6 lg:px-8",
        sizeClass === "max-w-none" ? "" : `mx-auto ${sizeClass}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

export function PageFrame({ children, className = "", size = "standard" }) {
  const sizeClass = sizeClassMap[size] || sizeClassMap.standard;
  return (
    <div className="space-y-6">
      <div className={["mx-auto w-full", sizeClass, className].filter(Boolean).join(" ")}>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className = "",
}) {
  return (
    <section className={["surface-card p-6 sm:p-8", className].filter(Boolean).join(" ")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow ? <p className="section-heading">{eyebrow}</p> : null}
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
