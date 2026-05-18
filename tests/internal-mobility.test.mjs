import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionRedeployment,
  deriveAdminMobilitySnapshot,
  getOrCreateCandidateRecordByEmail,
  getFinishedApplicants,
  listRedeploymentQueue,
  normalizeInternalRating,
  runBatchMobilityMatch,
  runSingleMobilityMatch,
  submitRedeploymentRequest,
  updateRedeploymentStatus,
  upsertCandidateMobilityProfile,
} from "../src/lib/internalMobility.js";
import { paginate } from "../src/lib/pagination.js";

test("normalizeInternalRating clamps overall + dimensions to 1-5 and forces scale=5", () => {
  const normalized = normalizeInternalRating({
    overall: 12,
    scale: 999,
    dimensions: { performance: -2, communication: 4.25 },
    notes: [" ok ", "", null],
  });
  assert.equal(normalized.scale, 5);
  assert.equal(normalized.overall, 5);
  assert.deepEqual(normalized.dimensions, { performance: 1, communication: 4.25 });
  assert.deepEqual(normalized.notes, ["ok"]);
});

test("getFinishedApplicants derives from currentContractStatus and sorts by rating then name", () => {
  const finished = getFinishedApplicants([
    {
      id: "A",
      applicantName: "Zulu",
      currentContractStatus: "Finished",
      internalRating: { overall: 4.2, scale: 5, dimensions: {}, notes: [] },
    },
    {
      id: "B",
      applicantName: "Alpha",
      currentContractStatus: "Finished",
      internalRating: { overall: 4.2, scale: 5, dimensions: {}, notes: [] },
    },
    {
      id: "C",
      applicantName: "Beta",
      currentContractStatus: "Deployed",
      internalRating: { overall: 4.7, scale: 5, dimensions: {}, notes: [] },
    },
  ]);

  assert.deepEqual(
    finished.map((row) => row.id),
    ["B", "A"]
  );
});

test("candidate upsert keeps rating immutable while updating skills/readiness", () => {
  const result = upsertCandidateMobilityProfile(
    [
      {
        id: "IM-1",
        applicantName: "Demo Candidate",
        skills: ["React.js"],
        internalRating: { overall: 4.2, scale: 5, dimensions: {}, notes: [] },
      },
    ],
    {
      id: "IM-1",
      applicantName: "Demo Candidate",
      skills: ["React.js", "TypeScript"],
      readinessNote: "Ready now.",
    },
    "Demo Candidate"
  );

  assert.equal(result.record.internalRating.overall, 4.2);
  assert.deepEqual(result.record.skills, ["React.js", "TypeScript"]);
  assert.equal(result.record.readinessNote, "Ready now.");
  assert.equal(result.record.history.at(-1).changeType, "candidate_profile_updated");
});

test("candidate ownership resolves by ownerEmail and migrates legacy name-only row", () => {
  const direct = getOrCreateCandidateRecordByEmail(
    [
      {
        id: "IM-O1",
        ownerEmail: "candidate@demo.com",
        applicantName: "Demo Candidate",
      },
    ],
    "candidate@demo.com",
    "Demo Candidate",
    "Candidate"
  );
  assert.equal(direct.created, false);
  assert.equal(direct.migrated, false);
  assert.equal(direct.record.id, "IM-O1");

  const migrated = getOrCreateCandidateRecordByEmail(
    [
      {
        id: "IM-O2",
        applicantName: "Demo Candidate",
      },
    ],
    "candidate@demo.com",
    "Demo Candidate",
    "Candidate"
  );
  assert.equal(migrated.created, false);
  assert.equal(migrated.migrated, true);
  assert.equal(migrated.record.ownerEmail, "candidate@demo.com");
  assert.equal(migrated.record.history.at(-1).changeType, "candidate_owner_linked");
});

test("candidate ownership deduplicates duplicate ownerEmail rows and keeps finished latest record", () => {
  const deduped = getOrCreateCandidateRecordByEmail(
    [
      {
        id: "IM-D1",
        ownerEmail: "candidate@demo.com",
        applicantName: "Demo Candidate",
        currentContractStatus: "Deployed",
        history: [{ updatedAt: "2026-05-18T11:00:00.000Z" }],
      },
      {
        id: "IM-D2",
        ownerEmail: "candidate@demo.com",
        applicantName: "Nath",
        currentContractStatus: "Finished",
        history: [{ updatedAt: "2026-05-18T11:49:00.000Z" }],
      },
    ],
    "candidate@demo.com",
    "Demo Candidate",
    "Candidate"
  );
  assert.equal(deduped.migrated, true);
  assert.equal(deduped.records.length, 1);
  assert.equal(deduped.record.id, "IM-D2");
  assert.equal(deduped.record.currentContractStatus, "Finished");
  assert.equal(deduped.record.history.at(-1).changeType, "candidate_record_deduplicated");
});

test("submitRedeploymentRequest enforces finished-contract eligibility and required fields", () => {
  const pending = submitRedeploymentRequest(
    [
      {
        id: "IM-2",
        applicantName: "Candidate A",
        currentContractStatus: "Deployed",
        redeploymentStatus: "NotRequested",
        skills: ["React.js"],
      },
    ],
    "IM-2",
    {
      desiredRole: "Frontend Engineer",
      availabilityDate: "2026-06-01",
      locationPreference: "Remote",
      applicantNote: "Completed contract.",
    },
    "Candidate A"
  );
  assert.equal(pending.ok, false);
  assert.match(pending.message, /Finished/i);

  const ok = submitRedeploymentRequest(
    [
      {
        id: "IM-3",
        applicantName: "Candidate B",
        currentContractStatus: "Finished",
        redeploymentStatus: "NotRequested",
        skills: ["React.js"],
      },
    ],
    "IM-3",
    {
      desiredRole: "Frontend Engineer",
      availabilityDate: "2026-06-01",
      locationPreference: "Remote",
      applicantNote: "Completed contract.",
    },
    "Candidate B"
  );
  assert.equal(ok.ok, true);
  assert.equal(ok.record.redeploymentStatus, "RequestSubmitted");
  assert.equal(ok.record.history.at(-1).changeType, "candidate_redeployment_requested");
});

test("status transition guard only permits configured redeployment transitions", () => {
  assert.equal(canTransitionRedeployment("NotRequested", "RequestSubmitted"), true);
  assert.equal(canTransitionRedeployment("NotRequested", "Matched"), false);

  const result = updateRedeploymentStatus(
    [{ id: "IM-4", redeploymentStatus: "NotRequested", applicantName: "A" }],
    "IM-4",
    "Matched",
    "Recruiter",
    "invalid jump"
  );
  assert.equal(result.ok, false);
  assert.match(result.message, /not allowed/i);
});

test("single and batch match persist match metadata and handle skips", () => {
  const single = runSingleMobilityMatch(
    [
      {
        id: "IM-5",
        applicantName: "Single",
        skills: ["React.js", "TypeScript"],
        currentContractStatus: "Finished",
        redeploymentStatus: "UnderReview",
        requestMeta: {
          desiredRole: "Frontend Engineer",
          availabilityDate: "2026-06-02",
          locationPreference: "Remote",
          applicantNote: "Ready now.",
        },
      },
    ],
    "IM-5",
    "Recruiter"
  );
  assert.equal(single.ok, true);
  assert.equal(typeof single.record.matchMeta.matchScore, "number");
  assert.equal(single.record.redeploymentStatus, "Matched");

  const batch = runBatchMobilityMatch(
    [
      {
        id: "IM-6",
        applicantName: "Batch A",
        skills: ["React.js"],
        currentContractStatus: "Finished",
        redeploymentStatus: "RequestSubmitted",
        requestMeta: {
          desiredRole: "Frontend Engineer",
          availabilityDate: "2026-06-04",
          locationPreference: "Remote",
          applicantNote: "Ready now.",
        },
      },
      {
        id: "IM-7",
        applicantName: "Batch B",
        skills: [],
        currentContractStatus: "Finished",
        redeploymentStatus: "RequestSubmitted",
        requestMeta: {
          desiredRole: "",
          availabilityDate: "",
          locationPreference: "",
          applicantNote: "",
        },
      },
      {
        id: "IM-8",
        applicantName: "Batch C",
        skills: ["Node.js"],
        currentContractStatus: "Finished",
        redeploymentStatus: "Declined",
      },
    ],
    ["IM-6", "IM-7", "IM-8"],
    "Recruiter"
  );
  assert.equal(batch.ok, true);
  assert.equal(batch.matched.length, 1);
  assert.equal(batch.skipped.length, 2);
  assert.equal(batch.matched[0].matchMeta.batchRunId.startsWith("BATCH-"), true);
});

test("listRedeploymentQueue composes filters and returns requestedAt desc", () => {
  const queue = listRedeploymentQueue(
    [
      {
        id: "IM-9",
        applicantName: "A",
        skills: ["React.js"],
        redeploymentStatus: "UnderReview",
        requestMeta: {
          requestedAt: "2026-05-01T00:00:00.000Z",
          desiredRole: "Frontend Engineer",
          availabilityDate: "2099-01-10",
          locationPreference: "Remote",
          applicantNote: "Ready",
        },
        internalRating: { overall: 4.6 },
      },
      {
        id: "IM-10",
        applicantName: "B",
        skills: ["Node.js"],
        redeploymentStatus: "RequestSubmitted",
        requestMeta: {
          requestedAt: "2026-05-02T00:00:00.000Z",
          desiredRole: "Backend Engineer",
          availabilityDate: "2099-01-08",
          locationPreference: "Hybrid",
          applicantNote: "Ready",
        },
        internalRating: { overall: 3.2 },
      },
    ],
    {
      statusFilter: "Any",
      roleQuery: "engineer",
      ratingBand: "Any",
      availabilityWindow: "Any",
      skillQuery: "",
    }
  );

  assert.deepEqual(
    queue.map((row) => row.id),
    ["IM-10", "IM-9"]
  );
});

test("listRedeploymentQueue composes cleanly with pagination windows", () => {
  const rows = listRedeploymentQueue(
    [
      {
        id: "IM-P1",
        applicantName: "A",
        redeploymentStatus: "RequestSubmitted",
        requestMeta: { requestedAt: "2026-05-03T00:00:00.000Z" },
      },
      {
        id: "IM-P2",
        applicantName: "B",
        redeploymentStatus: "RequestSubmitted",
        requestMeta: { requestedAt: "2026-05-02T00:00:00.000Z" },
      },
      {
        id: "IM-P3",
        applicantName: "C",
        redeploymentStatus: "RequestSubmitted",
        requestMeta: { requestedAt: "2026-05-01T00:00:00.000Z" },
      },
    ],
    { statusFilter: "RequestSubmitted", roleQuery: "", ratingBand: "Any", availabilityWindow: "Any", skillQuery: "" }
  );

  const firstPage = paginate(rows, { page: 1, pageSize: 2 });
  const secondPage = paginate(rows, { page: 2, pageSize: 2 });
  assert.deepEqual(firstPage.pageItems.map((item) => item.id), ["IM-P1", "IM-P2"]);
  assert.deepEqual(secondPage.pageItems.map((item) => item.id), ["IM-P3"]);
});

test("deriveAdminMobilitySnapshot returns counts, bands, and audit timeline", () => {
  const snapshot = deriveAdminMobilitySnapshot([
    {
      id: "IM-1",
      applicantName: "A",
      currentContractStatus: "Finished",
      redeploymentStatus: "Matched",
      internalRating: { overall: 4.7 },
      history: [
        {
          updatedAt: "2026-05-01T10:00:00.000Z",
          updatedByRole: "Recruiter",
          changeType: "ai_match_run",
          summary: "Ran AI",
        },
      ],
    },
    {
      id: "IM-2",
      applicantName: "B",
      currentContractStatus: "Deployed",
      redeploymentStatus: "NotRequested",
      internalRating: { overall: 2.4 },
      history: [],
    },
  ]);

  assert.equal(snapshot.totalRecords, 2);
  assert.equal(snapshot.finishedCount, 1);
  assert.equal(snapshot.ratingBands.high, 1);
  assert.equal(snapshot.ratingBands.low, 1);
  assert.equal(snapshot.redeploymentStatusCounts.Matched, 1);
  assert.equal(snapshot.recentChanges.length >= 1, true);
});
