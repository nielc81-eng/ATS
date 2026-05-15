import React from "react";
import { NavLink } from "react-router-dom";
import BrandMark from "../branding/BrandMark";
import { navigationByRole } from "../../config/navigation";

function getLinkClassName({ isActive }, collapsed) {
  return [
    "group relative flex rounded-2xl text-sm transition",
    collapsed ? "items-center justify-center px-2 py-3" : "items-start gap-3 px-4 py-3",
    isActive
      ? "bg-white text-slate-950 shadow-soft"
      : "text-slate-300 hover:bg-white/10 hover:text-white",
  ].join(" ");
}

export default function AdminSidebar({ open, onClose, collapsed = false, onToggleCollapsed }) {
  const items = navigationByRole.Administrator ?? [];

  return (
    <>
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 w-80 border-r border-slate-800 bg-slate-950/95 text-white shadow-2xl backdrop-blur-xl transition-all duration-300 lg:static lg:translate-x-0 lg:shadow-none",
          collapsed ? "lg:w-24" : "lg:w-80",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className={["relative flex h-full flex-col py-6", collapsed ? "px-3" : "px-5"].join(" ")}>
          <div className="mb-8 flex items-center justify-between lg:justify-start">
            <BrandMark compact inverse />
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="absolute -right-3 top-2 z-50 hidden h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-base font-semibold text-slate-200 shadow-sm hover:bg-slate-800 lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? "›" : "‹"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 lg:hidden"
            >
              Close
            </button>
          </div>

          <div
            className={[
              "mb-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-4",
              collapsed ? "hidden lg:hidden" : "",
            ].join(" ")}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">
              Platform admin
            </p>
            <p className="mt-2 text-lg font-semibold">System oversight hub</p>
            <p className="mt-1 text-sm text-slate-300">
              Admin navigation is isolated from recruiter and candidate views.
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
                          ? "bg-slate-950 text-white"
                          : "bg-white/10 text-slate-200",
                      ].join(" ")}
                    >
                      {item.label.slice(0, 2).toUpperCase()}
                    </span>
                    <span className={["min-w-0", collapsed ? "hidden lg:hidden" : ""].join(" ")}>
                      <span className="block font-medium">{item.label}</span>
                      <span
                        className={[
                          "block text-xs",
                          isActive ? "text-slate-600" : "text-slate-400",
                        ].join(" ")}
                      >
                        {item.hint}
                      </span>
                    </span>
                    {collapsed ? (
                      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-medium text-slate-100 shadow-md group-hover:block">
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
              "mt-auto rounded-3xl border border-slate-800 bg-white/5 p-4 text-sm text-slate-300",
              collapsed ? "hidden lg:hidden" : "",
            ].join(" ")}
          >
            Admin sessions persist locally until logout or storage is cleared.
          </div>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        />
      ) : null}
    </>
  );
}
