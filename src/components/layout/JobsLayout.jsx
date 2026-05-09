import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import BrandMark from "../branding/BrandMark";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../navigation/Navbar";
import Sidebar from "../navigation/Sidebar";

function GuestJobsHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
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
    </header>
  );
}

export default function JobsLayout() {
  const { session, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  if (isAuthenticated && session) {
    return (
      <div className="min-h-screen lg:flex">
        <Sidebar
          role={session.role}
          open={open}
          onClose={() => setOpen(false)}
        />

        <div className="min-w-0 flex-1">
          <Navbar onMenuToggle={() => setOpen((value) => !value)} />

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <GuestJobsHeader />

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
