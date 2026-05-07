import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoleHomePath } from "../lib/routeHelpers";

export default function PublicRoute() {
  const { session, isAuthenticated } = useAuth();

  if (isAuthenticated && session) {
    return <Navigate to={getRoleHomePath(session.role)} replace />;
  }

  return <Outlet />;
}
