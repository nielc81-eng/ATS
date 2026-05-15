function toDateValue(value) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeCategory(value) {
  const trimmed = String(value || "").trim();
  return trimmed || "General";
}

export function deriveCategoryApplicantCounts(jobs = [], applications = []) {
  const jobDepartmentById = new Map(
    ensureArray(jobs).map((job) => [String(job?.id || ""), normalizeCategory(job?.department)])
  );

  const counts = ensureArray(applications).reduce((acc, application) => {
    const category = jobDepartmentById.get(String(application?.jobId || "")) || "General";
    acc.set(category, (acc.get(category) || 0) + 1);
    return acc;
  }, new Map());

  return [...counts.entries()]
    .map(([category, applicants]) => ({ category, applicants }))
    .sort((left, right) => {
      if (right.applicants !== left.applicants) return right.applicants - left.applicants;
      return left.category.localeCompare(right.category);
    });
}

export function deriveApplicantsByCategory(jobs = [], applications = [], category = "") {
  const normalizedCategory = normalizeCategory(category);
  const jobMetaById = new Map(
    ensureArray(jobs).map((job) => [
      String(job?.id || ""),
      {
        category: normalizeCategory(job?.department),
        title: String(job?.title || "Unknown Role"),
      },
    ])
  );

  return ensureArray(applications)
    .filter((application) => {
      const jobMeta = jobMetaById.get(String(application?.jobId || ""));
      return (jobMeta?.category || "General") === normalizedCategory;
    })
    .map((application) => {
      const jobMeta = jobMetaById.get(String(application?.jobId || ""));
      return {
        applicationId: String(application?.id || ""),
        candidateName: String(application?.candidateName || "Candidate"),
        jobId: String(application?.jobId || ""),
        jobTitle: String(application?.jobTitle || jobMeta?.title || "Unknown Role"),
        status: String(application?.status || "Submitted"),
        appliedOn: String(application?.appliedOn || ""),
        updatedOn: String(application?.updatedOn || application?.appliedOn || ""),
      };
    })
    .sort((left, right) => toDateValue(right.updatedOn) - toDateValue(left.updatedOn));
}
