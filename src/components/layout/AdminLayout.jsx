import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminDataProvider } from "../../context/AdminDataContext";
import { useAuth } from "../../context/AuthContext";
import AdminNavbar from "../admin/AdminNavbar";
import AdminSidebar from "../admin/AdminSidebar";
import { ShellContainer } from "./ShellPrimitives";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem("admin_sidebar_collapsed") === "true";
  });
  const { session } = useAuth();
  const handleToggleCollapsed = () => {
    setCollapsed((value) => {
      const nextValue = !value;
      window.localStorage.setItem("admin_sidebar_collapsed", String(nextValue));
      return nextValue;
    });
  };

  return (
    <AdminDataProvider>
      <div className="min-h-screen lg:flex">
        <AdminSidebar
          open={open}
          onClose={() => setOpen(false)}
          collapsed={collapsed}
          onToggleCollapsed={handleToggleCollapsed}
        />

        <div className="min-w-0 flex-1">
          <AdminNavbar
            onMenuToggle={() => setOpen((value) => !value)}
          />

          <main className="py-6">
            <ShellContainer>
              <Outlet />
            </ShellContainer>
          </main>
        </div>
      </div>
    </AdminDataProvider>
  );
}
