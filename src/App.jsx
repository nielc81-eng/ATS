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
import RecruiterApplicantCategories from "./pages/recruiter/ApplicantCategories";
import RecruiterScreening from "./pages/recruiter/Screening";
import RecruiterAnalytics from "./pages/recruiter/Analytics";
import RecruiterDigitalFiles from "./pages/recruiter/DigitalFiles";
import RecruiterTalentPool from "./pages/recruiter/TalentPool";
import RecruiterComplianceGate from "./pages/recruiter/ComplianceGate";
import CandidateApplications from "./pages/candidate/Applications";
import AccountProfile from "./pages/account/Profile";
import Landing from "./pages/public/Landing";
import PublicJobsBoard from "./pages/public/Jobs";
import PublicJobDetail from "./pages/public/JobDetail";
import { RecruiterDocsInboxProvider } from "./context/RecruiterDocsInboxContext";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminWorkPrivileges from "./pages/admin/WorkPrivileges";
import AdminPolicies from "./pages/admin/Policies";
import AdminUsageHistory from "./pages/admin/UsageHistory";
import AdminSystemCleanup from "./pages/admin/SystemCleanup";
import AdminProfile from "./pages/admin/Profile";
import DeploymentManagerDashboard from "./pages/deploymentManager/Dashboard";
import DeploymentManagerDeployments from "./pages/deploymentManager/Deployments";
import DeploymentManagerVault from "./pages/deploymentManager/Vault";
import DeploymentManagerAlerts from "./pages/deploymentManager/Alerts";
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
              <Route path="/candidate/profile/edit" element={<Navigate to="/account/profile" replace />} />
              <Route path="/account/profile" element={<AccountProfile />} />
              <Route path="/candidate/applications" element={<CandidateApplications />} />
              <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
              <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
              <Route path="/recruiter/applicant-categories" element={<RecruiterApplicantCategories />} />
              <Route path="/recruiter/files" element={<RecruiterDigitalFiles />} />
              <Route path="/recruiter/screening" element={<RecruiterScreening />} />
              <Route path="/recruiter/analytics" element={<RecruiterAnalytics />} />
              <Route path="/recruiter/talent-pool" element={<RecruiterTalentPool />} />
              <Route path="/recruiter/compliance-gate" element={<RecruiterComplianceGate />} />

              <Route path="/deployment-manager/dashboard" element={<DeploymentManagerDashboard />} />
              <Route path="/deployment-manager/deployments" element={<DeploymentManagerDeployments />} />
              <Route path="/deployment-manager/vault" element={<DeploymentManagerVault />} />
              <Route path="/deployment-manager/alerts" element={<DeploymentManagerAlerts />} />

              <Route
                path="/deployment-manager/deployment-approvals"
                element={<Navigate to="/deployment-manager/deployments" replace />}
              />
              <Route
                path="/deployment-manager/deployment-board"
                element={<Navigate to="/deployment-manager/deployments" replace />}
              />
              <Route
                path="/deployment-manager/files"
                element={<Navigate to="/deployment-manager/vault" replace />}
              />
              <Route
                path="/deployment-manager/system-health"
                element={<Navigate to="/deployment-manager/alerts" replace />}
              />
            </Route>

            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/profile" element={<AdminProfile />} />
              <Route path="/admin/staff-accounts" element={<AdminUsers />} />
              <Route path="/admin/work-privileges" element={<AdminWorkPrivileges />} />
              <Route path="/admin/policies" element={<AdminPolicies />} />
              <Route path="/admin/usage-history" element={<AdminUsageHistory />} />
              <Route path="/admin/system-cleanup" element={<AdminSystemCleanup />} />

              <Route path="/admin/users" element={<Navigate to="/admin/staff-accounts" replace />} />
              <Route path="/admin/audit-log" element={<Navigate to="/admin/usage-history" replace />} />
              <Route path="/admin/recruiter-activity" element={<Navigate to="/admin/usage-history" replace />} />
              <Route path="/admin/candidate-activity" element={<Navigate to="/admin/usage-history" replace />} />
              <Route path="/admin/files-review" element={<Navigate to="/admin/system-cleanup" replace />} />
              <Route path="/admin/records" element={<Navigate to="/admin/system-cleanup" replace />} />
              <Route path="/admin/system-health" element={<Navigate to="/admin/system-cleanup" replace />} />
            </Route>

            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<RouteFallback />} />
      </Routes>
    </>
  );
}
