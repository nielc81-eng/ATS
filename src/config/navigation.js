/**
 * navigation.js — Route definitions with Lucide icon names per role.
 * Icons are imported and resolved in the Sidebar/NavItem components.
 */

export const navigationByRole = {
  Candidate: [
    {
      label: "Dashboard",
      to: "/candidate/dashboard",
      hint: "Overview and quick actions",
      icon: "LayoutDashboard",
    },
    {
      label: "Profile",
      to: "/candidate/profile",
      hint: "Manage your profile",
      icon: "UserRound",
    },
    {
      label: "Browse Jobs",
      to: "/jobs",
      hint: "Public opportunities",
      icon: "Briefcase",
    },
    {
      label: "Applications",
      to: "/candidate/applications",
      hint: "Track status updates",
      icon: "ClipboardList",
    },
    {
      label: "Documents",
      to: "/candidate/documents",
      hint: "Resume and onboarding files",
      icon: "FolderOpen",
    },
    {
      label: "Notifications",
      to: "/candidate/notifications",
      hint: "Latest activity updates",
      icon: "Bell",
    },
  ],

  Recruiter: [
    {
      label: "Dashboard",
      to: "/recruiter/dashboard",
      hint: "Overview metrics",
      icon: "LayoutDashboard",
    },
    {
      label: "Jobs",
      to: "/recruiter/jobs",
      hint: "Requisitions",
      icon: "Briefcase",
    },
    {
      label: "Applicants",
      to: "/recruiter/applicants",
      hint: "Search and manage applicants",
      icon: "Users",
    },
    {
      label: "Digital 201 Files",
      to: "/recruiter/files",
      hint: "HR file vault",
      icon: "FileStack",
    },
    {
      label: "Screening",
      to: "/recruiter/screening",
      hint: "Review AI-ranked candidates",
      icon: "ScanSearch",
    },
    {
      label: "Analytics",
      to: "/recruiter/analytics",
      hint: "View analytics and audit reports",
      icon: "BarChart3",
    },
    {
      label: "Talent Pool",
      to: "/recruiter/talent-pool",
      hint: "Search and re-evaluate profiles",
      icon: "Database",
    },
    {
      label: "Compliance Gate",
      to: "/recruiter/compliance-gate",
      hint: "7-day interview compliance decision",
      icon: "ShieldCheck",
    },
  ],

  DeploymentManager: [
    {
      label: "Dashboard",
      to: "/deployment-manager/dashboard",
      hint: "Deployment operations overview",
      icon: "LayoutDashboard",
    },
    {
      label: "Requests",
      to: "/deployment-manager/requests",
      hint: "Review and decide deployment requests",
      icon: "Inbox",
    },
    {
      label: "Assignments",
      to: "/deployment-manager/assignments",
      hint: "Monitor and update active assignments",
      icon: "UserCheck",
    },
    {
      label: "Schedule",
      to: "/deployment-manager/schedule",
      hint: "Track planned and active schedules",
      icon: "CalendarRange",
    },
    {
      label: "Digital 201 Vault",
      to: "/deployment-manager/vault",
      hint: "Manage employee vault records",
      icon: "Vault",
    },
    {
      label: "Notifications",
      to: "/deployment-manager/notifications",
      hint: "Expiration alerts and compliance triggers",
      icon: "Bell",
    },
  ],

  Administrator: [
    {
      label: "Dashboard",
      to: "/admin/dashboard",
      hint: "Platform overview",
      icon: "LayoutDashboard",
    },
    {
      label: "Manage Staff Accounts",
      to: "/admin/users",
      hint: "Manage accounts, roles, and privileges",
      icon: "UsersRound",
    },
    {
      label: "Recruitment and AI Policies",
      to: "/admin/policies",
      hint: "Set policy guardrails and defaults",
      icon: "ShieldAlert",
    },
    {
      label: "Audit Timeline",
      to: "/admin/audit",
      hint: "Monitor platform activity timelines",
      icon: "ScrollText",
    },
    {
      label: "Reports",
      to: "/admin/reports",
      hint: "Operational report hub",
      icon: "BarChart3",
    },
    {
      label: "System",
      to: "/admin/system",
      hint: "Cleanup and backup controls",
      icon: "Server",
    },
    {
      label: "Settings",
      to: "/admin/settings",
      hint: "Admin profile and policy settings",
      icon: "Settings2",
    },
  ],
};
