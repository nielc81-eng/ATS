import React from "react";

/**
 * BrandMark — Enterprise logomark.
 *
 * Usage contexts:
 *  <BrandMark />               — light sidebar / landing, full mark + name
 *  <BrandMark compact />       — collapsed sidebar / navbar, icon only
 *  <BrandMark inverse />       — dark sidebar, white-on-dark rendering
 *  <BrandMark compact inverse />  — collapsed dark sidebar
 */
export default function BrandMark({ compact = false, inverse = false }) {
  // Color tokens driven by inverse flag
  const bg     = inverse ? "rgba(255,255,255,0.10)" : "#0f172a";
  const bgRing = inverse ? "rgba(255,255,255,0.14)" : "transparent";
  const mark   = inverse ? "#ffffff" : "#ffffff";
  const accent = inverse ? "#818cf8" : "#6366f1";

  return (
    <div className="flex items-center gap-2.5 select-none">

      {/* ── Logomark ── */}
      <div
        className="relative flex-none"
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: bg,
          boxShadow: inverse
            ? "0 0 0 1px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.25)"
            : "0 0 0 1px rgba(15,23,42,0.12), 0 2px 6px rgba(15,23,42,0.18)",
        }}
      >
        <svg
          width="34"
          height="34"
          viewBox="0 0 34 34"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Left bar */}
          <rect
            x="9"
            y="23"
            width="3"
            height="10"
            rx="1.5"
            fill={mark}
            transform="rotate(-38 9 23)"
          />
          {/* Right bar */}
          <rect
            x="22"
            y="23"
            width="3"
            height="10"
            rx="1.5"
            fill={mark}
            transform="rotate(38 25 23)"
          />
          {/* Cross bar — indigo accent */}
          <rect
            x="12"
            y="18"
            width="10"
            height="2.5"
            rx="1.25"
            fill={accent}
          />
          {/* Top pip */}
          <circle
            cx="17"
            cy="9"
            r="2.25"
            fill={inverse ? "rgba(255,255,255,0.55)" : "#818cf8"}
          />
        </svg>
      </div>

      {/* ── Wordmark (only when not compact) ── */}
      {!compact && (
        <div className="min-w-0">
          <div
            className="text-[14px] font-bold leading-none tracking-tight truncate"
            style={{
              color: inverse ? "#ffffff" : "#0f172a",
              letterSpacing: "-0.025em",
            }}
          >
            Talent<span style={{ color: accent }}>Vault</span>
          </div>
        </div>
      )}
    </div>
  );
}
