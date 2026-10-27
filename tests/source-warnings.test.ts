import assert from "node:assert/strict";
import { test } from "node:test";

import { sourceWarningLogRows } from "../lib/jobs/source-warnings.ts";
import {
  createSearchAllState,
  searchAll,
} from "../lib/jobs/search-all.ts";
import type { ProviderOutcome } from "../lib/jobs/search-all.ts";
import type { JobProvider, NormalizedJob } from "../lib/jobs/types.ts";

const NOW = "2026-10-06T12:00:00.000Z";

test("B2: a failing source becomes an agent_logs warning row", () => {
  const outcomes: ProviderOutcome[] = [
    { source: "jsearch", count: 12 },
    { source: "arbeitnow", count: 8 },
    {
      source: "remotive",
      count: 0,
      error: "Remotive API error: 503 (SERVICE_UNAVAILABLE)",
    },
  ];

  const rows = sourceWarningLogRows({
    runId: "run-1",
    userId: "user-1",
    outcomes,
    now: () => NOW,
  });

  assert.equal(rows.length, 1);
  const [row] = rows;
  assert.ok(row);
  assert.equal(row.level, "warning");
  assert.equal(row.run_id, "run-1");
  assert.equal(row.user_id, "user-1");
  assert.equal(row.job_id, null);
  assert.equal(row.created_at, NOW);
  assert.match(row.message, /remotive/);
  assert.match(row.message, /SERVICE_UNAVAILABLE/);
  // The message must also state that the run kept going (never "failed").
  assert.match(row.message, /continued/);
});

test("healthy outcomes produce no rows and the run completes", () => {
  const rows = sourceWarningLogRows({
    runId: "run-2",
    userId: "user-2",
    outcomes: [
      { source: "jsearch", count: 40 },
      { source: "remotive", count: 0 },
    ],
    now: () => NOW,
  });
  assert.deepEqual(rows, []);
});

test("every failing source gets its own row", () => {
  const rows = sourceWarningLogRows({
    runId: "run-3",
    userId: "user-3",
    outcomes: [
      { source: "jsearch", count: 0, error: "quota exceeded" },
      { source: "remoteok", count: 5 },
      { source: "remotive", count: 0, error: "daily source cap reached (4/day)" },
    ],
    now: () => NOW,
  });

  assert.equal(rows.length, 2);
  const [quotaRow, capRow] = rows;
  assert.ok(quotaRow);
  assert.ok(capRow);
  assert.match(quotaRow.message, /jsearch.*quota exceeded/);
  assert.match(capRow.message, /remotive.*daily source cap/);
});

test("B2 end-to-end: Adzuna 404 → run gets a warning row, other sources' jobs survive", async () => {
  const jobs: NormalizedJob[] = [
    {
      source: "arbeitnow",
      externalId: "42",
      title: "Frontend Developer",
      company: "Acme",
      location: "Remote",
      description: "Build things",
      applyUrl: "https://acme.example/apply",
      sourceUrl: "https://acme.example/job",
      salaryMin: null,
      salaryMax: null,
      salaryPeriod: null,
      salaryText: null,
      category: null,
      postedAt: null,
      employmentType: null,
      remote: false,
      highlights: { responsibilities: [], requirements: [], benefits: [] },
    },
  ];

  const healthy: JobProvider = {
    id: "arbeitnow",
    searchMode: "server",
    async search() {
      return jobs;
    },
  };
  // Stands in for the real adzunaProvider throwing HTTP 404 UNSUPPORTED_COUNTRY.
  const failing: JobProvider = {
    id: "remotive",
    searchMode: "server",
    async search() {
      throw new Error("Remotive API error: 503 (SERVICE_UNAVAILABLE)");
    },
  };

  const result = await searchAll(
    { title: "frontend", location: "Lagos", country: "ng" },
    { providers: [healthy, failing], state: createSearchAllState() },
  );

  // The run completes with the healthy source's jobs …
  assert.equal(result.jobs.length, 1);
  const [saved] = result.jobs;
  assert.ok(saved);
  assert.equal(saved.source, "arbeitnow");

  // … and the failure surfaces as a warning row, never a thrown error.
  const rows = sourceWarningLogRows({
    runId: "run-e2e",
    userId: "user-e2e",
    outcomes: result.outcomes,
    now: () => NOW,
  });
  assert.equal(rows.length, 1);
  const [row] = rows;
  assert.ok(row);
  assert.equal(row.level, "warning");
  assert.match(row.message, /remotive/);
  assert.match(row.message, /SERVICE_UNAVAILABLE/);
});
