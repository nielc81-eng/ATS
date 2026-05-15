import test from "node:test";
import assert from "node:assert/strict";
import { APPLICATION_STATUS } from "../src/lib/applicationStatuses.js";
import {
  buildAutoImportedCandidate,
  reconcilePooledApplications,
} from "../src/lib/talentPoolReconciliation.js";

const jobs = [
  {
    id: "JOB-OPS-1",
    department: "Operations",
    mustHaveSkills: ["Dispatch", "Planning"],
    niceToHaveSkills: ["Excel"],
  },
];

const pools = [
  { id: "POOL-OPS", department: "Operations" },
  { id: "POOL-HR", department: "HR" },
];

const pooledApplication = {
  id: "APP-100",
  jobId: "JOB-OPS-1",
  candidateName: "Ava Cruz",
  candidateEmail: "ava@example.com",
  status: APPLICATION_STATUS.PooledForFutureOpportunities,
};

test("reconcilePooledApplications imports pooled application once", () => {
  const first = reconcilePooledApplications({
    applications: [pooledApplication],
    candidates: [],
    jobs,
    pools,
    fallbackVisiblePoolIds: ["POOL-HR"],
    actor: "Recruiter One",
    now: "2026-05-15T01:00:00.000Z",
    createTalentId: () => "TPC-NEW-1",
  });

  assert.equal(first.addedCandidates.length, 1);
  assert.equal(first.addedCandidates[0].sourceApplicationId, "APP-100");
  assert.deepEqual(first.addedCandidates[0].poolIds, ["POOL-OPS"]);
  assert.equal(first.addedCandidates[0].status, "New");
  assert.match(first.addedCandidates[0].statusHistory[0].note, /Imported from pooled application APP-100\./);

  const second = reconcilePooledApplications({
    applications: [pooledApplication],
    candidates: first.nextCandidates,
    jobs,
    pools,
    fallbackVisiblePoolIds: ["POOL-HR"],
    actor: "Recruiter One",
    now: "2026-05-15T01:01:00.000Z",
    createTalentId: () => "TPC-NEW-2",
  });

  assert.equal(second.addedCandidates.length, 0);
  assert.equal(second.nextCandidates.length, 1);
});

test("buildAutoImportedCandidate falls back to first visible pool when no department match", () => {
  const candidate = buildAutoImportedCandidate({
    application: {
      ...pooledApplication,
      id: "APP-200",
      jobId: "JOB-NO-DEPT",
    },
    jobs,
    pools,
    fallbackVisiblePoolIds: ["POOL-HR"],
    actor: "Recruiter One",
    now: "2026-05-15T02:00:00.000Z",
    createTalentId: () => "TPC-NEW-3",
  });

  assert.deepEqual(candidate.poolIds, ["POOL-HR"]);
});

test("buildAutoImportedCandidate remains unpooled when no department match and no visible pools", () => {
  const candidate = buildAutoImportedCandidate({
    application: {
      ...pooledApplication,
      id: "APP-300",
      jobId: "JOB-NO-DEPT",
    },
    jobs,
    pools: [{ id: "POOL-OPS", department: "Operations" }],
    fallbackVisiblePoolIds: [],
    actor: "Recruiter One",
    now: "2026-05-15T03:00:00.000Z",
    createTalentId: () => "TPC-NEW-4",
  });

  assert.deepEqual(candidate.poolIds, []);
});

test("reconcilePooledApplications remaps previously unpooled auto-import when fallback pool becomes visible", () => {
  const existing = {
    id: "TPC-EXISTING",
    name: "Ava Cruz",
    source: "Application",
    sourceApplicationId: "APP-100",
    poolIds: [],
    status: "New",
    statusHistory: [],
  };

  const result = reconcilePooledApplications({
    applications: [pooledApplication],
    candidates: [existing],
    jobs,
    pools: [{ id: "POOL-HR", department: "HR" }],
    fallbackVisiblePoolIds: ["POOL-HR"],
    actor: "Recruiter One",
    now: "2026-05-15T04:00:00.000Z",
    createTalentId: () => "TPC-NEW-9",
  });

  assert.equal(result.addedCandidates.length, 0);
  assert.equal(result.remappedCount, 1);
  assert.deepEqual(result.nextCandidates[0].poolIds, ["POOL-HR"]);
  assert.match(
    result.nextCandidates[0].statusHistory.at(-1).note,
    /Pool assignment inferred during reconciliation\./
  );
});
