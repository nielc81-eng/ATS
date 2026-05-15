function getDateValue(job) {
  const value = Date.parse(job?.postedOn || "");
  return Number.isNaN(value) ? 0 : value;
}

export function getMostRecentJobId(jobs) {
  if (!Array.isArray(jobs) || jobs.length === 0) return "";

  return [...jobs].sort((left, right) => getDateValue(right) - getDateValue(left))[0]?.id || "";
}

export function resolveJobId(jobs, requestedJobId) {
  const trimmedJobId = String(requestedJobId || "").trim();
  if (
    trimmedJobId &&
    Array.isArray(jobs) &&
    jobs.some((job) => job.id === trimmedJobId)
  ) {
    return trimmedJobId;
  }

  return getMostRecentJobId(jobs);
}

export function buildRecruiterJobPath(basePath, jobId) {
  const trimmedJobId = String(jobId || "").trim();
  if (!trimmedJobId) return basePath;

  const params = new URLSearchParams();
  params.set("job", trimmedJobId);
  return `${basePath}?${params.toString()}`;
}

export function getPathJobId(searchParams) {
  if (!searchParams) return "";
  if (typeof searchParams.get === "function") {
    return String(searchParams.get("job") || "").trim();
  }

  return "";
}
