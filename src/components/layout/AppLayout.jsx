import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../navigation/Navbar";
import Sidebar from "../navigation/Sidebar";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        role={session?.role ?? "Candidate"}
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
