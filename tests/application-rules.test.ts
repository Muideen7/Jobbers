import assert from "node:assert/strict";
import { test } from "node:test";

import {
  APPLICATION_STAGE_ORDER,
  applicationStageRank,
  computeFollowUpDate,
  endOfToday,
  isToday,
} from "../lib/workspace/application-rules.ts";

test("stage order follows the Kanban pipeline, with closed last", () => {
  assert.deepEqual(APPLICATION_STAGE_ORDER, {
    saved: 0,
    applied: 1,
    interview: 2,
    offer: 3,
    closed: 4,
  });

  const shuffled = ["closed", "offer", "saved", "interview", "applied"];
  const sorted = [...shuffled].sort((a, b) => applicationStageRank(a) - applicationStageRank(b));
  assert.deepEqual(sorted, ["saved", "applied", "interview", "offer", "closed"]);
});

test("unknown statuses rank last instead of throwing", () => {
  assert.equal(applicationStageRank("mystery"), 99);
  assert.ok(applicationStageRank("mystery") > applicationStageRank("closed"));
});

test("computeFollowUpDate adds calendar days and keeps ISO form", () => {
  assert.equal(
    computeFollowUpDate("2026-10-07T09:00:00.000Z", 7),
    "2026-10-14T09:00:00.000Z",
  );

  // Crossing a month boundary.
  assert.equal(
    computeFollowUpDate("2026-10-31T12:00:00.000Z", 7),
    "2026-11-07T12:00:00.000Z",
  );

  // Zero days is a no-op.
  assert.equal(
    computeFollowUpDate("2026-10-07T09:00:00.000Z", 0),
    "2026-10-07T09:00:00.000Z",
  );
});

test("isToday only matches the local calendar day", () => {
  const now = new Date(2026, 9, 7, 15, 30); // 2026-10-07 15:30 local

  assert.ok(isToday(new Date(2026, 9, 7, 0, 1).toISOString(), now));
  assert.ok(isToday(new Date(2026, 9, 7, 23, 59).toISOString(), now));
  assert.ok(!isToday(new Date(2026, 9, 6, 23, 59).toISOString(), now));
  assert.ok(!isToday(new Date(2026, 9, 8, 0, 1).toISOString(), now));
});

test("endOfToday is the first instant of tomorrow (local)", () => {
  const end = endOfToday(new Date(2026, 9, 7, 15, 30));
  assert.equal(end, new Date(2026, 9, 8, 0, 0, 0, 0).toISOString());

  // Anything before that instant is "due", anything after is not.
  const due = new Date(2026, 9, 7, 23, 59).toISOString();
  const notYet = new Date(2026, 9, 8, 0, 1).toISOString();
  assert.ok(due <= end);
  assert.ok(notYet > end);
});