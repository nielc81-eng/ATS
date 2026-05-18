import test from "node:test";
import assert from "node:assert/strict";
import { APPLICATION_STATUS } from "../src/lib/applicationStatuses.js";
import {
  toCanonicalReportingStatus,
  validateApplicationTransition,
} from "../src/lib/applicationTransitionGuard.js";

test("validateApplicationTransition accepts valid recruiter transition", () => {
  const result = validateApplicationTransition({
    currentStatus: APPLICATION_STATUS.Submitted,
    nextStatus: APPLICATION_STATUS.Shortlisted,
    actorRole: "Recruiter",
  });
  assert.equal(result.ok, true);
});

test("validateApplicationTransition blocks invalid transition jumps", () => {
  const result = validateApplicationTransition({
    currentStatus: APPLICATION_STATUS.Submitted,
    nextStatus: APPLICATION_STATUS.HiredOnboarding,
    actorRole: "Recruiter",
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "INVALID_TRANSITION");
});

test("validateApplicationTransition requires note for rejection states", () => {
  const result = validateApplicationTransition({
    currentStatus: APPLICATION_STATUS.InterviewFinal,
    nextStatus: APPLICATION_STATUS.Rejected,
    actorRole: "Recruiter",
    note: "",
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "NOTE_REQUIRED");
});

test("validateApplicationTransition enforces docs for onboarding finalize", () => {
  const result = validateApplicationTransition({
    currentStatus: APPLICATION_STATUS.PostHireDocsSubmitted,
    nextStatus: APPLICATION_STATUS.HiredOnboarding,
    actorRole: "Recruiter",
    docsComplete: false,
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "DOCS_INCOMPLETE");
});

test("validateApplicationTransition blocks unsupported role updates", () => {
  const result = validateApplicationTransition({
    currentStatus: APPLICATION_STATUS.Submitted,
    nextStatus: APPLICATION_STATUS.Shortlisted,
    actorRole: "Candidate",
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "UNAUTHORIZED_ROLE");
});

test("validateApplicationTransition allows candidate withdrawal with note", () => {
  const result = validateApplicationTransition({
    currentStatus: APPLICATION_STATUS.Submitted,
    nextStatus: APPLICATION_STATUS.Rejected,
    actorRole: "Candidate",
    note: "Candidate withdraw request",
  });
  assert.equal(result.ok, true);
});

test("toCanonicalReportingStatus normalizes pipeline variants", () => {
  assert.equal(
    toCanonicalReportingStatus(APPLICATION_STATUS.InterviewInitial),
    "Interview"
  );
  assert.equal(
    toCanonicalReportingStatus(APPLICATION_STATUS.PostHireDocsSubmitted),
    "Offer"
  );
  assert.equal(
    toCanonicalReportingStatus(APPLICATION_STATUS.HiredOnboarding),
    "Hired"
  );
  assert.equal(
    toCanonicalReportingStatus(APPLICATION_STATUS.BackoutArchived),
    "Rejected"
  );
});
