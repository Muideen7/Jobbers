import assert from "node:assert/strict";
import { test } from "node:test";

import type { NormalizedJob } from "../lib/jobs/types.ts";
import {
  categoryFacets,
  formatPublicContractType,
  formatPublicSalary,
  isPublicEmploymentType,
  isPublicFilter,
  isPublicSalaryBand,
  matchesPublicCategory,
  matchesPublicCountry,
  matchesPublicEmployment,
  matchesPublicFilter,
  matchesPublicSalary,
  matchesPublicSkills,
  sanitizePublicCategory,
  sanitizePublicSkills,
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

// ---------------------------------------------------------------------------
// Facet dropdowns (LiveOpportunities) — the params behind the five pills.
// ---------------------------------------------------------------------------

test("facet param validation rejects junk before it reaches a filter", () => {
  for (const valid of ["any", "50k", "100k", "150k"]) {
    assert.equal(isPublicSalaryBand(valid), true);
  }
  for (const invalid of ["", "150000", "50K", "any salary"]) {
    assert.equal(isPublicSalaryBand(invalid), false);
  }

  for (const valid of ["any", "fulltime", "parttime", "contract", "internship"]) {
    assert.equal(isPublicEmploymentType(valid), true);
  }
  for (const invalid of ["", "FULLTIME", "freelance", "1=1"]) {
    assert.equal(isPublicEmploymentType(invalid), false);
  }

  // Category: trimmed, whitespace-collapsed, length-capped, empty → null.
  assert.equal(sanitizePublicCategory("  Software   Development  "), "Software Development");
  assert.equal(sanitizePublicCategory("x".repeat(200))?.length, 80, "capped at 80 chars");
  assert.equal(sanitizePublicCategory("   "), null);
  assert.equal(sanitizePublicCategory(null), null);

  // Skills: comma-split, trimmed, de-duplicated, capped at 5 terms × 40 chars.
  assert.deepEqual(
    sanitizePublicSkills(" React , react ,TypeScript, ,Python "),
    ["React", "TypeScript", "Python"],
  );
  const many = Array.from({ length: 8 }, (_, i) => `skill${i}`).join(",");
  assert.equal(sanitizePublicSkills(many).length, 5, "capped at 5 terms");
  assert.deepEqual(sanitizePublicSkills(null), []);
});

test("salary bands admit only verifiable minimums at or above the floor", () => {
  assert.equal(matchesPublicSalary(makeJob({}), "any"), true);
  assert.equal(matchesPublicSalary(makeJob({ salaryMin: 120_000 }), "any"), true);

  assert.equal(matchesPublicSalary(makeJob({ salaryMin: 50_000 }), "50k"), true);
  assert.equal(matchesPublicSalary(makeJob({ salaryMin: 49_999 }), "50k"), false);
  assert.equal(matchesPublicSalary(makeJob({ salaryMin: 100_000 }), "100k"), true);
  assert.equal(matchesPublicSalary(makeJob({ salaryMin: 99_999 }), "100k"), false);
  // 150k keeps the legacy salary150 promise.
  assert.equal(matchesPublicSalary(makeJob({ salaryMin: 150_000 }), "150k"), true);
  assert.equal(matchesPublicSalary(makeJob({ salaryMin: 149_999 }), "150k"), false);
  // Free-form/hourly text cannot be verified against a band — excluded, not guessed.
  assert.equal(
    matchesPublicSalary(makeJob({ salaryText: "$45-$120/Hour" }), "50k"),
    false,
  );
  assert.equal(matchesPublicSalary(makeJob({}), "50k"), false);
});

test("employment bands cover contract types and keep the full-time default", () => {
  // fulltime = legacy chip semantics: unknown counts as full time.
  assert.equal(matchesPublicEmployment(makeJob({ employmentType: null }), "fulltime"), true);
  assert.equal(matchesPublicEmployment(makeJob({ employmentType: "permanent" }), "fulltime"), true);
  assert.equal(matchesPublicEmployment(makeJob({ employmentType: "Part-Time" }), "fulltime"), false);
  // Unknown is NOT part time / contract / internship.
  assert.equal(matchesPublicEmployment(makeJob({ employmentType: null }), "parttime"), false);
  assert.equal(matchesPublicEmployment(makeJob({ employmentType: null }), "contract"), false);
  assert.equal(matchesPublicEmployment(makeJob({ employmentType: null }), "internship"), false);

  assert.equal(matchesPublicEmployment(makeJob({ employmentType: "Part-Time" }), "parttime"), true);
  assert.equal(matchesPublicEmployment(makeJob({ employmentType: "contract" }), "contract"), true);
  assert.equal(matchesPublicEmployment(makeJob({ employmentType: "Freelance" }), "contract"), true);
  assert.equal(matchesPublicEmployment(makeJob({ employmentType: "temporary" }), "contract"), true);
  assert.equal(matchesPublicEmployment(makeJob({ employmentType: "Internship" }), "internship"), true);
  assert.equal(matchesPublicEmployment(makeJob({ employmentType: "full_time" }), "internship"), false);
  // "any" passes everything through.
  assert.equal(matchesPublicEmployment(makeJob({ employmentType: "part time" }), "any"), true);
});

test("category filter matches exactly what the cards display", () => {
  // Null category renders "Technology" on the card — the facet must count it too.
  assert.equal(matchesPublicCategory(makeJob({ category: null }), "Technology"), true);
  assert.equal(matchesPublicCategory(makeJob({ category: "Technology" }), "technology"), true);
  assert.equal(matchesPublicCategory(makeJob({ category: "Design" }), "Technology"), false);
  // No selection passes everything.
  assert.equal(matchesPublicCategory(makeJob({ category: "Design" }), null), true);

  assert.deepEqual(
    categoryFacets([
      makeJob({ category: "Design" }),
      makeJob({ category: null }),
      makeJob({ category: "Engineering" }),
      makeJob({ category: "design" }),
    ]),
    ["Design", "Engineering", "Technology"],
    "distinct + alphabetical, null → Technology, case-folded",
  );
});

test("skills must all appear as whole words in the title or description", () => {
  const react = makeJob({
    title: "React Developer",
    description: "Build component libraries.",
  });
  assert.equal(matchesPublicSkills(react, ["React"]), true);
  assert.equal(matchesPublicSkills(react, ["React", "TypeScript"]), false, "AND semantics");
  assert.equal(matchesPublicSkills(react, []), true);

  // "Java" must not match "JavaScript" (word boundary).
  const js = makeJob({ title: "JavaScript Engineer", description: "" });
  assert.equal(matchesPublicSkills(js, ["Java"]), false);
  assert.equal(matchesPublicSkills(js, ["JavaScript"]), true);

  // Terms with regex metacharacters are matched literally.
  const node = makeJob({ title: "Node.js API Developer", description: "" });
  assert.equal(matchesPublicSkills(node, ["Node.js"]), true);
  assert.equal(matchesPublicSkills(node, ["C++"]), false);

  // Case-insensitive, description also counts.
  const py = makeJob({ title: "Data Engineer", description: "Python and SQL pipelines." });
  assert.equal(matchesPublicSkills(py, ["python"]), true);
});

test("country filter drops only clear other-country locations", () => {
  // Remote / unresolvable locations are workable from anywhere — they pass.
  assert.equal(matchesPublicCountry(makeJob({ remote: true, location: "New York, NY" }), "ng"), true);
  assert.equal(matchesPublicCountry(makeJob({ location: "Remote" }), "ng"), true);
  assert.equal(matchesPublicCountry(makeJob({ location: "Anywhere" }), "ng"), true);
  assert.equal(matchesPublicCountry(makeJob({ location: "" }), "ng"), true);
  assert.equal(matchesPublicCountry(makeJob({ location: "Atlantis" }), "ng"), true, "unresolvable passes");

  // Matching country passes, different country is dropped.
  assert.equal(matchesPublicCountry(makeJob({ location: "Lagos, Nigeria" }), "ng"), true);
  assert.equal(matchesPublicCountry(makeJob({ location: "Lagos, Nigeria" }), "us"), false);
  assert.equal(matchesPublicCountry(makeJob({ location: "Berlin, Germany" }), "ng"), false);
  assert.equal(matchesPublicCountry(makeJob({ location: "United Kingdom" }), "gb"), true);
});
