import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useRecruitmentData } from "./RecruitmentDataContext";
import { getAccounts } from "../lib/mockAuthStore";
import { APPLICATION_STATUS } from "../lib/applicationStatuses";
import {
  candidateAvailabilityStates,
  defaultMatchingSettings,
  seededCandidates,
  seededPools,
  seededRecruiterPermissions,
  seededVacancies,
  TALENT_POOL_STORAGE_KEY,
  talentPoolStatuses,
  vacancyStates,
} from "../lib/talentPoolSchemas";
import {
  getUnpooledImportNotices,
  reconcilePooledApplications,
} from "../lib/talentPoolReconciliation";
import { buildMissingDepartmentPools } from "../lib/talentPoolDepartmentSync";

const TalentPoolContext = createContext(null);

function createTalentId() {
  return `TPC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

function createPoolId() {
  return `POOL-${Date.now().toString(36).slice(-4)}`.toUpperCase();
}

function createVacancyId() {
  return `VAC-${Date.now().toString(36).slice(-4)}`.toUpperCase();
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeDate(value, fallback = new Date().toISOString()) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString();
}

function clampNumber(value, minimum, maximum, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function normalizePool(pool = {}) {
  return {
    id: normalizeText(pool.id, createPoolId()),
    name: normalizeText(pool.name, "Untitled Pool"),
    department: normalizeText(pool.department, "General"),
    tags: normalizeArray(pool.tags).map((tag) => normalizeText(tag)).filter(Boolean),
    description: normalizeText(pool.description, ""),
  };
}

function normalizeVacancy(vacancy = {}) {
  return {
    id: normalizeText(vacancy.id, createVacancyId()),
    title: normalizeText(vacancy.title, "Untitled Vacancy"),
    poolId: normalizeText(vacancy.poolId, ""),
    department: normalizeText(vacancy.department, "General"),
    skills: normalizeArray(vacancy.skills)
      .map((skill) => normalizeText(skill))
      .filter(Boolean),
    location: normalizeText(vacancy.location, "Remote"),
    availability: candidateAvailabilityStates.includes(vacancy.availability)
      ? vacancy.availability
      : "Immediate",
    state: vacancyStates.includes(vacancy.state) ? vacancy.state : "Open",
    createdOn: normalizeDate(vacancy.createdOn),
  };
}

function normalizeStatusHistoryEntry(entry = {}) {
  return {
    at: normalizeDate(entry.at),
    status: talentPoolStatuses.includes(entry.status) ? entry.status : "New",
    note: normalizeText(entry.note, ""),
    by: normalizeText(entry.by, "System"),
  };
}

function normalizeCandidate(candidate = {}) {
  const status = talentPoolStatuses.includes(candidate.status) ? candidate.status : "New";
  const statusHistory = normalizeArray(candidate.statusHistory)
    .map(normalizeStatusHistoryEntry)
    .sort((left, right) => Date.parse(left.at) - Date.parse(right.at));
  const createdOn = normalizeDate(candidate.createdOn || statusHistory[0]?.at);
  const updatedOn = normalizeDate(candidate.updatedOn || statusHistory.at(-1)?.at || createdOn);

  return {
    id: normalizeText(candidate.id, createTalentId()),
    name: normalizeText(candidate.name, "Candidate"),
    email: normalizeText(candidate.email, ""),
    location: normalizeText(candidate.location, "Remote"),
    availability: candidateAvailabilityStates.includes(candidate.availability)
      ? candidate.availability
      : "Immediate",
    skills: normalizeArray(candidate.skills)
      .map((skill) => normalizeText(skill))
      .filter(Boolean),
    tags: normalizeArray(candidate.tags).map((tag) => normalizeText(tag)).filter(Boolean),
    poolIds: normalizeArray(candidate.poolIds).map((id) => normalizeText(id)).filter(Boolean),
    status,
    statusHistory:
      statusHistory.length > 0
        ? statusHistory
        : [{ at: createdOn, status, note: "Candidate added to talent pool.", by: "System" }],
    source: normalizeText(candidate.source, "Manual"),
    sourceApplicationId: normalizeText(candidate.sourceApplicationId, ""),
    confidence: clampNumber(candidate.confidence, 0, 100, 70),
    createdOn,
    updatedOn,
  };
}

function normalizePermissions(value = {}) {
  return Object.entries(value).reduce((acc, [email, permission]) => {
    const normalizedEmail = normalizeText(email).toLowerCase();
    if (!normalizedEmail) return acc;
    acc[normalizedEmail] = {
      poolIds: normalizeArray(permission?.poolIds)
        .map((poolId) => normalizeText(poolId))
        .filter(Boolean),
      departments: normalizeArray(permission?.departments)
        .map((department) => normalizeText(department))
        .filter(Boolean),
    };
    return acc;
  }, {});
}

function createSeedState() {
  return {
    pools: seededPools.map(normalizePool),
    vacancies: seededVacancies.map(normalizeVacancy),
    candidates: seededCandidates.map(normalizeCandidate),
    recruiterPermissions: normalizePermissions(seededRecruiterPermissions),
    matchingSettings: {
      threshold: clampNumber(defaultMatchingSettings.threshold, 1, 100, 65),
      skillWeight: clampNumber(defaultMatchingSettings.skillWeight, 0, 1, 0.7),
      confidenceWeight: clampNumber(defaultMatchingSettings.confidenceWeight, 0, 1, 0.3),
    },
    updatedOn: new Date().toISOString(),
  };
}

function normalizeState(value) {
  const seed = createSeedState();
  if (!value || typeof value !== "object") return seed;

  return {
    pools: normalizeArray(value.pools).map(normalizePool),
    vacancies: normalizeArray(value.vacancies).map(normalizeVacancy),
    candidates: normalizeArray(value.candidates).map(normalizeCandidate),
    recruiterPermissions: normalizePermissions(value.recruiterPermissions),
    matchingSettings: {
      threshold: clampNumber(value.matchingSettings?.threshold, 1, 100, seed.matchingSettings.threshold),
      skillWeight: clampNumber(value.matchingSettings?.skillWeight, 0, 1, seed.matchingSettings.skillWeight),
      confidenceWeight: clampNumber(
        value.matchingSettings?.confidenceWeight,
        0,
        1,
        seed.matchingSettings.confidenceWeight
      ),
    },
    updatedOn: normalizeDate(value.updatedOn, seed.updatedOn),
  };
}

function readStoredState() {
  if (typeof window === "undefined") return createSeedState();

  try {
    const raw = window.localStorage.getItem(TALENT_POOL_STORAGE_KEY);
    if (!raw) return createSeedState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return createSeedState();
  }
}

function persistState(state) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TALENT_POOL_STORAGE_KEY, JSON.stringify(state));
}

function toDateValue(value) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function tokenize(value) {
  return normalizeArray(value)
    .flatMap((item) => String(item || "").split(","))
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function dedupe(values) {
  return [...new Set(values)];
}

function mergePermissionWithPools(permission = {}, pools = []) {
  const existingPoolIds = dedupe(
    normalizeArray(permission.poolIds).map((poolId) => normalizeText(poolId)).filter(Boolean)
  );
  const existingDepartments = dedupe(
    normalizeArray(permission.departments)
      .map((department) => normalizeText(department))
      .filter(Boolean)
  );

  const nextPoolIds = dedupe([
    ...existingPoolIds,
    ...normalizeArray(pools).map((pool) => normalizeText(pool.id)).filter(Boolean),
  ]);
  const nextDepartments = dedupe([
    ...existingDepartments,
    ...normalizeArray(pools)
      .map((pool) => normalizeText(pool.department))
      .filter(Boolean),
  ]);

  return {
    poolIds: nextPoolIds,
    departments: nextDepartments,
  };
}

function collectJobDepartmentPools(jobs = [], pools = []) {
  const departmentSet = new Set(
    normalizeArray(jobs)
      .map((job) => normalizeText(job.department).toLowerCase())
      .filter(Boolean)
  );
  return normalizeArray(pools).filter((pool) =>
    departmentSet.has(normalizeText(pool.department).toLowerCase())
  );
}

function getRecruiterPermission(email, recruiterPermissions) {
  const normalizedEmail = normalizeText(email).toLowerCase();
  if (!normalizedEmail) return { poolIds: [], departments: [] };
  return recruiterPermissions[normalizedEmail] || { poolIds: [], departments: [] };
}

function getVisiblePoolIdsForRecruiter(email, pools, recruiterPermissions) {
  const permission = getRecruiterPermission(email, recruiterPermissions);
  if (!permission.poolIds.length && !permission.departments.length) return [];

  return pools
    .filter(
      (pool) =>
        permission.poolIds.includes(pool.id) ||
        permission.departments.includes(pool.department)
    )
    .map((pool) => pool.id);
}

function buildRecommendation(candidate, vacancy, settings) {
  const candidateSkillSet = new Set(
    normalizeArray(candidate.skills).map((skill) => skill.toLowerCase())
  );
  const vacancySkills = normalizeArray(vacancy.skills).map((skill) => skill.toLowerCase());
  const overlap = vacancySkills.filter((skill) => candidateSkillSet.has(skill)).length;
  const overlapRatio = vacancySkills.length > 0 ? overlap / vacancySkills.length : 0;
  const confidenceRatio = clampNumber(candidate.confidence, 0, 100, 0) / 100;
  const score =
    overlapRatio * 100 * settings.skillWeight +
    confidenceRatio * 100 * settings.confidenceWeight;
  const roundedScore = Math.round(clampNumber(score, 0, 100, 0));

  return {
    candidateId: candidate.id,
    vacancyId: vacancy.id,
    score: roundedScore,
    recommended: roundedScore >= settings.threshold,
    overlapSkills: vacancy.skills.filter((skill) =>
      candidateSkillSet.has(String(skill || "").toLowerCase())
    ),
  };
}

function getCandidateStatusBreakdown(candidates) {
  return talentPoolStatuses.reduce((acc, status) => {
    acc[status] = candidates.filter((candidate) => candidate.status === status).length;
    return acc;
  }, {});
}

export function TalentPoolProvider({ children }) {
  const { session } = useAuth();
  const { jobs, applicationsByEmail } = useRecruitmentData();
  const [state, setState] = useState(() => readStoredState());

  useEffect(() => {
    persistState(state);
  }, [state]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === TALENT_POOL_STORAGE_KEY) {
        setState(readStoredState());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const actor = session?.name || session?.email || "System";

  const recruiterEmails = useMemo(
    () =>
      getAccounts()
        .filter((account) => account.role === "Recruiter" && account.status === "Active")
        .map((account) => account.email.toLowerCase()),
    [session?.email]
  );

  const recruiterPermissionMap = useMemo(() => {
    const next = { ...state.recruiterPermissions };
    recruiterEmails.forEach((email) => {
      if (!next[email]) {
        next[email] = { poolIds: [], departments: [] };
      }
    });
    return next;
  }, [recruiterEmails, state.recruiterPermissions]);

  const allApplications = useMemo(
    () =>
      Object.values(applicationsByEmail || {})
        .flat()
        .sort((left, right) => toDateValue(right.updatedOn) - toDateValue(left.updatedOn)),
    [applicationsByEmail]
  );

  const accessiblePoolIds = useMemo(() => {
    if (session?.role === "Administrator") {
      return state.pools.map((pool) => pool.id);
    }

    if (session?.role === "Recruiter") {
      return getVisiblePoolIdsForRecruiter(session.email, state.pools, recruiterPermissionMap);
    }

    return [];
  }, [recruiterPermissionMap, session?.email, session?.role, state.pools]);

  const visiblePools = useMemo(
    () => state.pools.filter((pool) => accessiblePoolIds.includes(pool.id)),
    [accessiblePoolIds, state.pools]
  );

  const visibleVacancies = useMemo(() => {
    if (session?.role === "Administrator") return state.vacancies;
    return state.vacancies.filter((vacancy) => accessiblePoolIds.includes(vacancy.poolId));
  }, [accessiblePoolIds, session?.role, state.vacancies]);

  const visibleCandidates = useMemo(() => {
    if (session?.role === "Administrator") return state.candidates;
    return state.candidates.filter((candidate) =>
      candidate.poolIds.some((poolId) => accessiblePoolIds.includes(poolId))
    );
  }, [accessiblePoolIds, session?.role, state.candidates]);

  useEffect(() => {
    const now = new Date().toISOString();
    setState((prev) => {
      const missingPools = buildMissingDepartmentPools(jobs, prev.pools, createPoolId);
      const nextPools = missingPools.length > 0 ? [...prev.pools, ...missingPools] : prev.pools;
      const poolsFromJobDepartments = collectJobDepartmentPools(jobs, nextPools);
      const nextPermissions = Object.entries(prev.recruiterPermissions).reduce(
        (acc, [email, permission]) => {
          acc[email] = mergePermissionWithPools(permission, poolsFromJobDepartments);
          return acc;
        },
        {}
      );
      const reconciled = reconcilePooledApplications({
        applications: allApplications,
        candidates: prev.candidates,
        jobs,
        pools: nextPools,
        fallbackVisiblePoolIds: accessiblePoolIds,
        actor,
        now,
        createTalentId,
      });

      if (
        missingPools.length === 0 &&
        reconciled.addedCandidates.length === 0 &&
        reconciled.remappedCount === 0 &&
        JSON.stringify(prev.recruiterPermissions) === JSON.stringify(nextPermissions)
      ) {
        return prev;
      }
      return {
        ...prev,
        pools: nextPools.map(normalizePool),
        recruiterPermissions: normalizePermissions(nextPermissions),
        candidates: reconciled.nextCandidates.map(normalizeCandidate),
        updatedOn: now,
      };
    });
  }, [accessiblePoolIds, actor, allApplications, jobs]);

  const recommendationMap = useMemo(() => {
    return visibleCandidates.reduce((acc, candidate) => {
      const vacancyRecommendations = visibleVacancies
        .filter((vacancy) => vacancy.state === "Open")
        .map((vacancy) => buildRecommendation(candidate, vacancy, state.matchingSettings))
        .sort((left, right) => right.score - left.score);
      acc[candidate.id] = vacancyRecommendations;
      return acc;
    }, {});
  }, [state.matchingSettings, visibleCandidates, visibleVacancies]);

  const globalRecommendationStats = useMemo(() => {
    const topScores = Object.values(recommendationMap)
      .map((recommendations) => recommendations[0]?.score || 0)
      .filter((score) => Number.isFinite(score));

    const averageScore =
      topScores.length > 0
        ? Math.round(topScores.reduce((sum, score) => sum + score, 0) / topScores.length)
        : 0;

    return {
      averageTopScore: averageScore,
      recommendedPairs: Object.values(recommendationMap).reduce(
        (sum, recommendations) =>
          sum + recommendations.filter((item) => item.recommended).length,
        0
      ),
    };
  }, [recommendationMap]);

  const analytics = useMemo(() => {
    const statusBreakdown = getCandidateStatusBreakdown(state.candidates);
    const openVacancies = state.vacancies.filter((vacancy) => vacancy.state === "Open").length;

    return {
      totalPools: state.pools.length,
      totalCandidates: state.candidates.length,
      totalVacancies: state.vacancies.length,
      openVacancies,
      statusBreakdown,
      averageTopMatchScore: globalRecommendationStats.averageTopScore,
      recommendedPairs: globalRecommendationStats.recommendedPairs,
    };
  }, [globalRecommendationStats, state.candidates, state.pools.length, state.vacancies]);

  const addCandidateFromApplication = useCallback(
    (applicationId, payload = {}) => {
      const selectedApplication = allApplications.find(
        (application) => application.id === applicationId
      );
      if (!selectedApplication) {
        return { ok: false, message: "Application was not found." };
      }

      const duplicate = state.candidates.find(
        (candidate) => candidate.sourceApplicationId === selectedApplication.id
      );
      if (duplicate) {
        return { ok: false, message: "Candidate is already in the talent pool." };
      }

      const sourceJob = jobs.find((job) => job.id === selectedApplication.jobId);
      const inferredPool =
        state.pools.find((pool) => pool.department === sourceJob?.department) || state.pools[0];

      const requestedPoolIds = dedupe(
        normalizeArray(payload.poolIds).filter((poolId) =>
          state.pools.some((pool) => pool.id === poolId)
        )
      );
      const poolIds = requestedPoolIds.length > 0 ? requestedPoolIds : inferredPool ? [inferredPool.id] : [];

      if (session?.role === "Recruiter") {
        const blockedPool = poolIds.some((poolId) => !accessiblePoolIds.includes(poolId));
        if (blockedPool) {
          return { ok: false, message: "You can only add candidates to assigned pools." };
        }
      }

      const now = new Date().toISOString();
      const inferredSkills = dedupe(
        tokenize([sourceJob?.mustHaveSkills, sourceJob?.niceToHaveSkills]).slice(0, 8)
      );

      const candidate = normalizeCandidate({
        id: createTalentId(),
        name: payload.name || selectedApplication.candidateName || "Candidate",
        email: payload.email || selectedApplication.candidateEmail || "",
        location: payload.location || "Remote",
        availability: payload.availability || "Immediate",
        skills: payload.skills?.length ? payload.skills : inferredSkills,
        tags: dedupe(tokenize(payload.tags)),
        poolIds,
        status: payload.status || "New",
        source: "Application",
        sourceApplicationId: selectedApplication.id,
        confidence: payload.confidence ?? 72,
        createdOn: now,
        updatedOn: now,
        statusHistory: [
          {
            at: now,
            status: payload.status || "New",
            note: `Imported from application ${selectedApplication.id}.`,
            by: actor,
          },
        ],
      });

      setState((prev) => ({
        ...prev,
        candidates: [candidate, ...prev.candidates],
        updatedOn: now,
      }));

      return { ok: true, candidate };
    },
    [accessiblePoolIds, actor, allApplications, jobs, session?.role, state.candidates, state.pools]
  );

  const addManualCandidate = useCallback(
    (payload = {}) => {
      const poolIds = dedupe(
        normalizeArray(payload.poolIds).filter((poolId) =>
          state.pools.some((pool) => pool.id === poolId)
        )
      );
      if (poolIds.length === 0) {
        return { ok: false, message: "Choose at least one pool." };
      }

      if (session?.role === "Recruiter") {
        const blockedPool = poolIds.some((poolId) => !accessiblePoolIds.includes(poolId));
        if (blockedPool) {
          return { ok: false, message: "You can only add candidates to assigned pools." };
        }
      }

      const name = normalizeText(payload.name);
      if (!name) {
        return { ok: false, message: "Candidate name is required." };
      }

      const now = new Date().toISOString();
      const candidate = normalizeCandidate({
        id: createTalentId(),
        name,
        email: normalizeText(payload.email, ""),
        location: normalizeText(payload.location, "Remote"),
        availability: candidateAvailabilityStates.includes(payload.availability)
          ? payload.availability
          : "Immediate",
        skills: dedupe(tokenize(payload.skills)),
        tags: dedupe(tokenize(payload.tags)),
        poolIds,
        status: talentPoolStatuses.includes(payload.status) ? payload.status : "New",
        source: "Manual",
        sourceApplicationId: "",
        confidence: clampNumber(payload.confidence, 0, 100, 70),
        createdOn: now,
        updatedOn: now,
        statusHistory: [
          {
            at: now,
            status: talentPoolStatuses.includes(payload.status) ? payload.status : "New",
            note: normalizeText(payload.note, "Manually added to talent pool."),
            by: actor,
          },
        ],
      });

      setState((prev) => ({
        ...prev,
        candidates: [candidate, ...prev.candidates],
        updatedOn: now,
      }));

      return { ok: true, candidate };
    },
    [accessiblePoolIds, actor, session?.role, state.pools]
  );

  const updateCandidateStatus = useCallback(
    (candidateId, status, note = "") => {
      if (!talentPoolStatuses.includes(status)) {
        return { ok: false, message: "Unsupported status." };
      }

      const current = state.candidates.find((candidate) => candidate.id === candidateId);
      if (!current) return { ok: false, message: "Candidate not found." };

      if (session?.role === "Recruiter") {
        const allowed = current.poolIds.some((poolId) => accessiblePoolIds.includes(poolId));
        if (!allowed) {
          return { ok: false, message: "You can only update candidates in assigned pools." };
        }
      }

      const now = new Date().toISOString();
      const nextCandidate = {
        ...current,
        status,
        updatedOn: now,
        statusHistory: [
          ...current.statusHistory,
          {
            at: now,
            status,
            note: normalizeText(note, `Status updated to ${status}.`),
            by: actor,
          },
        ],
      };

      setState((prev) => ({
        ...prev,
        candidates: prev.candidates.map((candidate) =>
          candidate.id === candidateId ? nextCandidate : candidate
        ),
        updatedOn: now,
      }));

      return { ok: true, candidate: nextCandidate };
    },
    [accessiblePoolIds, actor, session?.role, state.candidates]
  );

  const updateCandidateDetails = useCallback(
    (candidateId, payload = {}) => {
      const current = state.candidates.find((candidate) => candidate.id === candidateId);
      if (!current) return { ok: false, message: "Candidate not found." };

      if (session?.role === "Recruiter") {
        const allowed = current.poolIds.some((poolId) => accessiblePoolIds.includes(poolId));
        if (!allowed) {
          return { ok: false, message: "You can only update candidates in assigned pools." };
        }
      }

      const poolIds = payload.poolIds
        ? dedupe(
            normalizeArray(payload.poolIds).filter((poolId) =>
              state.pools.some((pool) => pool.id === poolId)
            )
          )
        : current.poolIds;

      if (session?.role === "Recruiter") {
        const blockedPool = poolIds.some((poolId) => !accessiblePoolIds.includes(poolId));
        if (blockedPool) {
          return { ok: false, message: "Pool reassignment is limited to assigned pools." };
        }
      }

      const now = new Date().toISOString();
      const nextCandidate = {
        ...current,
        location: normalizeText(payload.location, current.location),
        availability: candidateAvailabilityStates.includes(payload.availability)
          ? payload.availability
          : current.availability,
        skills: payload.skills ? dedupe(tokenize(payload.skills)) : current.skills,
        tags: payload.tags ? dedupe(tokenize(payload.tags)) : current.tags,
        poolIds,
        confidence:
          payload.confidence === undefined
            ? current.confidence
            : clampNumber(payload.confidence, 0, 100, current.confidence),
        updatedOn: now,
      };

      setState((prev) => ({
        ...prev,
        candidates: prev.candidates.map((candidate) =>
          candidate.id === candidateId ? nextCandidate : candidate
        ),
        updatedOn: now,
      }));

      return { ok: true, candidate: nextCandidate };
    },
    [accessiblePoolIds, session?.role, state.candidates, state.pools]
  );

  const upsertPool = useCallback(
    (payload = {}) => {
      if (session?.role !== "Administrator") {
        return { ok: false, message: "Only administrators can manage pools." };
      }

      const id = normalizeText(payload.id);
      const name = normalizeText(payload.name);
      const department = normalizeText(payload.department);
      if (!name || !department) {
        return { ok: false, message: "Pool name and department are required." };
      }

      const now = new Date().toISOString();
      const nextPool = normalizePool({
        id: id || createPoolId(),
        name,
        department,
        tags: dedupe(tokenize(payload.tags)),
        description: normalizeText(payload.description, ""),
      });

      setState((prev) => {
        const exists = prev.pools.some((pool) => pool.id === nextPool.id);
        return {
          ...prev,
          pools: exists
            ? prev.pools.map((pool) => (pool.id === nextPool.id ? nextPool : pool))
            : [nextPool, ...prev.pools],
          updatedOn: now,
        };
      });

      return { ok: true, pool: nextPool };
    },
    [session?.role]
  );

  const upsertVacancy = useCallback(
    (payload = {}) => {
      if (session?.role !== "Administrator") {
        return { ok: false, message: "Only administrators can manage vacancies." };
      }

      const id = normalizeText(payload.id);
      const title = normalizeText(payload.title);
      const poolId = normalizeText(payload.poolId);
      if (!title || !poolId) {
        return { ok: false, message: "Vacancy title and pool are required." };
      }

      const pool = state.pools.find((item) => item.id === poolId);
      if (!pool) {
        return { ok: false, message: "Selected pool does not exist." };
      }

      const now = new Date().toISOString();
      const nextVacancy = normalizeVacancy({
        id: id || createVacancyId(),
        title,
        poolId,
        department: normalizeText(payload.department, pool.department),
        skills: dedupe(tokenize(payload.skills)),
        location: normalizeText(payload.location, "Remote"),
        availability: payload.availability || "Immediate",
        state: payload.state || "Open",
        createdOn: payload.createdOn || now,
      });

      setState((prev) => {
        const exists = prev.vacancies.some((vacancy) => vacancy.id === nextVacancy.id);
        return {
          ...prev,
          vacancies: exists
            ? prev.vacancies.map((vacancy) =>
                vacancy.id === nextVacancy.id ? nextVacancy : vacancy
              )
            : [nextVacancy, ...prev.vacancies],
          updatedOn: now,
        };
      });

      return { ok: true, vacancy: nextVacancy };
    },
    [session?.role, state.pools]
  );

  const setMatchingSettings = useCallback(
    (payload = {}) => {
      if (session?.role !== "Administrator") {
        return { ok: false, message: "Only administrators can update matching settings." };
      }

      const threshold = clampNumber(payload.threshold, 1, 100, state.matchingSettings.threshold);
      const skillWeight = clampNumber(payload.skillWeight, 0, 1, state.matchingSettings.skillWeight);
      const confidenceWeight = clampNumber(
        payload.confidenceWeight,
        0,
        1,
        state.matchingSettings.confidenceWeight
      );

      const totalWeight = skillWeight + confidenceWeight;
      const normalizedSkillWeight = totalWeight > 0 ? skillWeight / totalWeight : 0.7;
      const normalizedConfidenceWeight =
        totalWeight > 0 ? confidenceWeight / totalWeight : 0.3;
      const now = new Date().toISOString();

      const nextSettings = {
        threshold,
        skillWeight: Number(normalizedSkillWeight.toFixed(2)),
        confidenceWeight: Number(normalizedConfidenceWeight.toFixed(2)),
      };

      setState((prev) => ({
        ...prev,
        matchingSettings: nextSettings,
        updatedOn: now,
      }));

      return { ok: true, settings: nextSettings };
    },
    [session?.role, state.matchingSettings]
  );

  const setRecruiterAccess = useCallback(
    (email, payload = {}) => {
      if (session?.role !== "Administrator") {
        return { ok: false, message: "Only administrators can update recruiter access." };
      }

      const normalizedEmail = normalizeText(email).toLowerCase();
      if (!normalizedEmail) return { ok: false, message: "Recruiter email is required." };

      const poolIds = dedupe(
        normalizeArray(payload.poolIds).filter((poolId) =>
          state.pools.some((pool) => pool.id === poolId)
        )
      );
      const departments = dedupe(tokenize(payload.departments));
      const now = new Date().toISOString();

      const permission = { poolIds, departments };

      setState((prev) => ({
        ...prev,
        recruiterPermissions: {
          ...prev.recruiterPermissions,
          [normalizedEmail]: permission,
        },
        updatedOn: now,
      }));

      return { ok: true, permission };
    },
    [session?.role, state.pools]
  );

  const candidateApplicationsForIntake = useMemo(() => {
    return allApplications.filter((application) => {
      if (application.status === APPLICATION_STATUS.PooledForFutureOpportunities) return false;

      const alreadyPooled = state.candidates.some(
        (candidate) => candidate.sourceApplicationId === application.id
      );
      if (alreadyPooled) return false;

      if (session?.role !== "Recruiter") return true;

      const sourceJob = jobs.find((job) => job.id === application.jobId);
      const department = sourceJob?.department || "";

      const allowedByDepartment = state.pools.some(
        (pool) =>
          accessiblePoolIds.includes(pool.id) && pool.department === department
      );

      return allowedByDepartment || !department;
    });
  }, [accessiblePoolIds, allApplications, jobs, session?.role, state.candidates, state.pools]);

  const unpooledImportNotices = useMemo(
    () => getUnpooledImportNotices(state.candidates),
    [state.candidates]
  );

  const value = useMemo(
    () => ({
      pools: state.pools,
      vacancies: state.vacancies,
      candidates: state.candidates,
      visiblePools,
      visibleVacancies,
      visibleCandidates,
      matchingSettings: state.matchingSettings,
      recruiterPermissions: recruiterPermissionMap,
      candidateApplicationsForIntake,
      unpooledImportNotices,
      recommendationMap,
      analytics,
      addCandidateFromApplication,
      addManualCandidate,
      updateCandidateStatus,
      updateCandidateDetails,
      upsertPool,
      upsertVacancy,
      setMatchingSettings,
      setRecruiterAccess,
    }),
    [
      addCandidateFromApplication,
      addManualCandidate,
      analytics,
      candidateApplicationsForIntake,
      unpooledImportNotices,
      recommendationMap,
      recruiterPermissionMap,
      setMatchingSettings,
      setRecruiterAccess,
      state.candidates,
      state.matchingSettings,
      state.pools,
      state.vacancies,
      updateCandidateDetails,
      updateCandidateStatus,
      upsertPool,
      upsertVacancy,
      visibleCandidates,
      visiblePools,
      visibleVacancies,
    ]
  );

  return <TalentPoolContext.Provider value={value}>{children}</TalentPoolContext.Provider>;
}

export function useTalentPool() {
  const context = useContext(TalentPoolContext);
  if (!context) {
    throw new Error("useTalentPool must be used within a TalentPoolProvider");
  }
  return context;
}
