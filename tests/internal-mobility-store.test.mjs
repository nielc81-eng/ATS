import test from "node:test";
import assert from "node:assert/strict";
import {
  getInternalMobilityStorageKey,
  getOrCreateCandidateRecordByEmail,
  listRedeploymentQueue,
  readAdminMobilitySnapshot,
  readInternalMobilityRecords,
  resetInternalMobilityRecords,
  resetInternalMobilityRecordsToScenario,
  runBatchMobilityMatch,
  runSingleMobilityMatch,
  submitRedeploymentRequest,
  updateRedeploymentStatus,
  writeInternalMobilityRecords,
} from "../src/lib/internalMobilityStore.js";

function withMockWindow(run) {
  const previousWindow = globalThis.window;
  const store = new Map();
  const localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };

  globalThis.window = { localStorage };
  try {
    run({ store });
  } finally {
    globalThis.window = previousWindow;
  }
}

test("readInternalMobilityRecords falls back to seed records when storage is empty", () => {
  withMockWindow(({ store }) => {
    const records = readInternalMobilityRecords();
    assert.equal(records.length > 0, true);
    assert.equal(Array.isArray(records[0].history), true);
    assert.equal(typeof records[0].redeploymentStatus, "string");
    assert.equal(store.has(getInternalMobilityStorageKey()), true);
  });
});

test("getOrCreateCandidateRecordByEmail creates record and reset restores scenario", () => {
  withMockWindow(() => {
    resetInternalMobilityRecords();
    writeInternalMobilityRecords([]);

    const created = getOrCreateCandidateRecordByEmail(
      "candidate+new@demo.com",
      "Candidate New",
      "Candidate"
    );
    assert.equal(Boolean(created.record), true);
    assert.equal(created.record.ownerEmail, "candidate+new@demo.com");
    assert.equal(created.created || created.migrated, true);

    const seeded = resetInternalMobilityRecordsToScenario();
    assert.equal(Array.isArray(seeded), true);
    assert.equal(seeded.length > 0, true);
    assert.equal(
      seeded.some((row) => String(row.ownerEmail || "").toLowerCase() === "candidate@demo.com"),
      true
    );
  });
});

test("submitRedeploymentRequest persists request metadata and status", () => {
  withMockWindow(() => {
    writeInternalMobilityRecords([
      {
        id: "IM-100",
        applicantName: "Demo Candidate",
        skills: ["React.js"],
        currentContractStatus: "Finished",
        redeploymentStatus: "NotRequested",
      },
    ]);

    const result = submitRedeploymentRequest(
      "IM-100",
      {
        desiredRole: "Frontend Engineer",
        availabilityDate: "2026-06-01",
        locationPreference: "Remote",
        applicantNote: "Ready for redeployment.",
      },
      "Demo Candidate"
    );
    assert.equal(result.ok, true);
    assert.equal(result.record.redeploymentStatus, "RequestSubmitted");
    assert.equal(Boolean(result.record.requestMeta.requestedAt), true);
    assert.equal(result.record.history.at(-1).changeType, "candidate_redeployment_requested");
  });
});

test("submitRedeploymentRequest blocks non-finished contract and missing required fields", () => {
  withMockWindow(() => {
    writeInternalMobilityRecords([
      {
        id: "IM-200",
        applicantName: "Candidate Guard",
        skills: ["Node.js"],
        currentContractStatus: "Deployed",
        redeploymentStatus: "NotRequested",
      },
    ]);
    const notFinished = submitRedeploymentRequest(
      "IM-200",
      {
        desiredRole: "Backend Engineer",
        availabilityDate: "2026-06-05",
        locationPreference: "Remote",
        applicantNote: "Ready",
      },
      "Candidate Guard"
    );
    assert.equal(notFinished.ok, false);
    assert.match(notFinished.message, /Finished/i);

    writeInternalMobilityRecords([
      {
        id: "IM-201",
        applicantName: "Candidate Missing",
        skills: [],
        currentContractStatus: "Finished",
        redeploymentStatus: "NotRequested",
      },
    ]);
    const missingFields = submitRedeploymentRequest("IM-201", {}, "Candidate Missing");
    assert.equal(missingFields.ok, false);
    assert.equal(Array.isArray(missingFields.missingFields), true);
  });
});

test("updateRedeploymentStatus enforces transition guard and persists valid transitions", () => {
  withMockWindow(() => {
    writeInternalMobilityRecords([
      {
        id: "IM-300",
        applicantName: "Candidate A",
        skills: ["React.js"],
        currentContractStatus: "Finished",
        redeploymentStatus: "RequestSubmitted",
      },
    ]);

    const invalid = updateRedeploymentStatus("IM-300", "Assigned", "Recruiter", "invalid");
    assert.equal(invalid.ok, false);

    const valid = updateRedeploymentStatus("IM-300", "UnderReview", "Recruiter", "screened");
    assert.equal(valid.ok, true);
    assert.equal(valid.record.redeploymentStatus, "UnderReview");
  });
});

test("single and batch match persist results and return skip summary", () => {
  withMockWindow(() => {
    writeInternalMobilityRecords([
      {
        id: "IM-401",
        applicantName: "A",
        skills: ["React.js", "TypeScript"],
        currentContractStatus: "Finished",
        redeploymentStatus: "UnderReview",
        requestMeta: {
          desiredRole: "Frontend Engineer",
          availabilityDate: "2099-01-01",
          locationPreference: "Remote",
          applicantNote: "Ready",
        },
      },
      {
        id: "IM-403",
        applicantName: "C",
        skills: ["JavaScript"],
        currentContractStatus: "Finished",
        redeploymentStatus: "UnderReview",
        requestMeta: {
          desiredRole: "UI Engineer",
          availabilityDate: "2099-01-03",
          locationPreference: "Hybrid",
          applicantNote: "Open to client transfer",
        },
      },
      {
        id: "IM-402",
        applicantName: "B",
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
    ]);

    const single = runSingleMobilityMatch("IM-401", "Recruiter");
    assert.equal(single.ok, true);
    assert.equal(typeof single.record.matchMeta.matchScore, "number");

    const batch = runBatchMobilityMatch(["IM-401", "IM-402", "IM-403"], "Recruiter");
    assert.equal(batch.ok, true);
    assert.equal(batch.matched.length >= 1, true);
    assert.equal(batch.skipped.length >= 1, true);
  });
});

test("listRedeploymentQueue reads filtered records and readAdminMobilitySnapshot aggregates metrics", () => {
  withMockWindow(() => {
    writeInternalMobilityRecords([
      {
        id: "IM-501",
        applicantName: "A",
        skills: ["React.js"],
        currentContractStatus: "Finished",
        redeploymentStatus: "UnderReview",
        requestMeta: {
          requestedAt: "2026-05-02T00:00:00.000Z",
          desiredRole: "Frontend Engineer",
          availabilityDate: "2099-01-01",
          locationPreference: "Remote",
          applicantNote: "Ready",
        },
        internalRating: { overall: 4.8 },
      },
      {
        id: "IM-502",
        applicantName: "B",
        skills: ["Node.js"],
        currentContractStatus: "Deployed",
        redeploymentStatus: "NotRequested",
        requestMeta: {
          requestedAt: "2026-05-01T00:00:00.000Z",
        },
        internalRating: { overall: 2.2 },
      },
    ]);

    const queue = listRedeploymentQueue({
      roleQuery: "frontend",
      statusFilter: "UnderReview",
      ratingBand: "High",
      availabilityWindow: "Any",
      skillQuery: "react",
    });
    assert.deepEqual(queue.map((row) => row.id), ["IM-501"]);

    const snapshot = readAdminMobilitySnapshot();
    assert.equal(snapshot.totalRecords, 2);
    assert.equal(snapshot.finishedCount, 1);
    assert.equal(snapshot.ratingBands.high, 1);
    assert.equal(snapshot.redeploymentStatusCounts.UnderReview, 1);

    const key = getInternalMobilityStorageKey();
    assert.equal(typeof window.localStorage.getItem(key), "string");
    resetInternalMobilityRecords();
    assert.equal(readInternalMobilityRecords().length > 0, true);
  });
});
