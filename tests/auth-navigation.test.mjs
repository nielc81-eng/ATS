import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scrollToTop } from "../src/lib/scroll.js";
import { getPathRole, getRoleHomePath } from "../src/lib/routeHelpers.js";
import {
  AUTH_ATTEMPTS_STORAGE_KEY,
  clearLoginPolicyState,
  getLoginPolicyState,
  LOCK_DURATION_MINUTES,
  MAX_LOGIN_ATTEMPTS,
  recordFailedLoginAttempt,
} from "../src/lib/authPolicy.js";
import { navigationByRole } from "../src/config/navigation.js";

function readSource(relativePath) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

function expectLandingBackLink(source) {
  assert.match(source, /<Link\s+to="\/"[\s\S]*?>[\s\S]*?<span>Back<\/span>[\s\S]*?<\/Link>/);
  assert.doesNotMatch(source, /navigate\(-1\)|history\.back|window\.history\.back/);
}

test("login back navigates to landing", () => {
  expectLandingBackLink(readSource("src/pages/auth/Login.jsx"));
});

test("register back navigates to landing", () => {
  expectLandingBackLink(readSource("src/pages/auth/Register.jsx"));
});

test("scroll reset sends the page to the top", () => {
  const previousWindow = globalThis.window;
  let args = null;

  globalThis.window = {
    scrollTo: (...nextArgs) => {
      args = nextArgs;
    },
  };

  try {
    scrollToTop();
    assert.deepEqual(args, [0, 0]);
  } finally {
    globalThis.window = previousWindow;
  }
});

test("role home mapping includes all four roles", () => {
  assert.equal(getRoleHomePath("Candidate"), "/candidate/dashboard");
  assert.equal(getRoleHomePath("Recruiter"), "/recruiter/dashboard");
  assert.equal(getRoleHomePath("DeploymentManager"), "/deployment-manager/dashboard");
  assert.equal(getRoleHomePath("Administrator"), "/admin/dashboard");
});

test("path role resolution supports deployment manager routes", () => {
  assert.equal(getPathRole("/deployment-manager/dashboard"), "DeploymentManager");
  assert.equal(getPathRole("/recruiter/screening"), "Recruiter");
  assert.equal(getPathRole("/admin/users"), "Administrator");
  assert.equal(getPathRole("/candidate/dashboard"), "Candidate");
});

test("public copy no longer references blind screening or bias mitigation", () => {
  const landing = readSource("src/pages/public/Landing.jsx");
  const login = readSource("src/pages/auth/Login.jsx");
  const register = readSource("src/pages/auth/Register.jsx");
  const screening = readSource("src/pages/recruiter/Screening.jsx");

  assert.doesNotMatch(landing, /Bias mitigation|blind review|Blind screening|PII masked/i);
  assert.doesNotMatch(login, /blind screening|bias mitigation/i);
  assert.doesNotMatch(register, /blind screening|bias mitigation/i);
  assert.doesNotMatch(screening, /Blind screening|PII masked|Anonymous profiles|bias mitigation/i);
});

test("navigation conformance: TA, deployment manager, and admin menus match the flow definitions", () => {
  const recruiterLinks = (navigationByRole.Recruiter || []).map((item) => item.to);
  assert.deepEqual(recruiterLinks, [
    "/recruiter/dashboard",
    "/recruiter/jobs",
    "/recruiter/applicant-categories",
    "/recruiter/files",
    "/recruiter/screening",
    "/recruiter/analytics",
    "/recruiter/talent-pool",
    "/recruiter/compliance-gate",
  ]);
  assert.equal(recruiterLinks.includes("/recruiter/deployment"), false);

  const deploymentLinks = (navigationByRole.DeploymentManager || []).map((item) => item.to);
  assert.deepEqual(deploymentLinks, [
    "/deployment-manager/dashboard",
    "/deployment-manager/deployments",
    "/deployment-manager/vault",
    "/deployment-manager/alerts",
  ]);

  const adminLinks = (navigationByRole.Administrator || []).map((item) => item.to);
  assert.deepEqual(adminLinks, [
    "/admin/dashboard",
    "/admin/staff-accounts",
    "/admin/work-privileges",
    "/admin/policies",
    "/admin/usage-history",
    "/admin/system-cleanup",
  ]);
  assert.equal(adminLinks.includes("/admin/talent-pool"), false);
  assert.equal(adminLinks.includes("/admin/deployment-board"), false);
});

test("auth policy increments failures and locks at max attempts", () => {
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
    const email = "locked.user@demo.com";
    clearLoginPolicyState(email);

    let state = getLoginPolicyState(email, 1000);
    assert.equal(state.attempts, 0);
    assert.equal(state.remainingAttempts, MAX_LOGIN_ATTEMPTS);
    assert.equal(state.isLocked, false);

    for (let index = 1; index < MAX_LOGIN_ATTEMPTS; index += 1) {
      state = recordFailedLoginAttempt(email, 1000 + index);
      assert.equal(state.isLocked, false);
      assert.equal(state.remainingAttempts, MAX_LOGIN_ATTEMPTS - index);
    }

    state = recordFailedLoginAttempt(email, 3000);
    assert.equal(state.isLocked, true);
    assert.equal(state.remainingAttempts, 0);
    assert.equal(state.lockRemainingMs, LOCK_DURATION_MINUTES * 60 * 1000);

    const beforeExpiry = getLoginPolicyState(email, 3000 + 60_000);
    assert.equal(beforeExpiry.isLocked, true);

    const afterExpiry = getLoginPolicyState(
      email,
      3000 + LOCK_DURATION_MINUTES * 60 * 1000 + 1000
    );
    assert.equal(afterExpiry.isLocked, false);
    assert.equal(afterExpiry.remainingAttempts, MAX_LOGIN_ATTEMPTS);

    clearLoginPolicyState(email);
    const resetState = getLoginPolicyState(email, 9000);
    assert.equal(resetState.attempts, 0);
    assert.equal(resetState.remainingAttempts, MAX_LOGIN_ATTEMPTS);
  } finally {
    globalThis.window = previousWindow;
  }
});

test("auth policy stores attempts in localStorage map", () => {
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
    const email = "attempts.user@demo.com";
    recordFailedLoginAttempt(email, 10_000);
    const raw = store.get(AUTH_ATTEMPTS_STORAGE_KEY);
    assert.ok(raw);
    assert.match(raw, /attempts\.user@demo\.com/);
  } finally {
    globalThis.window = previousWindow;
  }
});
