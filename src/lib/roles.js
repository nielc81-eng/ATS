export const ROLES = {
  Candidate: "Candidate",
  Recruiter: "Recruiter",
  DeploymentManager: "DeploymentManager",
  Administrator: "Administrator",
};

export const ROLE_DISPLAY_LABELS = {
  [ROLES.Candidate]: "Candidate",
  [ROLES.Recruiter]: "Talent Acquisition",
  [ROLES.DeploymentManager]: "Deployment Manager",
  [ROLES.Administrator]: "Administrator",
};

export function getRoleDisplayLabel(role) {
  return ROLE_DISPLAY_LABELS[role] ?? role ?? "User";
}

