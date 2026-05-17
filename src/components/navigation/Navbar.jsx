import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut } from "lucide-react";
import BrandMark from "../branding/BrandMark";
import { useAuth } from "../../context/AuthContext";
import { getRoleDisplayLabel } from "../../lib/roles";
import { ShellContainer } from "../layout/ShellPrimitives";


export default function Navbar({ onMenuToggle }) {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Close on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") { setMenuOpen(false); buttonRef.current?.focus?.(); }
    };
    const handlePointerDown = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      if (buttonRef.current?.contains(e.target)) return;
      setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [menuOpen]);


  const initials = String(session?.name ?? "U").slice(0, 2).toUpperCase();

  return (
    <header
      className="relative z-50"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px) saturate(1.8)",
        WebkitBackdropFilter: "blur(20px) saturate(1.8)",
        borderBottom: "1px solid rgba(15,23,42,0.07)",
        boxShadow: "0 1px 0 rgba(15,23,42,0.05), 0 4px 24px rgba(15,23,42,0.04)",
      }}
    >
      <ShellContainer>
        <div className="flex items-center justify-between gap-4 py-3.5">
          {/* Left: menu toggle + brand (mobile) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onMenuToggle}
              aria-label="Toggle menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-card transition hover:bg-slate-50 hover:text-slate-900 lg:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="lg:hidden">
              <BrandMark compact />
            </span>
          </div>

          {/* Right: user menu */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Avatar button */}
            <div className="relative">
              <button
                ref={buttonRef}
                type="button"
                id="navbar-user-menu-btn"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className={[
                  "flex items-center gap-2.5 rounded-2xl border px-3 py-2 text-left transition-all duration-200",
                  menuOpen
                    ? "border-indigo-200 bg-indigo-50 shadow-glow"
                    : "border-slate-200 bg-white shadow-card hover:border-slate-300 hover:shadow-card-hover",
                ].join(" ")}
              >
                {/* Avatar circle */}
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white flex-none"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    boxShadow: "0 2px 8px rgba(79,70,229,0.3)",
                  }}
                >
                  {initials}
                </span>
                {/* Name + role — desktop */}
                <span className="hidden sm:block text-right">
                  <span className="block text-sm font-semibold text-slate-900 leading-tight">
                    {session?.name ?? "User"}
                  </span>
                </span>
                {/* Chevron */}
                <motion.svg
                  animate={{ rotate: menuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-400"
                >
                  <path d="m6 9 6 6 6-6" />
                </motion.svg>
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    ref={menuRef}
                    role="menu"
                    aria-label="Account menu"
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden"
                    style={{
                      borderRadius: "1rem",
                      border: "1px solid rgba(15,23,42,0.08)",
                      background: "rgba(255,255,255,0.98)",
                      boxShadow: "0 4px 16px rgba(15,23,42,0.1), 0 16px 40px rgba(15,23,42,0.08)",
                    }}
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">{session?.name ?? "User"}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{session?.email ?? ""}</p>
                      {/* Role chip */}
                      <span
                        className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                        style={{
                          background: "rgba(99,102,241,0.08)",
                          color: "#4f46e5",
                          border: "1px solid rgba(99,102,241,0.15)",
                        }}
                      >
                        {getRoleDisplayLabel(session?.role)}
                      </span>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      {/* My Profile */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setMenuOpen(false); navigate("/account/profile"); }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-50"
                      >
                        <span
                          className="flex h-7 w-7 flex-none items-center justify-center rounded-lg"
                          style={{
                            background: "rgba(15,23,42,0.04)",
                            border: "1px solid rgba(15,23,42,0.07)",
                          }}
                        >
                          <User size={13} strokeWidth={1.75} style={{ color: "#64748b" }} />
                        </span>
                        My Profile
                      </button>

                      {/* Divider */}
                      <div className="my-1 mx-4 h-px bg-slate-100" />

                      {/* Sign Out */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setMenuOpen(false); handleLogout(); }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-rose-600 transition-colors duration-150 hover:bg-rose-50"
                      >
                        <span
                          className="flex h-7 w-7 flex-none items-center justify-center rounded-lg"
                          style={{
                            background: "rgba(244,63,94,0.06)",
                            border: "1px solid rgba(244,63,94,0.12)",
                          }}
                        >
                          <LogOut size={13} strokeWidth={1.75} style={{ color: "#e11d48" }} />
                        </span>
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </ShellContainer>
    </header>
  );
}
