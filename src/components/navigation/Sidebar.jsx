import React from "react";
import { NavLink } from "react-router-dom";
import BrandMark from "../branding/BrandMark";
import { navigationByRole } from "../../config/navigation";
import { getRoleDisplayLabel } from "../../lib/roles";

function getLinkClassName({ isActive }, collapsed) {
  return [
    "group relative flex rounded-2xl text-sm transition",
    collapsed ? "items-center justify-center px-2 py-3" : "items-start gap-3 px-4 py-3",
    isActive
      ? "bg-slate-950 text-white shadow-soft"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
  ].join(" ");
}

export default function Sidebar({ role, open, onClose, collapsed = false, onToggleCollapsed }) {
  const items = navigationByRole[role] ?? [];

  return (
    <>
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 w-80 border-r border-slate-200 bg-white/95 shadow-xl backdrop-blur-xl transition-all duration-300 lg:static lg:translate-x-0 lg:shadow-none",
          collapsed ? "lg:w-24" : "lg:w-80",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className={["relative flex h-full flex-col py-6", collapsed ? "px-3" : "px-5"].join(" ")}>
          <div className="mb-8 flex items-center justify-between lg:justify-start">
            <BrandMark compact={collapsed} />
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="absolute -right-3 top-2 z-50 hidden h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-base font-semibold text-slate-600 shadow-sm hover:bg-slate-100 lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? "›" : "‹"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              Close
            </button>
          </div>

          <div className={["mb-6 rounded-3xl bg-slate-950 px-4 py-4 text-white shadow-soft", collapsed ? "hidden lg:hidden" : ""].join(" ")}>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Active role
            </p>
            <p className="mt-2 text-lg font-semibold">{getRoleDisplayLabel(role)}</p>
            <p className="mt-1 text-sm text-slate-300">
              Role-aware navigation is wired into the shell.
            </p>
          </div>

          <nav className="space-y-2">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={(state) => getLinkClassName(state, collapsed)}
                onClick={onClose}
                title={collapsed ? `${item.label} - ${item.hint}` : undefined}
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
                    <span className={["min-w-0", collapsed ? "hidden lg:hidden" : ""].join(" ")}>
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
                    {collapsed ? (
                      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-md group-hover:block">
                        {item.label}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div
            className={[
              "mt-auto rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500",
              collapsed ? "hidden lg:hidden" : "",
            ].join(" ")}
          >
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
