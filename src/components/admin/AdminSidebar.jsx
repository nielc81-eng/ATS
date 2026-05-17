import React from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import BrandMark from "../branding/BrandMark";
import { navigationByRole } from "../../config/navigation";

// Nav container stagger
const navContainer = {
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.12 },
  },
};

const navItemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] } },
};

// Resolve a Lucide icon component by string name
function NavIcon({ name, size = 15, ...props }) {
  const Component = Icons[name] ?? Icons.Square;
  return <Component size={size} strokeWidth={1.75} {...props} />;
}

export default function AdminSidebar({ open, onClose, collapsed = false, onToggleCollapsed }) {
  const items = navigationByRole.Administrator ?? [];

  return (
    <>
      {/* ── Sidebar panel ── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 272 }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
        className={[
          "fixed inset-y-0 left-0 z-40 flex flex-col",
          "bg-slate-950 text-white",
          "lg:static",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "transition-transform duration-300 lg:transition-none",
        ].join(" ")}
        style={{
          borderRight: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "1px 0 0 rgba(0,0,0,0.3), 4px 0 24px rgba(0,0,0,0.15)",
        }}
      >
        <div className={["flex h-full flex-col overflow-hidden", collapsed ? "px-2 py-5" : "px-3.5 py-5"].join(" ")}>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="mb-6 flex items-center justify-between"
          >
            <BrandMark compact={collapsed} inverse />

            {/* Desktop collapse toggle */}
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="absolute -right-3.5 top-6 z-50 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-400 shadow-sm transition hover:text-white lg:flex"
            >
              <motion.span animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.22 }}>
                <Icons.ChevronLeft size={12} strokeWidth={2.5} />
              </motion.span>
            </button>

            {/* Mobile close */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-white/10 lg:hidden"
            >
              <Icons.X size={14} />
            </button>
          </motion.div>

          {/* Role badge */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                key="role-badge"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                className="mb-5 overflow-hidden"
              >
                <div
                  className="relative overflow-hidden rounded-xl px-3.5 py-3"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-7 w-7 flex-none items-center justify-center rounded-lg"
                      style={{ background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.2)" }}
                    >
                      <Icons.ShieldCheck size={13} style={{ color: "#818cf8" }} strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 leading-none mb-1">
                        Platform admin
                      </p>
                      <p className="text-[13px] font-bold text-white leading-tight">
                        System Oversight
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Section label */}
          {!collapsed && (
            <p className="mb-2 px-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
              Navigation
            </p>
          )}

          {/* Nav items */}
          <motion.nav
            className="flex-1 space-y-0.5 overflow-y-auto"
            variants={navContainer}
            initial="initial"
            animate="animate"
          >
            {items.map((item) => (
              <motion.div key={item.to} variants={navItemVariants}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  title={collapsed ? `${item.label} — ${item.hint}` : undefined}
                  className={({ isActive }) =>
                    [
                      "group relative flex items-center rounded-xl text-sm transition-all duration-200",
                      collapsed ? "justify-center py-3 px-0" : "gap-3 px-3.5 py-2.5",
                      isActive
                        ? "bg-white text-slate-950"
                        : "text-slate-400 hover:bg-white/6 hover:text-white",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active background pill — shared layoutId for smooth spring */}
                      {isActive && (
                        <motion.span
                          layoutId="admin-active-bg"
                          className="absolute inset-0 rounded-xl bg-white"
                          style={{ zIndex: -1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 38 }}
                        />
                      )}

                      {/* Icon */}
                      <span
                        className={[
                          "relative flex h-8 w-8 flex-none items-center justify-center rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-slate-950/8 text-slate-900"
                            : "bg-white/6 text-slate-400 group-hover:bg-white/10 group-hover:text-white",
                        ].join(" ")}
                      >
                        <NavIcon name={item.icon ?? "Circle"} size={15} />
                        {/* Live dot for active item */}
                        {isActive && (
                          <span
                            className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full"
                            style={{
                              background: "#4f46e5",
                              boxShadow: "0 0 5px 2px rgba(79,70,229,0.45)",
                            }}
                          />
                        )}
                      </span>

                      {/* Label + hint */}
                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                            className="min-w-0 flex-1 overflow-hidden"
                          >
                            <span className="block truncate text-[13px] font-semibold leading-tight tracking-tight whitespace-nowrap">
                              {item.label}
                            </span>
                            <span
                              className={[
                                "block truncate text-[11px] leading-tight mt-0.5 whitespace-nowrap",
                                isActive ? "text-slate-400" : "text-slate-600",
                              ].join(" ")}
                            >
                              {item.hint}
                            </span>
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Collapsed tooltip */}
                      {collapsed && (
                        <span
                          className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-xl bg-slate-900 text-white shadow-lg group-hover:flex flex-col px-3 py-2"
                          style={{
                            border: "1px solid rgba(255,255,255,0.08)",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                          }}
                        >
                          <span className="text-[13px] font-semibold">{item.label}</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">{item.hint}</span>
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </motion.nav>

          {/* Footer */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                key="footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.4, duration: 0.3 } }}
                exit={{ opacity: 0 }}
                className="mt-4 pt-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-center text-[10px] text-slate-600 leading-relaxed">
                  Admin session · Isolated from all other roles
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
    </>
  );
}
