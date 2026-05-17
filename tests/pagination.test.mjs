import test from "node:test";
import assert from "node:assert/strict";
import { clampInt, coercePositiveInt, paginate } from "../src/lib/pagination.js";

test("coercePositiveInt returns fallback for invalid inputs", () => {
  assert.equal(coercePositiveInt(undefined, 7), 7);
  assert.equal(coercePositiveInt(null, 7), 7);
  assert.equal(coercePositiveInt("", 7), 7);
  assert.equal(coercePositiveInt("nope", 7), 7);
  assert.equal(coercePositiveInt("0", 7), 7);
  assert.equal(coercePositiveInt("-3", 7), 7);
});

test("coercePositiveInt parses positive integers", () => {
  assert.equal(coercePositiveInt("1", 7), 1);
  assert.equal(coercePositiveInt(12, 7), 12);
  assert.equal(coercePositiveInt("12", 7), 12);
});

test("clampInt clamps into bounds", () => {
  assert.equal(clampInt(5, 1, 10), 5);
  assert.equal(clampInt(0, 1, 10), 1);
  assert.equal(clampInt(-100, 1, 10), 1);
  assert.equal(clampInt(999, 1, 10), 10);
});

test("paginate empty input returns page 1 and 1 total page", () => {
  const result = paginate([], { page: 1, pageSize: 10 });
  assert.equal(result.totalItems, 0);
  assert.equal(result.totalPages, 1);
  assert.equal(result.page, 1);
  assert.equal(result.pageItems.length, 0);
});

test("paginate clamps page to the available range", () => {
  const items = Array.from({ length: 25 }, (_, i) => `row-${i + 1}`);

  const lastPage = paginate(items, { page: 999, pageSize: 10 });
  assert.equal(lastPage.totalPages, 3);
  assert.equal(lastPage.page, 3);
  assert.deepEqual(lastPage.pageItems, ["row-21", "row-22", "row-23", "row-24", "row-25"]);

  const firstPage = paginate(items, { page: 0, pageSize: 10 });
  assert.equal(firstPage.page, 1);
  assert.deepEqual(firstPage.pageItems, items.slice(0, 10));
});

test("paginate slices correctly and returns indices", () => {
  const items = ["a", "b", "c", "d", "e", "f", "g"];
  const result = paginate(items, { page: 2, pageSize: 3 });

  assert.equal(result.totalItems, 7);
  assert.equal(result.totalPages, 3);
  assert.equal(result.page, 2);
  assert.equal(result.pageSize, 3);
  assert.equal(result.startIndex, 3);
  assert.equal(result.endIndex, 6);
  assert.deepEqual(result.pageItems, ["d", "e", "f"]);
});

