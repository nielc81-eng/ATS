export const ROLE_HOME_PATHS = {
  Candidate: "/candidate/dashboard",
  Recruiter: "/recruiter/dashboard",
  Administrator: "/admin/dashboard",
};

export function getRoleHomePath(role) {
  return ROLE_HOME_PATHS[role] ?? "/login";
}

export function getPathRole(pathname = "") {
  if (pathname.startsWith("/candidate")) return "Candidate";
  if (pathname.startsWith("/recruiter")) return "Recruiter";
  if (pathname.startsWith("/admin")) return "Administrator";
  return null;
}
