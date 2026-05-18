import test from "node:test";
import assert from "node:assert/strict";
import {
  getSavedJobsKey,
  mergeGuestSavedIntoUser,
  normalizeSavedJobIds,
  readSavedJobIds,
  writeSavedJobIds,
} from "../src/lib/savedJobsStorage.js";

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

test("normalizeSavedJobIds trims, dedupes, and caps results", () => {
  const input = ["  JOB-1  ", "JOB-1", "", "JOB-2", null, "JOB-3"];
  assert.deepEqual(normalizeSavedJobIds(input), ["JOB-1", "JOB-2", "JOB-3"]);

  const many = Array.from({ length: 250 }, (_, index) => `JOB-${index + 1}`);
  assert.equal(normalizeSavedJobIds(many).length, 200);
});

test("readSavedJobIds returns [] when storage is missing or invalid", () => {
  const previousWindow = globalThis.window;
  const { localStorage } = createMockLocalStorage();
  globalThis.window = { localStorage };

  try {
    assert.deepEqual(readSavedJobIds("guest"), []);

    localStorage.setItem(getSavedJobsKey("guest"), "{invalid-json");
    assert.deepEqual(readSavedJobIds("guest"), []);
  } finally {
    globalThis.window = previousWindow;
  }
});

test("writeSavedJobIds stores normalized values and removes empty sets", () => {
  const previousWindow = globalThis.window;
  const { localStorage, store } = createMockLocalStorage();
  globalThis.window = { localStorage };

  try {
    writeSavedJobIds("guest", ["JOB-1", "JOB-1", " ", 123]);
    assert.deepEqual(JSON.parse(store.get(getSavedJobsKey("guest"))), ["JOB-1", "123"]);

    writeSavedJobIds("guest", []);
    assert.equal(store.has(getSavedJobsKey("guest")), false);
  } finally {
    globalThis.window = previousWindow;
  }
});

test("mergeGuestSavedIntoUser unions saved jobs and clears guest list", () => {
  const previousWindow = globalThis.window;
  const { localStorage, store } = createMockLocalStorage();
  globalThis.window = { localStorage };

  try {
    writeSavedJobIds("guest", ["JOB-1", "JOB-2"]);
    writeSavedJobIds("candidate@example.com", ["JOB-2", "JOB-3"]);

    const merged = mergeGuestSavedIntoUser("guest", "candidate@example.com");
    assert.deepEqual(merged, ["JOB-1", "JOB-2", "JOB-3"]);

    assert.equal(store.has(getSavedJobsKey("guest")), false);
    assert.deepEqual(JSON.parse(store.get(getSavedJobsKey("candidate@example.com"))), merged);
  } finally {
    globalThis.window = previousWindow;
  }
});

