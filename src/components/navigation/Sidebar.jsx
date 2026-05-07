import React from "react";
import { NavLink } from "react-router-dom";
import BrandMark from "../branding/BrandMark";
import { navigationByRole } from "../../config/navigation";

function getLinkClassName({ isActive }) {
  return [
    "group flex items-start gap-3 rounded-2xl px-4 py-3 text-sm transition",
    isActive
      ? "bg-slate-950 text-white shadow-soft"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
  ].join(" ");
}

export default function Sidebar({ role, open, onClose }) {
  const items = navigationByRole[role] ?? [];

  return (
    <>
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 w-80 border-r border-slate-200 bg-white/90 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-full flex-col px-5 py-6">
          <div className="mb-8 flex items-center justify-between lg:justify-start">
            <BrandMark />
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              Close
            </button>
          </div>

          <div className="mb-6 rounded-3xl bg-slate-950 px-4 py-4 text-white shadow-soft">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Active role
            </p>
            <p className="mt-2 text-lg font-semibold">{role}</p>
            <p className="mt-1 text-sm text-slate-300">
              Role-aware navigation is wired into the shell.
            </p>
          </div>

          <nav className="space-y-2">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={getLinkClassName}
                onClick={onClose}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        "flex h-10 w-10 flex-none items-center justify-center rounded-2xl text-xs font-semibold",
                        isActive
                          ? "bg-white/10 text-white"
                          : "bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      {item.label.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">{item.label}</span>
                      <span
                        className={[
                          "block text-xs",
                          isActive ? "text-slate-300" : "text-slate-500",
                        ].join(" ")}
                      >
                        {item.hint}
                      </span>
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Phase 1 scaffold only. Feature screens stay as placeholders until the
            next implementation phase.
          </div>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
        />
      ) : null}
    </>
  );
}
