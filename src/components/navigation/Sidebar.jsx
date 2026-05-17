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

function NavIcon({ name, size = 16, ...props }) {
  const Component = Icons[name] ?? Icons.Square;
  return <Component size={size} strokeWidth={1.75} {...props} />;
}

function SidebarNavItem({ item, collapsed, onClick }) {
  return (
    <motion.div variants={navItemVariants}>
      <NavLink
        to={item.to}
        onClick={onClick}
        title={collapsed ? `${item.label} — ${item.hint}` : undefined}
        className={({ isActive }) =>
          [
            "group relative flex items-center rounded-xl text-sm transition-all duration-200",
            collapsed ? "justify-center py-3 px-0" : "gap-3 px-3.5 py-2.5",
            isActive
              ? "text-white"
              : "text-slate-500 hover:text-slate-800",
          ].join(" ")
        }
      >
        {({ isActive }) => (
          <>
            {/* Active background pill */}
            {isActive && (
              <motion.span
                layoutId="sidebar-active-bg"
                className="absolute inset-0 rounded-xl bg-slate-950"
                style={{
                  zIndex: -1,
                  boxShadow: "0 2px 8px rgba(15,23,42,0.18), 0 8px 20px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 38 }}
              />
            )}
            
            {/* Active background hover effect when NOT active */}
            {!isActive && (
              <span className="absolute inset-0 rounded-xl bg-slate-50 opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ zIndex: -1 }} />
            )}

            {/* Icon container */}
            <span
              className={[
                "relative flex h-8 w-8 flex-none items-center justify-center rounded-lg transition-all duration-200",
                isActive
                  ? "bg-white/10 text-white"
                  : "bg-transparent text-slate-400 group-hover:bg-white group-hover:shadow-sm group-hover:text-slate-700",
              ].join(" ")}
            >
              <NavIcon name={item.icon ?? "Circle"} size={15} />

              {/* Active state: glowing pip indicator */}
              {isActive && (
                <span
                  className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full"
                  style={{
                    background: "#818cf8",
                    boxShadow: "0 0 6px 2px rgba(129,140,248,0.55)",
                  }}
                />
              )}
            </span>

            {/* Label + hint */}
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
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
                      isActive ? "text-slate-400" : "text-slate-400",
                    ].join(" ")}
                  >
                    {item.hint}
                  </span>
                </motion.span>
              )}
            </AnimatePresence>

            {/* Tooltip when collapsed */}
            {collapsed && (
              <span
                className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border border-slate-100 bg-white group-hover:flex flex-col px-3 py-2"
                style={{ boxShadow: "0 4px 16px rgba(15,23,42,0.10)" }}
              >
                <span className="text-[13px] font-semibold text-slate-800">{item.label}</span>
                <span className="text-[11px] text-slate-400 mt-0.5">{item.hint}</span>
              </span>
            )}
          </>
        )}
      </NavLink>
    </motion.div>
  );
}

export default function Sidebar({ role, open, onClose, collapsed = false, onToggleCollapsed }) {
  const items = navigationByRole[role] ?? [];

  return (
    <>
      {/* ── Sidebar panel ── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 272 }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
        className={[
          "fixed inset-y-0 left-0 z-40 flex flex-col shrink-0",
          "border-r border-slate-200/70 bg-white/95",
          "lg:static",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "transition-transform duration-300 lg:transition-none",
        ].join(" ")}
        style={{ backdropFilter: "blur(20px)", boxShadow: "1px 0 0 rgba(15,23,42,0.06)" }}
      >
        <div className={["flex h-full flex-col overflow-hidden", collapsed ? "px-2 py-5" : "px-3.5 py-5"].join(" ")}>
          
          {/* Logo */}
          <div className="mb-6 flex items-center justify-between">
            <BrandMark compact={collapsed} />

            {/* Collapse toggle — desktop only */}
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="absolute -right-3.5 top-6 z-50 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-card transition hover:text-slate-800 lg:flex"
            >
              <motion.span animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.22 }}>
                <Icons.ChevronLeft size={12} strokeWidth={2.5} />
              </motion.span>
            </button>

            {/* Mobile close */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <Icons.X size={14} />
            </button>
          </div>

          {/* Section label */}
          {!collapsed && (
            <p className="mb-2 px-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Navigation
            </p>
          )}

          {/* Nav links */}
          <motion.nav 
            className="flex-1 space-y-0.5 overflow-y-auto"
            variants={navContainer}
            initial="initial"
            animate="animate"
          >
            {items.map((item) => (
              <SidebarNavItem
                key={item.to}
                item={item}
                collapsed={collapsed}
                onClick={onClose}
              />
            ))}
          </motion.nav>
        </div>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-slate-950/25 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
    </>
  );
}
