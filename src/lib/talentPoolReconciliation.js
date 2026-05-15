import { APPLICATION_STATUS } from "./applicationStatuses.js";

function asText(value, fallback = "") {
  const next = String(value || "").trim();
  return next || fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function dedupe(values) {
  return [...new Set(values)];
}

function tokenize(values) {
  return asArray(values)
    .flatMap((item) => String(item || "").split(","))
    .map((item) => asText(item))
    .filter(Boolean);
}

export function inferPoolIdsForApplication({ application, jobs, pools, fallbackVisiblePoolIds }) {
  const sourceJob = asArray(jobs).find((job) => job.id === application.jobId);
  const department = asText(sourceJob?.department);
  const departmentPool = asArray(pools).find((pool) => asText(pool.department) === department);
  if (departmentPool) return [departmentPool.id];
  const firstVisiblePoolId = asArray(fallbackVisiblePoolIds)[0];
  return firstVisiblePoolId ? [firstVisiblePoolId] : [];
}

export function buildAutoImportedCandidate({
  application,
  jobs,
  pools,
  fallbackVisiblePoolIds,
  actor,
  now,
  createTalentId,
}) {
  const sourceJob = asArray(jobs).find((job) => job.id === application.jobId);
  const inferredSkills = dedupe(
    tokenize([sourceJob?.mustHaveSkills, sourceJob?.niceToHaveSkills]).slice(0, 8)
  );
  const poolIds = inferPoolIdsForApplication({
    application,
    jobs,
    pools,
    fallbackVisiblePoolIds,
  });

  return {
    id: createTalentId(),
    name: asText(application.candidateName, "Candidate"),
    email: asText(application.candidateEmail, ""),
    location: "Remote",
    availability: "Immediate",
    skills: inferredSkills,
    tags: [],
    poolIds,
    status: "New",
    source: "Application",
    sourceApplicationId: application.id,
    confidence: 72,
    createdOn: now,
    updatedOn: now,
    statusHistory: [
      {
        at: now,
        status: "New",
        note: `Imported from pooled application ${application.id}.`,
        by: asText(actor, "System"),
      },
    ],
  };
}

export function reconcilePooledApplications({
  applications,
  candidates,
  jobs,
  pools,
  fallbackVisiblePoolIds,
  actor,
  now,
  createTalentId,
}) {
  const pooledApplicationById = new Map(
    asArray(applications)
      .filter((application) => application.status === APPLICATION_STATUS.PooledForFutureOpportunities)
      .map((application) => [asText(application.id), application])
  );

  const remappedCandidates = asArray(candidates).map((candidate) => {
    if (
      candidate.source !== "Application" ||
      !asText(candidate.sourceApplicationId) ||
      asArray(candidate.poolIds).length > 0
    ) {
      return candidate;
    }

    const sourceApplication = pooledApplicationById.get(asText(candidate.sourceApplicationId));
    if (!sourceApplication) return candidate;

    const inferredPoolIds = inferPoolIdsForApplication({
      application: sourceApplication,
      jobs,
      pools,
      fallbackVisiblePoolIds,
    });
    if (inferredPoolIds.length === 0) return candidate;

    return {
      ...candidate,
      poolIds: inferredPoolIds,
      updatedOn: now,
      statusHistory: [
        ...asArray(candidate.statusHistory),
        {
          at: now,
          status: asText(candidate.status, "New"),
          note: "Pool assignment inferred during reconciliation.",
          by: asText(actor, "System"),
        },
      ],
    };
  });

  const existingBySourceApplicationId = new Set(
    remappedCandidates
      .map((candidate) => asText(candidate.sourceApplicationId))
      .filter(Boolean)
  );

  const pooledApplications = [...pooledApplicationById.values()];

  const addedCandidates = pooledApplications
    .filter((application) => !existingBySourceApplicationId.has(asText(application.id)))
    .map((application) =>
      buildAutoImportedCandidate({
        application,
        jobs,
        pools,
        fallbackVisiblePoolIds,
        actor,
        now,
        createTalentId,
      })
    );

  return {
    addedCandidates,
    remappedCount: remappedCandidates.filter(
      (candidate, index) => candidate !== asArray(candidates)[index]
    ).length,
    nextCandidates: [...addedCandidates, ...remappedCandidates],
  };
}

export function getUnpooledImportNotices(candidates) {
  return asArray(candidates)
    .filter(
      (candidate) =>
        candidate.source === "Application" &&
        asText(candidate.sourceApplicationId) &&
        asArray(candidate.poolIds).length === 0
    )
    .map((candidate) => ({
      sourceApplicationId: candidate.sourceApplicationId,
      candidateName: candidate.name,
      message: `Application ${candidate.sourceApplicationId} was auto-imported but is not assigned to any pool yet.`,
    }));
}
