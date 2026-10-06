import assert from "node:assert/strict";
import { test } from "node:test";

import type { NormalizedJob } from "../lib/jobs/types.ts";
import {
  formatPublicContractType,
  formatPublicSalary,
  isPublicFilter,
  matchesPublicFilter,
  sortPublicJobs,
  toPublicJob,
} from "../lib/public-jobs.ts";

/**
 * A7 / public-jobs rewire: the landing-page endpoint runs on searchAll, so its
 * filters, salary/contract formatting and ordering must work on NormalizedJob
 * from any of the six sources — not on Adzuna's native payload.
 */

function makeJob(overrides: Partial<NormalizedJob> = {}): NormalizedJob {
  return {
    source: "jsearch",
    externalId: "ext-1",
    title: "Frontend Developer",
    company: "Acme",
    location: "Lagos, Nigeria",
    description: "Build things.",
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

test("filter validation only accepts the four documented chips", () => {
  for (const valid of ["all", "remote", "fulltime", "salary150"]) {
    assert.equal(isPublicFilter(valid), true);
  }
  for (const invalid of ["", "parttime", "REMOTE", "salary999", "1=1"]) {
    assert.equal(isPublicFilter(invalid), false);
  }
});

test("remote filter accepts flags and Remote-titled roles, drops the rest", () => {
  assert.equal(matchesPublicFilter(makeJob({ remote: true }), "remote"), true);
  // Adzuna has no remote field — its "Remote …" titles must still qualify.
  assert.equal(
    matchesPublicFilter(makeJob({ remote: false, title: "Remote - React Developer" }), "remote"),
    true,
  );
  assert.equal(
    matchesPublicFilter(makeJob({ remote: false, title: "Kitchen Porter" }), "remote"),
    false,
  );
  // Adzuna-style listings that say "Remote" in the location field qualify too.
  assert.equal(
    matchesPublicFilter(makeJob({ location: "Remote" }), "remote"),
    true,
  );
});

test("fulltime filter excludes only explicitly non-full-time roles", () => {
  for (const type of [null, undefined, "", "full_time", "FULLTIME", "Full-Time", "permanent"]) {
    const job = makeJob({ employmentType: type ?? null });
    assert.equal(
      matchesPublicFilter(job, "fulltime"),
      true,
      `expected ${JSON.stringify(type)} to count as full time`,
    );
  }
  for (const type of ["part time", "Part-Time", "contract", "internship", "temp", "freelance"]) {
    const job = makeJob({ employmentType: type });
    assert.equal(
      matchesPublicFilter(job, "fulltime"),
      false,
      `expected ${JSON.stringify(type)} to be excluded`,
    );
  }
});

test("salary150 only admits verifiable minimums at or above the floor", () => {
  assert.equal(matchesPublicFilter(makeJob({ salaryMin: 150_000 }), "salary150"), true);
  assert.equal(matchesPublicFilter(makeJob({ salaryMin: 240_000 }), "salary150"), true);
  assert.equal(matchesPublicFilter(makeJob({ salaryMin: 149_999 }), "salary150"), false);
  // Free-form text ("$45-$120/Hour") cannot be verified — excluded, not guessed.
  assert.equal(
    matchesPublicFilter(makeJob({ salaryText: "$45-$120/Hour" }), "salary150"),
    false,
  );
  assert.equal(matchesPublicFilter(makeJob({}), "salary150"), false);
});

test("'all' passes everything through", () => {
  assert.equal(matchesPublicFilter(makeJob({ salaryMin: 1, remote: false }), "all"), true);
});

test("salary formatting prefers source text, then numbers, then the fallback", () => {
  // Native currency text wins — never re-render it as USD.
  assert.equal(
    formatPublicSalary(makeJob({ salaryText: "$45-$120/Hour", salaryMin: 90_000 })),
    "$45-$120/Hour",
  );
  assert.equal(formatPublicSalary(makeJob({})), "Salary not listed");
  assert.equal(
    formatPublicSalary(makeJob({ salaryMin: 120_000, salaryMax: 160_000 })),
    "$120k – $160k",
  );
  // Machine-predicted single figures used to render "$184k – $184k".
  assert.equal(formatPublicSalary(makeJob({ salaryMin: 184_000, salaryMax: 184_000 })), "$184k");
  assert.equal(formatPublicSalary(makeJob({ salaryMin: 120_000 })), "$120k+");
  assert.equal(formatPublicSalary(makeJob({ salaryMax: 160_000 })), "$160k+");
  // Small hourly figures must not become "$0k".
  assert.equal(formatPublicSalary(makeJob({ salaryMin: 45, salaryMax: 120 })), "$45 – $120");
});

test("contract type is title-cased and falls back to the legacy default", () => {
  assert.equal(formatPublicContractType(makeJob({ employmentType: "full_time" })), "Full Time");
  assert.equal(formatPublicContractType(makeJob({ employmentType: "FULLTIME" })), "Fulltime");
  assert.equal(formatPublicContractType(makeJob({ employmentType: "Full-Time" })), "Full Time");
  assert.equal(formatPublicContractType(makeJob({ employmentType: "part time" })), "Part Time");
  // Missing type displayed "Full time" before the rewire — keep that promise.
  assert.equal(formatPublicContractType(makeJob({})), "Full time");
});

test("toPublicJob composes a source-unique id and honest fallbacks", () => {
  const adzuna = toPublicJob(makeJob({ source: "adzuna", externalId: "123" }));
  const remoteok = toPublicJob(makeJob({ source: "remoteok", externalId: "123" }));
  // Ids collide across sources — React keys must not.
  assert.equal(adzuna.id, "adzuna:123");
  assert.equal(remoteok.id, "remoteok:123");
  assert.notEqual(adzuna.id, remoteok.id);

  assert.equal(toPublicJob(makeJob({ company: "" })).company, "Unknown company");
  assert.equal(toPublicJob(makeJob({ location: "", remote: true })).location, "Remote");
  assert.equal(toPublicJob(makeJob({ location: "", remote: false })).location, "Anywhere");
  assert.equal(toPublicJob(makeJob({ category: null })).category, "Technology");
  assert.equal(toPublicJob(makeJob({ category: "Cybersecurity" })).category, "Cybersecurity");
  // Unknown dates render "Recently" downstream, never "Invalid Date".
  assert.equal(toPublicJob(makeJob({ postedAt: null })).created, "");
  assert.equal(
    toPublicJob(makeJob({ applyUrl: "", sourceUrl: "https://board.example/job" })).url,
    "https://board.example/job",
  );
  assert.equal(
    toPublicJob(makeJob({ description: "" })).description,
    "",
  );
});

test("default sort mixes sources by recency with unknown dates last", () => {
  const old = makeJob({ externalId: "old", postedAt: "2026-09-01T00:00:00Z" });
  const fresh = makeJob({ externalId: "fresh", postedAt: "2026-10-06T00:00:00Z" });
  const unknown = makeJob({ externalId: "unknown", postedAt: null });

  const sorted = sortPublicJobs([old, unknown, fresh], "all");
  assert.deepEqual(
    sorted.map((job) => job.externalId),
    ["fresh", "old", "unknown"],
  );
  // Input must not be mutated.
  assert.equal(sortPublicJobs([old, unknown, fresh], "all").length, 3);
});

test("the $150k+ chip sorts by numeric minimum, highest first", () => {
  const low = makeJob({ externalId: "low", salaryMin: 150_000 });
  const high = makeJob({ externalId: "high", salaryMin: 320_000 });
  const unknown = makeJob({ externalId: "unknown", salaryMin: null });

  const sorted = sortPublicJobs([low, unknown, high], "salary150");
  assert.deepEqual(
    sorted.map((job) => job.externalId),
    ["high", "low", "unknown"],
  );
});
