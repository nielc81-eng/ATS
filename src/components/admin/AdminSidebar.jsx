import React from "react";
import { NavLink } from "react-router-dom";
import BrandMark from "../branding/BrandMark";
import { navigationByRole } from "../../config/navigation";

function getLinkClassName({ isActive }) {
  return [
    "group flex items-start gap-3 rounded-2xl px-4 py-3 text-sm transition",
    isActive
      ? "bg-white text-slate-950 shadow-soft"
      : "text-slate-300 hover:bg-white/10 hover:text-white",
  ].join(" ");
}

export default function AdminSidebar({ open, onClose }) {
  const items = navigationByRole.Administrator ?? [];

  return (
    <>
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 w-80 border-r border-slate-800 bg-slate-950/95 text-white backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-full flex-col px-5 py-6">
          <div className="mb-8 flex items-center justify-between lg:justify-start">
            <BrandMark compact inverse />
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 lg:hidden"
            >
              Close
            </button>
          </div>

          <div className="mb-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-4">
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
                className={getLinkClassName}
                onClick={onClose}
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
                    <span className="min-w-0">
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
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-3xl border border-slate-800 bg-white/5 p-4 text-sm text-slate-300">
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
