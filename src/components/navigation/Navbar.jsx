import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        buttonRef.current?.focus?.();
      }
    };

    const handlePointerDown = (event) => {
      const target = event.target;
      if (!target) return;

      if (menuRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;

      setMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [menuOpen]);

  return (
    <header className="relative z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <ShellContainer>
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onMenuToggle}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm lg:hidden"
            >
              Menu
            </button>
            <BrandMark compact />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                ref={buttonRef}
                type="button"
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-semibold text-slate-900">
                    {session?.name || "User"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {getRoleDisplayLabel(session?.role)}
                  </div>
                </div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-xs font-semibold text-white sm:hidden">
                  {String(session?.name || "U").slice(0, 1).toUpperCase()}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-500"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {menuOpen ? (
                <div
                  ref={menuRef}
                  role="menu"
                  aria-label="Account menu"
                  className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/account/profile");
                    }}
                  >
                    My Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </ShellContainer>
    </header>
  );
}
