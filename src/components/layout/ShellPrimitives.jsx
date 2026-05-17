import React from "react";
import { motion } from "framer-motion";
import { pageVariants } from "../../lib/motionConfig";

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
    <motion.div
      className="space-y-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className={["mx-auto w-full", sizeClass, className].filter(Boolean).join(" ")}>
        {children}
      </div>
    </motion.div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className = "",
  dark = false,
}) {
  if (dark) {
    return (
      <section
        className={["relative overflow-hidden", className].join(" ")}
        style={{
          borderRadius: "1.5rem",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18), 0 24px 60px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
          padding: "2rem 2.5rem",
        }}
      >
        {/* Radial mesh overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 50% -10%, rgba(99,102,241,0.25) 0%, transparent 70%)",
          }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            {eyebrow && (
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-300 mb-3">
                {eyebrow}
              </p>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap gap-2 pt-1">{actions}</div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      className={["relative overflow-hidden", className].join(" ")}
      style={{
        borderRadius: "1.5rem",
        background: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(15,23,42,0.07)",
        boxShadow: "0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
        padding: "1.5rem 2rem",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="section-heading mb-2">{eyebrow}</p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-2">{actions}</div>
        )}
      </div>
    </section>
  );
}
