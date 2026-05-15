import { APPLICATION_STATUS } from "./applicationStatuses.js";

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeSkillKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function getOverlapSkills(candidateSkills, mustHaveSkills) {
  const mustHaveKeys = ensureArray(mustHaveSkills)
    .map(normalizeSkillKey)
    .filter(Boolean);

  return ensureArray(candidateSkills)
    .map((skill) => String(skill || "").trim())
    .filter(Boolean)
    .filter((skill) => {
      const candidateKey = normalizeSkillKey(skill);
      if (!candidateKey) return false;
      return mustHaveKeys.some(
        (mustHaveKey) =>
          candidateKey === mustHaveKey ||
          candidateKey.includes(mustHaveKey) ||
          mustHaveKey.includes(candidateKey)
      );
    });
}

export function getInitialApplicationStatus(candidateSkills, mustHaveSkills) {
  const overlapSkills = getOverlapSkills(candidateSkills, mustHaveSkills);
  const matchedToRequirements = overlapSkills.length > 0;
  return {
    overlapSkills,
    matchedToRequirements,
    initialStatus: matchedToRequirements
      ? APPLICATION_STATUS.InterviewInitial
      : APPLICATION_STATUS.PooledForFutureOpportunities,
  };
}
