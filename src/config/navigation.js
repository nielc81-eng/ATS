export const navigationByRole = {
  Candidate: [
    {
      label: "Dashboard",
      to: "/candidate/dashboard",
      hint: "Resume upload and status",
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
};
