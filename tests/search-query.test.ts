import assert from "node:assert/strict";
import { test } from "node:test";

import { parseJobSearch } from "../lib/search-query.ts";

test("ordinary searches survive intact", () => {
  assert.equal(parseJobSearch("React Developer"), "react developer");
  assert.equal(parseJobSearch("  Product Manager  "), "product manager");
  assert.equal(parseJobSearch("don't panic"), "don't panic");
  assert.equal(parseJobSearch("C++ / C#"), "c++ / c#");
});

test("missing input yields an empty string so the filter is skipped", () => {
  assert.equal(parseJobSearch(null), "");
  assert.equal(parseJobSearch(undefined), "");
  assert.equal(parseJobSearch("   "), "");
});

test("PostgREST or= structural characters cannot survive", () => {
  const structural = /[,()"\\]/;

  const attacks = [
    "dev,or=(user_id.not.is.null)",
    "dev)or(user_id.not.is.null)",
    "dev\"",
    "dev\\",
    "x),title.eq.admin",
    "a%,company.not.is.x",
    ")))",
    ",,,,",
  ];

  for (const attack of attacks) {
    const parsed = parseJobSearch(attack);
    assert.ok(
      !structural.test(parsed),
      `${attack} -> ${parsed} still carries a structural character`,
    );
  }
});

test("ilike wildcards cannot survive", () => {
  assert.equal(parseJobSearch("%"), "");
  assert.equal(parseJobSearch("*"), "");
  assert.equal(parseJobSearch("dev%"), "dev");
  assert.equal(parseJobSearch("*dev*"), "dev");
  assert.equal(parseJobSearch("%%dev%%"), "dev");
});

test("injected predicates survive only as inert text", () => {
  // The dangerous characters are gone, so what remains sits inside a single
  // quoted ilike value and cannot restructure the filter.
  assert.equal(parseJobSearch("a%,company.not.is.x"), "a company.not.is.x");
  assert.equal(parseJobSearch("dev,or=(user_id.not.is.null)"), "dev or= user_id.not.is.null");
});

test("whitespace is collapsed so the ilike pattern stays matchable", () => {
  assert.equal(parseJobSearch("a   b"), "a b");
  assert.equal(parseJobSearch("  spaced   out  "), "spaced out");
  assert.equal(parseJobSearch("tab\tseparated"), "tab separated");
});

test("commas become word separators rather than disappearing", () => {
  assert.equal(parseJobSearch("sales, marketing"), "sales marketing");
  assert.equal(parseJobSearch("a,,b"), "a b");
});

test("length is capped", () => {
  const parsed = parseJobSearch("A".repeat(500));

  assert.equal(parsed.length, 80);
});

test("a payload longer than the cap is still stripped before truncation", () => {
  // Truncation must not be able to slice a payload back into a valid one.
  const parsed = parseJobSearch(`${"A".repeat(79)},title.eq.admin`);

  assert.equal(parsed.includes(","), false);
  assert.equal(parsed.length, 80);
});