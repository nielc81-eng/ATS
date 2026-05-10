import React, { useEffect } from "react";
import { Navigate, Route, Routes, Outlet, useLocation } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import JobsLayout from "./components/layout/JobsLayout";
import AdminLayout from "./components/layout/AdminLayout";
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
import CandidateApplications from "./pages/candidate/Applications";
import Landing from "./pages/public/Landing";
import PublicJobsBoard from "./pages/public/Jobs";
import PublicJobDetail from "./pages/public/JobDetail";
import { RecruiterDocsInboxProvider } from "./context/RecruiterDocsInboxContext";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminAuditLog from "./pages/admin/AuditLog";
import AdminRecruiterActivity from "./pages/admin/RecruiterActivity";
import AdminCandidateActivity from "./pages/admin/CandidateActivity";
import AdminFilesReview from "./pages/admin/FilesReview";
import AdminTalentPool from "./pages/admin/TalentPool";
import AdminDeploymentBoard from "./pages/admin/DeploymentBoard";
import AdminRecords from "./pages/admin/Records";
import AdminSystemHealth from "./pages/admin/SystemHealth";
import { scrollToTop } from "./lib/scroll";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollToTop();
  }, [pathname]);

  return null;
}

function RouteFallback() {
  const { session, isAuthenticated } = useAuth();

  if (isAuthenticated && session) {
    return <Navigate to={getRoleHomePath(session.role)} replace />;
  }

  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<JobsLayout />}>
          <Route path="/jobs" element={<PublicJobsBoard />} />
          <Route path="/jobs/:jobId" element={<PublicJobDetail />} />
        </Route>

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <RecruiterDocsInboxProvider>
                <Outlet />
              </RecruiterDocsInboxProvider>
            }
          >
            <Route element={<AppLayout />}>
              <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
              <Route path="/candidate/applications" element={<CandidateApplications />} />
              <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
              <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
              <Route path="/recruiter/files" element={<RecruiterDigitalFiles />} />
              <Route path="/recruiter/screening" element={<RecruiterScreening />} />
              <Route path="/recruiter/analytics" element={<RecruiterAnalytics />} />
            </Route>

            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/audit-log" element={<AdminAuditLog />} />
              <Route path="/admin/recruiter-activity" element={<AdminRecruiterActivity />} />
              <Route path="/admin/candidate-activity" element={<AdminCandidateActivity />} />
              <Route path="/admin/files-review" element={<AdminFilesReview />} />
              <Route path="/admin/talent-pool" element={<AdminTalentPool />} />
              <Route path="/admin/deployment-board" element={<AdminDeploymentBoard />} />
              <Route path="/admin/records" element={<AdminRecords />} />
              <Route path="/admin/system-health" element={<AdminSystemHealth />} />
            </Route>

            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<RouteFallback />} />
      </Routes>
    </>
  );
}
