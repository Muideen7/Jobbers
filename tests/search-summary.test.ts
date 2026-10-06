import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildSearchSuccessMessage,
  jobSaveKey,
  partitionNewJobs,
} from "../lib/jobs/search-summary.ts";
import type { ExistingJobRow } from "../lib/jobs/search-summary.ts";
import type { NormalizedJob } from "../lib/jobs/types.ts";

function makeJob(
  overrides: Partial<NormalizedJob> & {
    source: NormalizedJob["source"];
    externalId: string;
    title: string;
  },
): NormalizedJob {
  return {
    company: "Acme",
    location: "Remote",
    description: "short description",
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
    ...overrides,
  };
}

const existingRow = (
  source: string,
  sourceUrl: string | null,
  applyUrl: string | null = null,
): ExistingJobRow => ({
  source,
  source_url: sourceUrl,
  external_apply_url: applyUrl,
});

test("C5: jobSaveKey mirrors buildJobRecord's source_url (sourceUrl || applyUrl)", () => {
  assert.equal(
    jobSaveKey("jsearch", "https://a.example/job", "https://a.example/apply"),
    "jsearch|https://a.example/job",
  );
  // No listing URL — the apply URL carries the identity, as in the column.
  assert.equal(
    jobSaveKey("jsearch", null, "https://a.example/apply"),
    "jsearch|https://a.example/apply",
  );
  assert.equal(jobSaveKey("search", null, null), "search|");
});

test("C5: partition skips already-saved jobs and counts them", () => {
  const found = [
    makeJob({
      source: "jsearch",
      externalId: "1",
      title: "Frontend Dev",
      sourceUrl: "https://jobs.example/1",
    }),
    makeJob({
      source: "jsearch",
      externalId: "2",
      title: "UI Engineer",
      sourceUrl: "https://jobs.example/2",
    }),
    makeJob({
      source: "arbeitnow",
      externalId: "3",
      title: "React Dev",
      sourceUrl: "https://arbeitnow.example/job/3",
    }),
  ];
  const existing = [
    existingRow("jsearch", "https://jobs.example/1"), // job 1's sourceUrl
  ];

  const { fresh, duplicates, existingCount } = partitionNewJobs(found, existing);

  assert.equal(fresh.length, 2);
  assert.equal(duplicates, 1);
  assert.equal(existingCount, 1);
  assert.deepEqual(
    fresh.map((j) => j.externalId),
    ["2", "3"],
  );
});

test("C5: partition dedupes within the batch too", () => {
  const twinA = makeJob({ source: "jsearch", externalId: "a", title: "React Dev" });
  const twinB = makeJob({ source: "jsearch", externalId: "b", title: "React Dev" });

  const { fresh, duplicates } = partitionNewJobs([twinA, twinB], []);

  assert.equal(fresh.length, 1);
  assert.equal(duplicates, 1);
});

test("C5: legacy rows without urls only collide with their own key", () => {
  const legacy = [existingRow("search", null, null)];
  const found = [
    makeJob({ source: "jsearch", externalId: "1", title: "Frontend Dev" }),
  ];

  const { fresh, duplicates } = partitionNewJobs(found, legacy);
  assert.equal(fresh.length, 1);
  assert.equal(duplicates, 0);
});

test("C5: success message reconciles run count against the list total", () => {
  assert.equal(
    buildSearchSuccessMessage({
      inserted: 13,
      duplicates: 0,
      total: 53,
      highMatchCount: 0,
    }),
    "Added 13 new jobs. No high matches yet — try a broader search. Your list: 53 jobs.",
  );

  assert.equal(
    buildSearchSuccessMessage({
      inserted: 4,
      duplicates: 9,
      total: 44,
      highMatchCount: 2,
    }),
    "Added 4 new jobs (9 already saved). 2 strong matches. Your list: 44 jobs.",
  );

  assert.equal(
    buildSearchSuccessMessage({
      inserted: 1,
      duplicates: 0,
      total: 41,
      highMatchCount: 1,
    }),
    "Added 1 new job. 1 strong match. Your list: 41 jobs.",
  );

  assert.equal(
    buildSearchSuccessMessage({
      inserted: 0,
      duplicates: 13,
      total: 53,
      highMatchCount: 0,
    }),
    "No new jobs — all 13 results already in your list. Your list: 53 jobs.",
  );

  assert.equal(
    buildSearchSuccessMessage({
      inserted: 0,
      duplicates: 0,
      total: 40,
      highMatchCount: 0,
    }),
    "No jobs found for that search. Try a different title or location.",
  );
});
