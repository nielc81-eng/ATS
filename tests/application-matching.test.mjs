import test from "node:test";
import assert from "node:assert/strict";
import { APPLICATION_STATUS } from "../src/lib/applicationStatuses.js";
import {
  getInitialApplicationStatus,
  getOverlapSkills,
} from "../src/lib/applicationMatching.js";

test("getOverlapSkills treats React and React.js as the same skill key", () => {
  const overlap = getOverlapSkills(
    ["React", "TypeScript", "CSS"],
    ["React.js", "REST APIs"]
  );
  assert.deepEqual(overlap, ["React"]);
});

test("getInitialApplicationStatus returns interview when at least one must-have overlaps", () => {
  const result = getInitialApplicationStatus(
    ["TypeScript", "Node.js"],
    ["React.js", "TypeScript", "REST APIs"]
  );
  assert.equal(result.matchedToRequirements, true);
  assert.equal(result.initialStatus, APPLICATION_STATUS.InterviewInitial);
});

test("getInitialApplicationStatus returns pooled when no overlap exists", () => {
  const result = getInitialApplicationStatus(
    ["Figma", "Canva"],
    ["React.js", "TypeScript"]
  );
  assert.equal(result.matchedToRequirements, false);
  assert.equal(result.initialStatus, APPLICATION_STATUS.PooledForFutureOpportunities);
});
