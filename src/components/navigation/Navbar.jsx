import React from "react";
import { useNavigate } from "react-router-dom";
import BrandMark from "../branding/BrandMark";
import { useAuth } from "../../context/AuthContext";

export default function Navbar({ onMenuToggle }) {
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
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
        <div className="hidden text-right sm:block">
          <div className="text-sm font-semibold text-slate-900">
            {session?.name || "User"}
          </div>
          <div className="text-xs text-slate-500">{session?.role}</div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
