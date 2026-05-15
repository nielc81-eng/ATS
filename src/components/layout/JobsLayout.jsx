import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import BrandMark from "../branding/BrandMark";
import { useAuth } from "../../context/AuthContext";
import { ShellContainer } from "./ShellPrimitives";
import Navbar from "../navigation/Navbar";
import Sidebar from "../navigation/Sidebar";

function GuestJobsHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <ShellContainer size="standard">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link to="/" className="flex items-center">
            <BrandMark compact />
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/jobs"
              className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Browse Jobs
            </Link>
            <Link
              to="/login"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Register
            </Link>
          </div>
        </div>
      </ShellContainer>
    </header>
  );
}

export default function JobsLayout() {
  const { session, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem("shell_sidebar_collapsed") === "true";
  });
  const handleToggleCollapsed = () => {
    setCollapsed((value) => {
      const nextValue = !value;
      window.localStorage.setItem("shell_sidebar_collapsed", String(nextValue));
      return nextValue;
    });
  };

  if (isAuthenticated && session) {
    return (
      <div className="min-h-screen lg:flex">
        <Sidebar
          role={session.role}
          open={open}
          onClose={() => setOpen(false)}
          collapsed={collapsed}
          onToggleCollapsed={handleToggleCollapsed}
        />

        <div className="min-w-0 flex-1">
          <Navbar
            onMenuToggle={() => setOpen((value) => !value)}
          />

          <main className="py-6">
            <ShellContainer>
              <Outlet />
            </ShellContainer>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <GuestJobsHeader />

      <main className="py-6">
        <ShellContainer size="standard">
          <Outlet />
        </ShellContainer>
      </main>
    </div>
  );
}
