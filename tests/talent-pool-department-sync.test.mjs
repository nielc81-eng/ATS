import test from "node:test";
import assert from "node:assert/strict";
import { buildMissingDepartmentPools } from "../src/lib/talentPoolDepartmentSync.js";

test("buildMissingDepartmentPools creates pools for departments missing from current pools", () => {
  const jobs = [
    { id: "JOB-1", department: "Engineering" },
    { id: "JOB-2", department: "Machine Learning - Data Science/Analytics" },
  ];
  const pools = [{ id: "POOL-ENG", department: "Engineering" }];

  const missing = buildMissingDepartmentPools(jobs, pools, () => "POOL-AUTO-1");
  assert.equal(missing.length, 1);
  assert.equal(missing[0].department, "Machine Learning - Data Science/Analytics");
  assert.equal(missing[0].id, "POOL-MACHINE-LEARNING-DATA-SCIENCE-ANALYTICS");
});

test("buildMissingDepartmentPools treats department match as case-insensitive", () => {
  const jobs = [{ id: "JOB-1", department: "engineering" }];
  const pools = [{ id: "POOL-ENG", department: "Engineering" }];

  const missing = buildMissingDepartmentPools(jobs, pools, () => "POOL-AUTO-2");
  assert.equal(missing.length, 0);
});
