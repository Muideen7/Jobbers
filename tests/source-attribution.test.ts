import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SOURCE_ATTRIBUTION,
  resolveSourceCredits,
} from "../lib/source-attribution.ts";

/**
 * A7: RemoteOK, Remotive, Jobicy and Adzuna all require an on-site link-back
 * naming the source. resolveSourceCredits drives both attribution lines, so it
 * must produce a deduplicated, link-bearing list from whatever source ids a
 * result set happens to contain.
 */

test("every job source has a label and an http link-back", () => {
  for (const id of ["jsearch", "arbeitnow", "remoteok", "remotive", "jobicy"] as const) {
    const credit = SOURCE_ATTRIBUTION[id];
    assert.ok(credit, `${id} missing from the attribution registry`);
    assert.ok(credit.label.length > 0, `${id} has an empty label`);
    assert.match(credit.url, /^https:\/\//, `${id} must link back over https`);
  }
});

test("credits are deduplicated by label and keep first-seen order", () => {
  const credits = resolveSourceCredits(["remoteok", "jsearch", "remoteok", "arbeitnow"]);

  assert.deepEqual(
    credits.map((credit) => credit.label),
    ["RemoteOK", "JSearch", "Arbeitnow"],
  );

  const legacy = resolveSourceCredits(["search", "remoteok"]);
  assert.deepEqual(
    legacy.map((credit) => credit.label),
    ["Direct", "RemoteOK"],
  );
});

test("hand-saved URL jobs and unknown ids are not credited", () => {
  assert.deepEqual(resolveSourceCredits(["url"]), []);
  assert.deepEqual(resolveSourceCredits(["url", "company_research"]), []);
  assert.deepEqual(resolveSourceCredits([]), []);
  // Mixed set: only real sources survive.
  assert.deepEqual(
    resolveSourceCredits(["url", "jsearch"]).map((credit) => credit.label),
    ["JSearch"],
  );
});
