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
      label: "Users & Roles",
      to: "/admin/users",
      hint: "Account governance",
    },
    {
      label: "Audit Log",
      to: "/admin/audit-log",
      hint: "Activity review",
    },
    {
      label: "Records",
      to: "/admin/records",
      hint: "Recruiter and candidate access",
    },
    {
      label: "System Health",
      to: "/admin/system-health",
      hint: "Metrics and status",
    },
  ],
};
