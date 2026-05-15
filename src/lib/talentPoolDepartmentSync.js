function normalizeText(value, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeDepartmentKey(value) {
  return normalizeText(value).toLowerCase();
}

function slugifyDepartment(value) {
  const normalized = normalizeText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "GENERAL";
}

export function buildMissingDepartmentPools(jobs, pools, createPoolId) {
  const existingDepartments = new Set(
    normalizeArray(pools).map((pool) => normalizeDepartmentKey(pool.department)).filter(Boolean)
  );
  const existingPoolIds = new Set(
    normalizeArray(pools).map((pool) => normalizeText(pool.id)).filter(Boolean)
  );

  const uniqueJobDepartments = [...new Set(
    normalizeArray(jobs).map((job) => normalizeText(job.department)).filter(Boolean)
  )];

  return uniqueJobDepartments
    .filter((department) => !existingDepartments.has(normalizeDepartmentKey(department)))
    .map((department) => {
      const suggestedId = `POOL-${slugifyDepartment(department)}`;
      const id = existingPoolIds.has(suggestedId) ? createPoolId() : suggestedId;
      existingPoolIds.add(id);
      existingDepartments.add(normalizeDepartmentKey(department));
      return {
        id,
        name: `${department} Pool`,
        department,
        tags: [],
        description: "Auto-created from job department.",
      };
    });
}
