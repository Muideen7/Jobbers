import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  DEFAULT_JOBS_TAB,
  JOBS_TABS,
  jobsTabQueryString,
  normalizeJobsTab,
  normalizeResearched,
} from "../lib/workspace/jobs-tab.ts";

test("the tab vocabulary is the three views the revamp promises", () => {
  assert.deepEqual([...JOBS_TABS], ["for-you", "all", "saved"]);
  assert.equal(DEFAULT_JOBS_TAB, "for-you");
});

test("unknown, missing and repeated ?tab= values fall back to the default", () => {
  assert.equal(normalizeJobsTab(undefined), "for-you");
  assert.equal(normalizeJobsTab(""), "for-you");
  assert.equal(normalizeJobsTab("inventory"), "for-you");
  assert.equal(normalizeJobsTab("SAVED"), "for-you");
  assert.equal(normalizeJobsTab("saved"), "saved");
  assert.equal(normalizeJobsTab(["all", "saved"]), "all");
});

test("only the literal ?researched=1 turns the researched filter on", () => {
  assert.equal(normalizeResearched(undefined), false);
  assert.equal(normalizeResearched("0"), false);
  assert.equal(normalizeResearched("true"), false);
  assert.equal(normalizeResearched("1"), true);
  assert.equal(normalizeResearched(["1", "0"]), true);
});

test("the query string drops defaults so /jobs never carries a redundant param", () => {
  assert.equal(jobsTabQueryString("for-you", false), "");
  assert.equal(jobsTabQueryString("all", false), "tab=all");
  assert.equal(jobsTabQueryString("saved", false), "tab=saved");
  assert.equal(jobsTabQueryString("for-you", true), "researched=1");
  assert.equal(jobsTabQueryString("saved", true), "tab=saved&researched=1");
});

test("every permanent redirect that lands on the /jobs list targets a real tab", () => {
  const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  const redirects = [...config.matchAll(/source:\s*"([^"]+)",\s*destination:\s*"([^"]+)"/g)];

  assert.ok(redirects.length >= 10, "expected the legacy redirect table to be present");

  const listDestinations = redirects
    .map((match) => match[2] ?? "")
    .filter((destination) => destination.startsWith("/jobs?"));

  assert.ok(
    listDestinations.length >= 4,
    "expected /inventory, /matches, /dossiers and /company-research to land on /jobs",
  );

  for (const destination of listDestinations) {
    const tab = new URL(destination, "https://example.test").searchParams.get("tab");
    if (tab === null) continue; // ?researched=1 only — opens on the default tab
    assert.ok(
      (JOBS_TABS as readonly string[]).includes(tab),
      `redirect to "${destination}" uses an unknown ?tab=${tab}`,
    );
  }
});
