export const navigationByRole = {
  Candidate: [
    {
      label: "Dashboard",
      to: "/candidate/dashboard",
      hint: "Resume upload and status",
    },
    {
      label: "Browse Jobs",
      to: "/jobs",
      hint: "Public opportunities",
    },
    {
      label: "Applications",
      to: "/candidate/applications",
      hint: "Track status updates",
    },
  ],
  Recruiter: [
    {
      label: "Dashboard",
      to: "/recruiter/dashboard",
      hint: "Overview metrics",
    },
    {
      label: "Jobs",
      to: "/recruiter/jobs",
      hint: "Requisitions",
    },
    {
      label: "Applicant Categories",
      to: "/recruiter/applicant-categories",
      hint: "Department applicant counts and drill-down",
    },
    {
      label: "Digital 201 Files",
      to: "/recruiter/files",
      hint: "HR file vault",
    },
    {
      label: "Screening",
      to: "/recruiter/screening",
      hint: "Review AI-ranked candidates",
    },
    {
      label: "Analytics",
      to: "/recruiter/analytics",
      hint: "View analytics and audit reports",
    },
    {
      label: "Talent Pool",
      to: "/recruiter/talent-pool",
      hint: "Search and re-evaluate profiles",
    },
    {
      label: "Compliance Gate",
      to: "/recruiter/compliance-gate",
      hint: "7-day interview compliance decision",
    },
  ],
  DeploymentManager: [
    {
      label: "Dashboard",
      to: "/deployment-manager/dashboard",
      hint: "Deployment operations overview",
    },
    {
      label: "Active Deployments",
      to: "/deployment-manager/deployments",
      hint: "Monitor and update deployment status",
    },
    {
      label: "Digital 201 Vault",
      to: "/deployment-manager/vault",
      hint: "Manage employee vault records",
    },
    {
      label: "Alerts and Notifications",
      to: "/deployment-manager/alerts",
      hint: "Expiration alerts and compliance triggers",
    },
  ],
  Administrator: [
    {
      label: "Dashboard",
      to: "/admin/dashboard",
      hint: "Platform overview",
    },
    {
      label: "Manage Staff Accounts",
      to: "/admin/staff-accounts",
      hint: "Create, archive, and restore accounts",
    },
    {
      label: "Assign Work Privileges",
      to: "/admin/work-privileges",
      hint: "Role-based access assignments",
    },
    {
      label: "Recruitment and AI Policies",
      to: "/admin/policies",
      hint: "Set policy guardrails and defaults",
    },
    {
      label: "Usage History",
      to: "/admin/usage-history",
      hint: "Monitor platform activity timelines",
    },
    {
      label: "System Cleanup and Backup",
      to: "/admin/system-cleanup",
      hint: "Cleanup and backup controls",
    },
  ],
};
