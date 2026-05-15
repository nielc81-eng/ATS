import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShellContainer } from "./ShellPrimitives";
import Navbar from "../navigation/Navbar";
import Sidebar from "../navigation/Sidebar";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem("shell_sidebar_collapsed") === "true";
  });
  const { session } = useAuth();
  const handleToggleCollapsed = () => {
    setCollapsed((value) => {
      const nextValue = !value;
      window.localStorage.setItem("shell_sidebar_collapsed", String(nextValue));
      return nextValue;
    });
  };

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        role={session?.role ?? "Candidate"}
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
