import test from "node:test";
import assert from "node:assert/strict";
import {
  approveDeploymentRequest,
  ensureAdminWorkforceSeedData,
  getTalentWorkforceSnapshot,
} from "../src/lib/adminWorkforceMockData.js";

function createMockLocalStorage() {
  const store = new Map();

  return {
    store,
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => {
        store.set(key, String(value));
      },
      removeItem: (key) => {
        store.delete(key);
      },
    },
  };
}

test("ensureAdminWorkforceSeedData is idempotent", () => {
  const previousWindow = globalThis.window;
  const { localStorage } = createMockLocalStorage();

  globalThis.window = { localStorage };

  try {
    ensureAdminWorkforceSeedData("Seeder");
    const first = getTalentWorkforceSnapshot();
    const firstCounts = {
      pool: first.pool.length,
      requests: first.requests.length,
      assignments: first.assignments.length,
    };

    ensureAdminWorkforceSeedData("Seeder");
    const second = getTalentWorkforceSnapshot();

    assert.equal(second.pool.length, firstCounts.pool);
    assert.equal(second.requests.length, firstCounts.requests);
    assert.equal(second.assignments.length, firstCounts.assignments);
  } finally {
    globalThis.window = previousWindow;
  }
});

test("approving a seeded Pending Approval request assigns and creates an active assignment", () => {
  const previousWindow = globalThis.window;
  const { localStorage } = createMockLocalStorage();

  globalThis.window = { localStorage };

  try {
    ensureAdminWorkforceSeedData("Seeder");

    const seeded = getTalentWorkforceSnapshot();
    assert.ok(seeded.pendingRequests.length > 0, "expected at least one pending request from seed data");

    const pending = seeded.pendingRequests[0];
    const approve = approveDeploymentRequest(
      pending.id,
      { materializeImmediately: true, approvalNotes: "Test approval" },
      "Approver"
    );

    assert.equal(approve.ok, true);

    const snapshot = getTalentWorkforceSnapshot();
    const updatedRequest = snapshot.requests.find((request) => request.id === pending.id);
    assert.ok(updatedRequest);
    assert.equal(updatedRequest.status, "Assigned");
    assert.ok(updatedRequest.assignmentId);

    const assignment = snapshot.assignments.find((item) => item.id === updatedRequest.assignmentId);
    assert.ok(assignment);
    assert.equal(assignment.status, "Active");
  } finally {
    globalThis.window = previousWindow;
  }
});

