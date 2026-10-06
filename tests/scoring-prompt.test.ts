import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SCORING_MAX_DESCRIPTION_CHARS,
  buildProfileContext,
  buildScoringPrompt,
  descriptionBudgetPerJob,
  scoringId,
  scoringMaxOutputTokens,
  truncateAtWordBoundary,
} from "../lib/jobs/scoring-prompt.ts";
import type { ProfileScoreContext } from "../lib/jobs/scoring-prompt.ts";
import type { NormalizedJob } from "../lib/jobs/types.ts";

const profile: ProfileScoreContext = {
  skills: ["React", "TypeScript"],
  industries: ["Fintech"],
  experience_level: "Mid-Senior level",
  job_titles_seeking: ["Frontend Developer"],
  years_experience: 5,
  work_experience: [
    {
      company: "Acme",
      title: "Frontend Developer",
      start_date: "2021-01",
      end_date: null,
      is_current: true,
      responsibilities: "Built the design system",
    },
  ],
  remote_preference: "remote",
  preferred_locations: ["Lagos"],
  salary_expectation: "$120k",
  location: "Lagos, Nigeria",
};

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

test("C1: profile context carries all nine scoring fields plus location", () => {
  const parsed = JSON.parse(buildProfileContext(profile));

  assert.equal(parsed.years_experience, 5);
  assert.equal(parsed.experience_level, "Mid-Senior level");
  assert.deepEqual(parsed.skills, ["React", "TypeScript"]);
  assert.deepEqual(parsed.industries, ["Fintech"]);
  assert.deepEqual(parsed.desired_roles, ["Frontend Developer"]);
  assert.equal(parsed.work_experience?.length, 1);
  assert.equal(parsed.remote_preference, "remote");
  assert.deepEqual(parsed.preferred_locations, ["Lagos"]);
  assert.equal(parsed.salary_expectation, "$120k");
  assert.equal(parsed.current_location, "Lagos, Nigeria");
});

test("C1: every field is present even when the profile is empty", () => {
  const empty: ProfileScoreContext = {
    skills: null,
    industries: null,
    experience_level: null,
    job_titles_seeking: null,
    years_experience: null,
    work_experience: null,
    remote_preference: null,
    preferred_locations: null,
    salary_expectation: null,
    location: null,
  };

  const parsed = JSON.parse(buildProfileContext(empty));
  const expectedKeys = [
    "years_experience",
    "experience_level",
    "skills",
    "industries",
    "desired_roles",
    "work_experience",
    "remote_preference",
    "preferred_locations",
    "current_location",
    "salary_expectation",
  ];
  for (const key of expectedKeys) {
    assert.ok(key in parsed, `missing ${key}`);
    assert.equal(parsed[key], null);
  }
});

test("C2: short descriptions pass through untouched (Adzuna snippets)", () => {
  const snippet = "Build beautiful UIs with React.";
  assert.equal(truncateAtWordBoundary(snippet, 1000), snippet);
  assert.equal(
    truncateAtWordBoundary(snippet, SCORING_MAX_DESCRIPTION_CHARS),
    snippet,
  );
});

test("C2: long descriptions are cut at a word boundary with an ellipsis", () => {
  // Uniform words make the boundary property unambiguous: a mid-word cut
  // would end in something like "alphabetic", only a boundary cut ends on a
  // complete "alphabetical".
  const uniform = "alphabetical ".repeat(500);
  const cutUniform = truncateAtWordBoundary(uniform, 1000);
  assert.ok(cutUniform.endsWith("alphabetical…"), `got: …${cutUniform.slice(-20)}`);

  // Mixed content: cap respected, ellipsis added, no dangling space.
  const long = "React TypeScript Node. ".repeat(500); // 11,500 chars
  const cut = truncateAtWordBoundary(long, 1000);

  assert.ok(cut.length <= 1001, `cut is ${cut.length} chars`);
  assert.ok(cut.endsWith("…"));
  assert.ok(!cut.slice(0, -1).endsWith(" "), "no dangling space before the ellipsis");

  // Hard fallback for giant unbroken strings (URLs) — still respects the cap.
  const blob = "a".repeat(5_000);
  assert.ok(truncateAtWordBoundary(blob, 100).length <= 101);
});

test("C2: the per-job budget divides the shared total and caps at the maximum", () => {
  assert.equal(descriptionBudgetPerJob(40), 4000); // 160k ÷ 40
  assert.equal(descriptionBudgetPerJob(10), 6000); // 160k ÷ 10 = 16k → cap
  assert.equal(descriptionBudgetPerJob(100), 1600);
  assert.equal(descriptionBudgetPerJob(0), 6000);
});

test("C2: prompt lists every job once with a source-namespaced id", () => {
  const jobs = [
    makeJob({ source: "jsearch", externalId: "123", title: "Frontend Dev" }),
    makeJob({ source: "adzuna", externalId: "123", title: "UI Engineer" }),
    makeJob({ source: "remoteok", externalId: "77", title: "React Dev" }),
  ];

  const { system, prompt, maxOutputTokens } = buildScoringPrompt({
    jobs,
    profile,
  });

  assert.match(prompt, /Score each of the following 3 jobs/);
  assert.equal((prompt.match(/\(id: "/g) ?? []).length, 3);
  // Same raw externalId, different jobs — the namespace keeps them apart.
  assert.match(prompt, /\(id: "jsearch:123"\)/);
  assert.match(prompt, /\(id: "adzuna:123"\)/);
  // C1: the full profile context is embedded verbatim.
  assert.ok(prompt.includes(buildProfileContext(profile)));
  // C4: system wording unchanged.
  assert.match(system, /job matching assistant/);
  assert.ok(maxOutputTokens >= 1200);
});

test("C2: a multi-KB description enters the prompt cut to the budget", () => {
  const longDescription = "React TypeScript Node. ".repeat(2_000); // 46k chars
  const jobs = [
    makeJob({
      source: "jsearch",
      externalId: "1",
      title: "Frontend Developer",
      description: longDescription,
    }),
  ];

  const { prompt } = buildScoringPrompt({ jobs, profile });
  const descriptionLine = prompt
    .split("\n")
    .find((line) => line.startsWith("Description: "));

  assert.ok(descriptionLine);
  // 1 job → full per-job maximum (6000 chars) + prefix.
  assert.ok(
    descriptionLine.length <= 6_000 + "Description: ".length + 1,
    `description line is ${descriptionLine.length} chars`,
  );
  // The surrounding structure survived — ids and titles are intact.
  assert.match(prompt, /\(id: "jsearch:1"\)/);
  assert.match(prompt, /Title: Frontend Developer/);
});

test("C4: output budget scales with job count, floored at the old 1200", () => {
  assert.equal(scoringMaxOutputTokens(1), 1200);
  assert.equal(scoringMaxOutputTokens(6), 2800);
  assert.ok(scoringMaxOutputTokens(40) >= 8_000); // 40 results can't fit in 1200
  assert.equal(scoringMaxOutputTokens(100), 16_384); // cap
});

test("scoringId namespaces external ids by source", () => {
  assert.equal(
    scoringId(makeJob({ source: "jsearch", externalId: "42", title: "Dev" })),
    "jsearch:42",
  );
  assert.equal(
    scoringId(makeJob({ source: "adzuna", externalId: "42", title: "Dev" })),
    "adzuna:42",
  );
});
