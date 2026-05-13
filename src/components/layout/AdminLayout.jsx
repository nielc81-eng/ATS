import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminDataProvider } from "../../context/AdminDataContext";
import { useAuth } from "../../context/AuthContext";
import AdminNavbar from "../admin/AdminNavbar";
import AdminSidebar from "../admin/AdminSidebar";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();

  return (
    <AdminDataProvider>
      <div className="min-h-screen lg:flex">
        <AdminSidebar open={open} onClose={() => setOpen(false)} />

        <div className="min-w-0 flex-1">
          <AdminNavbar onMenuToggle={() => setOpen((value) => !value)} />

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 rounded-3xl border border-cyan-200 bg-cyan-50 px-5 py-4 text-sm text-cyan-900">
                Signed in as <span className="font-semibold">{session?.name || "Administrator"}</span>.{" "}
                Platform oversight routes are isolated under <span className="font-semibold">/admin</span>.
              </div>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </AdminDataProvider>
  );
}
