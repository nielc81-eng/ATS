import test from "node:test";
import assert from "node:assert/strict";
import {
  candidate201ReviewUpdatesKey,
  getCandidateDocumentStatusSummary,
} from "../src/lib/documentSchemas.js";

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

test("getCandidateDocumentStatusSummary reports all docs approved", () => {
  withMockWindow(({ store }) => {
    const now = new Date().toISOString();
    const personKey = "email:candidate@demo.com";
    const updates = [
      "Government ID",
      "Tax Form 2316",
      "Employment Contract",
      "Emergency Contact Sheet",
    ].map((docType) => ({
      reviewId: `${docType}-1`,
      candidateId: "candidate",
      candidateEmail: "candidate@demo.com",
      personKey,
      docType,
      status: "Approved",
      reviewedAt: now,
    }));

    store.set(candidate201ReviewUpdatesKey, JSON.stringify(updates));
    const summary = getCandidateDocumentStatusSummary({
      candidateEmail: "candidate@demo.com",
      personKey,
    });

    assert.equal(summary.requiredCount, 4);
    assert.equal(summary.approvedCount, 4);
    assert.equal(summary.allRequiredApproved, true);
  });
});

test("getCandidateDocumentStatusSummary fails when a required doc is not approved", () => {
  withMockWindow(({ store }) => {
    const now = new Date().toISOString();
    const updates = [
      {
        reviewId: "one",
        candidateId: "candidate",
        candidateEmail: "candidate@demo.com",
        personKey: "email:candidate@demo.com",
        docType: "Government ID",
        status: "Approved",
        reviewedAt: now,
      },
      {
        reviewId: "two",
        candidateId: "candidate",
        candidateEmail: "candidate@demo.com",
        personKey: "email:candidate@demo.com",
        docType: "Tax Form 2316",
        status: "Needs Action",
        reviewedAt: now,
      },
    ];
    store.set(candidate201ReviewUpdatesKey, JSON.stringify(updates));
    const summary = getCandidateDocumentStatusSummary({
      candidateEmail: "candidate@demo.com",
      personKey: "email:candidate@demo.com",
    });
    assert.equal(summary.allRequiredApproved, false);
    assert.equal(summary.approvedCount, 1);
    assert.equal(summary.allRequiredProvided, false);
  });
});

test("getCandidateDocumentStatusSummary treats submitted docs as provided", () => {
  withMockWindow(({ store }) => {
    const now = new Date().toISOString();
    const personKey = "email:jeremy@gmail.com";
    const updates = [
      "Government ID",
      "Tax Form 2316",
      "Employment Contract",
      "Emergency Contact Sheet",
    ].map((docType) => ({
      reviewId: `${docType}-submitted`,
      candidateId: "candidate",
      candidateEmail: "jeremy@gmail.com",
      personKey,
      docType,
      status: "Submitted",
      reviewedAt: now,
    }));

    store.set(candidate201ReviewUpdatesKey, JSON.stringify(updates));
    const summary = getCandidateDocumentStatusSummary({
      candidateEmail: "jeremy@gmail.com",
      personKey,
    });

    assert.equal(summary.allRequiredApproved, false);
    assert.equal(summary.allRequiredProvided, true);
    assert.equal(summary.providedCount, 4);
  });
});
