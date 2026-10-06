import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildJobRecord,
  formatSalaryForDb,
} from "../lib/jobs/job-record.ts";
import type { JobScoreFields } from "../lib/jobs/job-record.ts";
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

const score: JobScoreFields = {
  matchScore: 87,
  matchReason: "Strong React overlap",
  matchedSkills: ["React"],
  missingSkills: ["Go"],
};

const foundAt = "2026-10-06T12:00:00.000Z";

test("C3: structured highlights land in their DB columns", () => {
  const job = makeJob({
    source: "jsearch",
    externalId: "42",
    title: "Frontend Engineer",
    highlights: {
      responsibilities: ["Own the design system", "Ship weekly"],
      requirements: ["5 years React", "TypeScript fluency"],
      benefits: ["Remote-first", "Equity"],
    },
  });

  const record = buildJobRecord({
    job,
    userId: "user-1",
    runId: "run-1",
    score,
    foundAt,
  });

  assert.deepEqual(record.responsibilities, ["Own the design system", "Ship weekly"]);
  assert.deepEqual(record.requirements, ["5 years React", "TypeScript fluency"]);
  assert.deepEqual(record.benefits, ["Remote-first", "Equity"]);
});

test("C3: sources without highlights insert empty arrays (columns' default)", () => {
  const record = buildJobRecord({
    job: makeJob({ source: "adzuna", externalId: "9", title: "Dev" }),
    userId: "user-1",
    runId: "run-1",
    score,
    foundAt,
  });

  assert.deepEqual(record.responsibilities, []);
  assert.deepEqual(record.requirements, []);
  assert.deepEqual(record.benefits, []);
});

test("A7/C4: source, urls and score fields flow through unchanged", () => {
  const record = buildJobRecord({
    job: makeJob({
      source: "remoteok",
      externalId: "123",
      title: "React Developer",
      company: "",
    }),
    userId: "user-1",
    runId: "run-1",
    score,
    foundAt,
  });

  assert.equal(record.source, "remoteok"); // provider id, never "search"
  assert.equal(record.company, "Unknown company");
  assert.equal(record.source_url, "https://acme.example/job");
  assert.equal(record.external_apply_url, "https://acme.example/apply");
  assert.equal(record.match_score, 87);
  assert.equal(record.match_reason, "Strong React overlap");
  assert.deepEqual(record.matched_skills, ["React"]);
  assert.deepEqual(record.missing_skills, ["Go"]);
  assert.equal(record.found_at, foundAt);
  assert.equal(record.user_id, "user-1");
  assert.equal(record.run_id, "run-1");
});

test("C4: the zero-score fallback record keeps its wording", () => {
  const record = buildJobRecord({
    job: makeJob({ source: "jsearch", externalId: "1", title: "Dev" }),
    userId: "user-1",
    runId: null,
    score: {
      matchScore: 0,
      matchReason: "Score unavailable",
      matchedSkills: [],
      missingSkills: [],
    },
    foundAt,
  });

  assert.equal(record.match_score, 0);
  assert.equal(record.match_reason, "Score unavailable");
  assert.deepEqual(record.matched_skills, []);
  assert.deepEqual(record.missing_skills, []);
  assert.equal(record.run_id, null);
});

test("C4: job_type and location fallbacks behave as before", () => {
  const typed = buildJobRecord({
    job: makeJob({
      source: "jsearch",
      externalId: "1",
      title: "Dev",
      employmentType: "CONTRACTOR",
      location: "Lagos",
    }),
    userId: "u",
    runId: null,
    score,
    foundAt,
  });
  assert.equal(typed.job_type, "CONTRACTOR");
  assert.equal(typed.location, "Lagos");

  const remote = buildJobRecord({
    job: makeJob({
      source: "remoteok",
      externalId: "2",
      title: "Dev",
      location: "",
      remote: true,
    }),
    userId: "u",
    runId: null,
    score,
    foundAt,
  });
  assert.equal(remote.location, "Remote");

  const unknown = buildJobRecord({
    job: makeJob({
      source: "adzuna",
      externalId: "3",
      title: "Dev",
      location: "",
      remote: false,
    }),
    userId: "u",
    runId: null,
    score,
    foundAt,
  });
  assert.equal(unknown.location, "Unknown location");
  assert.equal(unknown.job_type, "fulltime");
});

test("salary formatting rules are unchanged by the move", () => {
  // Source text wins, period intact.
  assert.equal(
    formatSalaryForDb(
      makeJob({ source: "remotive", externalId: "1", title: "Dev", salaryText: "$45-$120/Hour" }),
    ),
    "$45-$120/Hour",
  );
  // Numeric figures only collapse when yearly or unstated.
  assert.equal(
    formatSalaryForDb(
      makeJob({ source: "jsearch", externalId: "2", title: "Dev", salaryMin: 120_000, salaryMax: 150_000, salaryPeriod: "YEAR" }),
    ),
    "$120k - $150k",
  );
  assert.equal(
    formatSalaryForDb(
      makeJob({ source: "adzuna", externalId: "3", title: "Dev", salaryMin: 90_000, salaryPeriod: null }),
    ),
    "$90k+",
  );
  // Hourly/monthly numbers are dropped rather than mislabelled as yearly.
  assert.equal(
    formatSalaryForDb(
      makeJob({ source: "remotive", externalId: "4", title: "Dev", salaryMin: 100, salaryPeriod: "HOUR" }),
    ),
    null,
  );
  assert.equal(
    formatSalaryForDb(makeJob({ source: "jsearch", externalId: "5", title: "Dev" })),
    null,
  );
});
