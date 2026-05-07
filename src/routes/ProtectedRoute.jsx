import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPathRole, getRoleHomePath } from "../lib/routeHelpers";

export default function ProtectedRoute() {
  const { session, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const routeRole = getPathRole(location.pathname);
  if (routeRole && routeRole !== session.role) {
    return <Navigate to={getRoleHomePath(session.role)} replace />;
  }

  if (location.pathname === "/") {
    return <Navigate to={getRoleHomePath(session.role)} replace />;
  }

  return <Outlet />;
}
