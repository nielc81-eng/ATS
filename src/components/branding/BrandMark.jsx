import React from "react";

/**
 * BrandMark — Enterprise-grade logomark.
 * Renders a geometric SVG mark + wordmark. No emoji, no plain text initials.
 */
export default function BrandMark({ compact = false, inverse = false }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Logomark — geometric SVG */}
      <div
        className="relative flex-none"
        style={{
          width: 32,
          height: 32,
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Outer square with rounded corners */}
          <rect
            width="32"
            height="32"
            rx="8"
            fill={inverse ? "#ffffff" : "#0f172a"}
          />
          {/* Inner geometric mark — abstract "A" / upward arrow form */}
          {/* Left bar */}
          <rect
            x="8"
            y="22"
            width="3"
            height="10"
            rx="1.5"
            fill={inverse ? "#0f172a" : "#ffffff"}
            transform="rotate(-38 8 22)"
          />
          {/* Right bar */}
          <rect
            x="21"
            y="22"
            width="3"
            height="10"
            rx="1.5"
            fill={inverse ? "#0f172a" : "#ffffff"}
            transform="rotate(38 24 22)"
          />
          {/* Cross bar */}
          <rect
            x="11"
            y="17"
            width="10"
            height="2.5"
            rx="1.25"
            fill={inverse ? "#0f172a" : "#6366f1"}
          />
          {/* Top dot */}
          <circle
            cx="16"
            cy="8.5"
            r="2"
            fill={inverse ? "#0f172a" : "#818cf8"}
          />
        </svg>
      </div>

      {/* Wordmark */}
      {!compact && (
        <div>
          <div
            className="text-[13px] font-bold leading-tight tracking-tight"
            style={{ color: inverse ? "#ffffff" : "#0f172a", letterSpacing: "-0.02em" }}
          >
            ATS Platform
          </div>
          <div
            className="text-[10px] font-medium leading-none mt-0.5"
            style={{ color: inverse ? "rgba(255,255,255,0.4)" : "#94a3b8", letterSpacing: "0.01em" }}
          >
            Recruitment workspace
          </div>
        </div>
      )}
    </div>
  );
}
