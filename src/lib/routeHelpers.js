export const ROLE_HOME_PATHS = {
  Candidate: "/candidate/dashboard",
  Recruiter: "/recruiter/dashboard",
};

export function getRoleHomePath(role) {
  return ROLE_HOME_PATHS[role] ?? "/login";
}

export function getPathRole(pathname = "") {
  if (pathname.startsWith("/candidate")) return "Candidate";
  if (pathname.startsWith("/recruiter")) return "Recruiter";
  return null;
}
