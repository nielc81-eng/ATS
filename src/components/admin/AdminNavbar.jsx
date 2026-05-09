import React from "react";
import { useNavigate } from "react-router-dom";
import BrandMark from "../branding/BrandMark";
import { useAuth } from "../../context/AuthContext";

export default function AdminNavbar({ onMenuToggle }) {
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/90 px-4 py-4 text-white backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white lg:hidden"
        >
          Menu
        </button>
        <BrandMark compact inverse />
        <span className="hidden rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100 sm:inline-flex">
          Admin console
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <div className="text-sm font-semibold text-white">
            {session?.name || "Administrator"}
          </div>
          <div className="text-xs text-slate-300">{session?.role}</div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
