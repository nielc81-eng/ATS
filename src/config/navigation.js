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
      label: "Digital 201 Files",
      to: "/recruiter/files",
      hint: "HR file vault",
    },
    {
      label: "Screening",
      to: "/recruiter/screening",
      hint: "Candidate evaluation",
    },
    {
      label: "Analytics",
      to: "/recruiter/analytics",
      hint: "Reports and charts",
    },
  ],
  Administrator: [
    {
      label: "Dashboard",
      to: "/admin/dashboard",
      hint: "Platform overview",
    },
    {
      label: "User Management",
      to: "/admin/users",
      hint: "Account governance",
    },
    {
      label: "Application Audit Trail",
      to: "/admin/audit-log",
      hint: "Application lifecycle events",
    },
    {
      label: "Recruiter Activity",
      to: "/admin/recruiter-activity",
      hint: "Hiring workflow oversight",
    },
    {
      label: "Candidate Activity",
      to: "/admin/candidate-activity",
      hint: "Candidate-side progress",
    },
    {
      label: "Digital 201 Files Review",
      to: "/admin/files-review",
      hint: "File status and review queue",
    },
    {
      label: "Talent Pool",
      to: "/admin/talent-pool",
      hint: "Reusable workforce bench",
    },
    {
      label: "Deployment Board",
      to: "/admin/deployment-board",
      hint: "Assignments and coverage",
    },
    {
      label: "System Health",
      to: "/admin/system-health",
      hint: "Metrics and status",
    },
  ],
};
