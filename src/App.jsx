import React, { useEffect } from "react";
import { Navigate, Route, Routes, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AppLayout from "./components/layout/AppLayout";
import JobsLayout from "./components/layout/JobsLayout";
import AdminLayout from "./components/layout/AdminLayout";
import { useAuth } from "./context/AuthContext";
import { getRoleHomePath } from "./lib/routeHelpers";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import CandidateDocuments from "./pages/candidate/Dashboard";
import CandidateHome from "./pages/candidate/Home";
import CandidateNotifications from "./pages/candidate/Notifications";
import CandidateInternalMobility from "./pages/candidate/InternalMobility";
import RecruiterDashboard from "./pages/recruiter/Dashboard";
import RecruiterJobs from "./pages/recruiter/Jobs";
import RecruiterApplicants from "./pages/recruiter/Applicants";
import RecruiterScreening from "./pages/recruiter/Screening";
import RecruiterAnalytics from "./pages/recruiter/Analytics";
import RecruiterJobModuleLayout from "./pages/recruiter/JobModuleLayout";
import RecruiterJobOverview from "./pages/recruiter/JobOverview";
import RecruiterDigitalFiles from "./pages/recruiter/DigitalFiles";
import RecruiterTalentPool from "./pages/recruiter/TalentPool";
import RecruiterComplianceGate from "./pages/recruiter/ComplianceGate";
import RecruiterInternalMobility from "./pages/recruiter/InternalMobility";
import CandidateApplications from "./pages/candidate/Applications";
import AccountProfile from "./pages/account/Profile";
import Landing from "./pages/public/Landing";
import PublicJobsBoard from "./pages/public/Jobs";
import PublicJobDetail from "./pages/public/JobDetail";
import { RecruiterDocsInboxProvider } from "./context/RecruiterDocsInboxContext";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminPolicies from "./pages/admin/Policies";
import AdminUsageHistory from "./pages/admin/UsageHistory";
import AdminSystemCleanup from "./pages/admin/SystemCleanup";
import AdminProfile from "./pages/admin/Profile";
import AdminReports from "./pages/admin/Reports";
import AdminSystem from "./pages/admin/System";
import AdminSettings from "./pages/admin/Settings";
import AdminInternalMobility from "./pages/admin/InternalMobility";
import DeploymentManagerDashboard from "./pages/deploymentManager/Dashboard";
import DeploymentManagerDeployments from "./pages/deploymentManager/Deployments";
import DeploymentManagerVault from "./pages/deploymentManager/Vault";
import DeploymentManagerAlerts from "./pages/deploymentManager/Alerts";
import DeploymentManagerRequests from "./pages/deploymentManager/Requests";
import DeploymentManagerAssignments from "./pages/deploymentManager/Assignments";
import DeploymentManagerSchedule from "./pages/deploymentManager/Schedule";
import DeploymentManagerInternalMobility from "./pages/deploymentManager/InternalMobility";
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

function AnimatedRoutes() {
  return (
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
            <Route path="/candidate/dashboard" element={<CandidateHome />} />
            <Route path="/candidate/profile" element={<Navigate to="/account/profile" replace />} />
            <Route path="/candidate/profile/edit" element={<Navigate to="/account/profile" replace />} />
            <Route path="/account/profile" element={<AccountProfile />} />
            <Route path="/candidate/applications" element={<CandidateApplications />} />
            <Route path="/candidate/internal-mobility" element={<CandidateInternalMobility />} />
            <Route path="/candidate/documents" element={<CandidateDocuments />} />
            <Route path="/candidate/notifications" element={<CandidateNotifications />} />
            <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
            <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
            <Route path="/recruiter/applicants" element={<RecruiterApplicants />} />
            <Route path="/recruiter/jobs/:jobId" element={<RecruiterJobModuleLayout />}>
              <Route path="overview" element={<RecruiterJobOverview />} />
              <Route path="applicants" element={<RecruiterApplicants />} />
              <Route path="screening" element={<RecruiterScreening />} />
              <Route path="analytics" element={<RecruiterAnalytics />} />
              <Route path="" element={<Navigate to="overview" replace />} />
            </Route>
            <Route path="/recruiter/applicant-categories" element={<Navigate to="/recruiter/applicants" replace />} />
            <Route path="/recruiter/files" element={<RecruiterDigitalFiles />} />
            <Route path="/recruiter/screening" element={<RecruiterScreening />} />
            <Route path="/recruiter/analytics" element={<RecruiterAnalytics />} />
            <Route path="/recruiter/talent-pool" element={<RecruiterTalentPool />} />
            <Route path="/recruiter/compliance-gate" element={<RecruiterComplianceGate />} />
            <Route path="/recruiter/internal-mobility" element={<RecruiterInternalMobility />} />

            <Route path="/deployment-manager/dashboard" element={<DeploymentManagerDashboard />} />
            <Route path="/deployment-manager/requests" element={<DeploymentManagerRequests />} />
            <Route path="/deployment-manager/assignments" element={<DeploymentManagerAssignments />} />
            <Route path="/deployment-manager/schedule" element={<DeploymentManagerSchedule />} />
            <Route path="/deployment-manager/internal-mobility" element={<DeploymentManagerInternalMobility />} />
            <Route path="/deployment-manager/notifications" element={<DeploymentManagerAlerts />} />
            <Route path="/deployment-manager/deployments" element={<DeploymentManagerDeployments />} />
            <Route path="/deployment-manager/vault" element={<DeploymentManagerVault />} />
            <Route path="/deployment-manager/alerts" element={<DeploymentManagerAlerts />} />

            <Route
              path="/deployment-manager/deployment-approvals"
              element={<Navigate to="/deployment-manager/requests" replace />}
            />
            <Route
              path="/deployment-manager/deployment-board"
              element={<Navigate to="/deployment-manager/assignments" replace />}
            />
            <Route
              path="/deployment-manager/files"
              element={<Navigate to="/deployment-manager/vault" replace />}
            />
            <Route
              path="/deployment-manager/system-health"
              element={<Navigate to="/deployment-manager/notifications" replace />}
            />
          </Route>

          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/staff-accounts" element={<AdminUsers />} />
            <Route path="/admin/roles-and-privileges" element={<Navigate to="/admin/users" replace />} />
            <Route path="/admin/work-privileges" element={<Navigate to="/admin/users" replace />} />
            <Route path="/admin/policies" element={<AdminPolicies />} />
            <Route path="/admin/internal-mobility" element={<AdminInternalMobility />} />
            <Route path="/admin/audit" element={<AdminUsageHistory />} />
            <Route path="/admin/usage-history" element={<AdminUsageHistory />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/system" element={<AdminSystem />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/system-cleanup" element={<AdminSystemCleanup />} />

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
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <AnimatedRoutes />
    </>
  );
}
