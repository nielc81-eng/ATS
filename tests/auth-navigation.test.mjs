import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scrollToTop } from "../src/lib/scroll.js";

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
