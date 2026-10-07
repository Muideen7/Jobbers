import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildRoleSummary,
  ROLE_SUMMARY_MAX_WORDS,
  summarizeText,
  toPlainText,
} from "../lib/role-summary.ts";
import type { Job } from "../types/index.ts";

function roleJob(overrides: Partial<Job> = {}): Pick<Job, "about_role" | "responsibilities"> {
  return {
    about_role: null,
    responsibilities: [],
    ...overrides,
  };
}

test("toPlainText strips scraper markup and collapses whitespace", () => {
  assert.equal(
    toPlainText("<p>Build <strong>things</strong>&nbsp;today</p>\n<ul><li>Ship</li></ul>"),
    "Build things today Ship",
  );
});

test("summarizeText caps the word count and appends an ellipsis", () => {
  const words = Array.from({ length: 120 }, (_, i) => `word${i}`).join(" ");
  const out = summarizeText(words, 10);
  assert.equal(out.split(/\s+/).length, 10);
  assert.ok(out.endsWith("…"));
  assert.equal(summarizeText("few words here", 10), "few words here");
  assert.equal(summarizeText("   ", 10), "");
});

test("buildRoleSummary prefers parsed responsibilities over the description", () => {
  const job = roleJob({
    responsibilities: ["Design the operator console", "Ship real-time video views"],
    about_role: "About ActAI — our mission is to build proactive applications.",
  });
  const summary = buildRoleSummary(job);
  assert.ok(summary);
  assert.match(summary, /operator console/);
  assert.doesNotMatch(summary, /mission/);
});

test("buildRoleSummary skips the leading company intro when only a description exists", () => {
  const about =
    "About ActAI There are over 5 billion users using basic applications today and they are not AI-native. " +
    "Our mission is to build proactive applications for anyone in the world. " +
    "The Role You will build the Command Centre an operator uses to see what the robots see. " +
    "That means shaping flows, prototyping them, and shipping production interfaces.";
  const summary = buildRoleSummary(roleJob({ about_role: about }));
  assert.ok(summary);
  assert.match(summary, /Command Centre/);
  assert.doesNotMatch(summary, /^About ActAI/);
});

test("buildRoleSummary caps output at ROLE_SUMMARY_MAX_WORDS words", () => {
  const about = Array.from({ length: 400 }, (_, i) => `token${i}`).join(" ");
  const summary = buildRoleSummary(roleJob({ about_role: about }));
  assert.ok(summary);
  assert.ok(summary.split(/\s+/).length <= ROLE_SUMMARY_MAX_WORDS);
});

test("buildRoleSummary returns null when there is nothing to summarise", () => {
  assert.equal(buildRoleSummary(roleJob()), null);
  assert.equal(buildRoleSummary(roleJob({ about_role: "   " })), null);
});