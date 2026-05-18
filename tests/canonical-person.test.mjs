import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCanonicalPersonRef,
  createPersonKey,
} from "../src/lib/canonicalPerson.js";

test("createPersonKey is email-stable and normalized", () => {
  const first = createPersonKey({ email: "Candidate@Demo.Com" });
  const second = createPersonKey({ email: "candidate@demo.com" });
  assert.equal(first, "email:candidate@demo.com");
  assert.equal(first, second);
});

test("createPersonKey falls back deterministically without email", () => {
  const first = createPersonKey({ legacyId: "mock-123", fallbackName: "Demo Candidate" });
  const second = createPersonKey({ legacyId: "mock-123", fallbackName: "Demo Candidate" });
  assert.equal(first, second);
});

test("buildCanonicalPersonRef keeps normalized email and role", () => {
  const ref = buildCanonicalPersonRef({
    email: "Recruiter@Demo.Com",
    name: "Demo Recruiter",
    legacyId: "session-1",
    role: "Recruiter",
  });
  assert.equal(ref.email, "recruiter@demo.com");
  assert.equal(ref.role, "Recruiter");
  assert.equal(ref.personKey, "email:recruiter@demo.com");
  assert.deepEqual(ref.legacyIds, ["session-1"]);
});
