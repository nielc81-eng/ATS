import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { useAuth } from "./context/AuthContext";
import { getRoleHomePath } from "./lib/routeHelpers";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import CandidateDashboard from "./pages/candidate/Dashboard";
import RecruiterDashboard from "./pages/recruiter/Dashboard";
import RecruiterJobs from "./pages/recruiter/Jobs";
import RecruiterScreening from "./pages/recruiter/Screening";
import RecruiterAnalytics from "./pages/recruiter/Analytics";
import RecruiterDigitalFiles from "./pages/recruiter/DigitalFiles";
import Landing from "./pages/public/Landing";

function RouteFallback() {
  const { session, isAuthenticated } = useAuth();

  if (isAuthenticated && session) {
    return <Navigate to={getRoleHomePath(session.role)} replace />;
  }

  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
          <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
          <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
          <Route path="/recruiter/files" element={<RecruiterDigitalFiles />} />
          <Route path="/recruiter/screening" element={<RecruiterScreening />} />
          <Route path="/recruiter/analytics" element={<RecruiterAnalytics />} />
        </Route>
      </Route>

      <Route path="*" element={<RouteFallback />} />
    </Routes>
  );
}
