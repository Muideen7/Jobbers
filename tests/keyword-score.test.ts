import assert from "node:assert/strict";
import { test } from "node:test";

import {
  KEYWORD_SCORE_WEIGHTS,
  keywordScore,
  keywordScoreBatch,
  reconcileWithAiResults,
  skillInText,
} from "../lib/jobs/keyword-score.ts";
import type { ProfileScoreContext } from "../lib/jobs/scoring-prompt.ts";
import type { NormalizedJob } from "../lib/jobs/types.ts";

const profile: ProfileScoreContext = {
  skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
  industries: ["Fintech"],
  experience_level: "Senior",
  job_titles_seeking: ["Frontend Engineer"],
  years_experience: 5,
  work_experience: [
    {
      company: "Kora",
      title: "Frontend Developer",
      start_date: "March 2021",
      end_date: null,
      is_current: true,
      responsibilities: "Owned the design system.",
    },
  ],
  remote_preference: "Remote Only",
  preferred_locations: ["Remote", "Lagos"],
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
    remote: true,
    highlights: { responsibilities: [], requirements: [], benefits: [] },
    ...overrides,
  };
}

const strongJob = makeJob({
  source: "jsearch",
  externalId: "strong",
  title: "Senior Frontend Engineer",
  description:
    "Own our React + TypeScript dashboard built with Next.js and Tailwind CSS. " +
    "Fintech product used by 2M users. 5+ years building web apps required.",
});

const weakJob = makeJob({
  source: "jsearch",
  externalId: "weak",
  title: "Backend Engineer (Go)",
  description:
    "Build services in Go and PostgreSQL with Kubernetes in production. " +
    "4+ years backend experience. No frontend work.",
});

const mismatchJob = makeJob({
  source: "jsearch",
  externalId: "mismatch",
  title: "Embedded Firmware Engineer",
  description:
    "Write C++ for STM32 microcontrollers. Debug I2C/SPI buses. " +
  "3+ years embedded systems experience required.",
  remote: false,
  location: "Lagos",
});

test("weights sum to 100", () => {
  const total = Object.values(KEYWORD_SCORE_WEIGHTS).reduce((sum, n) => sum + n, 0);
  assert.equal(total, 100);
});

test("C5: ordering — strong match well above weak and mismatch", () => {
  const strong = keywordScore(strongJob, profile);
  const weak = keywordScore(weakJob, profile);
  const mismatch = keywordScore(mismatchJob, profile);

  assert.ok(strong.matchScore >= 85, `strong was ${strong.matchScore}`);
  assert.ok(weak.matchScore <= 40, `weak was ${weak.matchScore}`);
  assert.ok(mismatch.matchScore <= 40, `mismatch was ${mismatch.matchScore}`);
  assert.ok(strong.matchScore > weak.matchScore);
  assert.ok(strong.matchScore > mismatch.matchScore);

  // The semantics the AI used to be trusted with: all four skills found.
  assert.deepEqual(strong.matchedSkills, [
    "React",
    "TypeScript",
    "Next.js",
    "Tailwind CSS",
  ]);
  assert.match(strong.matchReason, /4\/4 of your skills/);
  assert.ok(strong.matchReason.length <= 260);
});

test("C5: gap skills list posting tech the profile lacks", () => {
  const weak = keywordScore(weakJob, profile);
  assert.ok(weak.missingSkills.includes("Go"), JSON.stringify(weak.missingSkills));
  assert.ok(weak.missingSkills.includes("PostgreSQL"));
  assert.ok(weak.missingSkills.includes("Kubernetes"));

  // Strong job's stack is fully covered — no false gaps.
  const strong = keywordScore(strongJob, profile);
  assert.ok(!strong.missingSkills.includes("React"));
  assert.ok(!strong.missingSkills.includes("Next.js"));
});

test("skillInText: word boundaries and short-skill case rules", () => {
  // "Go" is short and mixed-case: prose verbs don't match, the language does.
  assert.equal(skillInText("We go the extra mile", "Go"), false);
  assert.equal(skillInText("services written in Go", "Go"), true);
  assert.equal(skillInText("services written in golang", "Go"), true);

  // "Java" must not collide with "JavaScript".
  assert.equal(skillInText("Build with JavaScript", "Java"), false);
  assert.equal(skillInText("Build with Java", "Java"), true);

  // All-upper acronyms accept any casing.
  assert.equal(skillInText("uses sql queries", "SQL"), true);
  assert.equal(skillInText("deploy on aws", "AWS"), true);

  // Separator spellings: Next.js ↔ nextjs, CI/CD ↔ cicd, Tailwind CSS ↔ tailwind-css.
  assert.equal(skillInText("experience with nextjs", "Next.js"), true);
  assert.equal(skillInText("strong cicd pipelines", "CI/CD"), true);
  assert.equal(skillInText("styling with tailwind-css", "Tailwind CSS"), true);

  // Compact matching stays off for separator-less skills: "net" ⊄ "network".
  assert.equal(skillInText("networking skills", ".net"), false);
  assert.equal(skillInText("experience with .NET", ".net"), true);
});

test("C5: seniority band distance — entry profile prefers the junior posting", () => {
  const entryProfile: ProfileScoreContext = { ...profile, experience_level: "Entry level" };
  const junior = keywordScore(
    makeJob({ source: "jsearch", externalId: "j", title: "Junior Software Engineer" }),
    entryProfile,
  );
  const senior = keywordScore(
    makeJob({ source: "jsearch", externalId: "s", title: "Senior Software Engineer" }),
    entryProfile,
  );
  assert.ok(junior.matchScore > senior.matchScore, `${junior.matchScore} !> ${senior.matchScore}`);
});

test("C5: an empty profile scores low with a thin-profile reason", () => {
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

  const score = keywordScore(strongJob, empty);
  assert.ok(score.matchScore <= 30, `empty profile scored ${score.matchScore}`);
  assert.match(score.matchReason, /too thin to score/);
  assert.deepEqual(score.matchedSkills, []);
});

test("C5: past job titles count as desired-title signal", () => {
  const workExperience = [
    {
      company: "Kora",
      title: "Frontend Engineer",
      start_date: "2021",
      end_date: null,
      is_current: false,
      responsibilities: "Shipped features.",
    },
  ];
  const job = makeJob({ source: "jsearch", externalId: "t", title: "Frontend Engineer" });

  const fromExperienceOnly = keywordScore(job, {
    ...profile,
    job_titles_seeking: null,
    work_experience: workExperience,
  });
  const noTitlesAtAll = keywordScore(job, {
    ...profile,
    job_titles_seeking: null,
    work_experience: null,
  });

  assert.ok(fromExperienceOnly.matchScore > noTitlesAtAll.matchScore);
});

test("C5: keywordScoreBatch namespaces ids like the AI results", () => {
  const batch = keywordScoreBatch(
    [strongJob, weakJob],
    profile,
  );
  const [first, second] = batch;
  assert.equal(batch.length, 2);
  assert.ok(first);
  assert.ok(second);
  assert.equal(first.jobId, "jsearch:strong");
  assert.equal(second.jobId, "jsearch:weak");
  assert.equal(first.matchScore, keywordScore(strongJob, profile).matchScore);
});

test("C5: reconcile overlays valid AI results on the baseline", () => {
  const baseline = keywordScoreBatch([strongJob, weakJob], profile);

  const reconciled = reconcileWithAiResults(baseline, {
    results: [
      {
        jobId: "jsearch:strong",
        matchScore: 91,
        matchReason: "AI reason for strong.",
        matchedSkills: ["React"],
        missingSkills: ["GraphQL"],
      },
      {
        jobId: "jsearch:weak",
        matchScore: 22,
        matchReason: "AI reason for weak.",
        matchedSkills: [],
        missingSkills: [],
      },
    ],
  });

  const [strong, weak] = reconciled;
  assert.ok(strong);
  assert.ok(weak);
  assert.equal(strong.matchScore, 91);
  assert.equal(strong.matchReason, "AI reason for strong.");
  assert.deepEqual(strong.matchedSkills, ["React"]);
  assert.equal(weak.matchScore, 22);
});

test("C5: malformed AI entries fall back to keyword scores — never zeros", () => {
  const baseline = keywordScoreBatch([strongJob, weakJob], profile);

  // No results at all.
  const untouched = reconcileWithAiResults(baseline, {});
  assert.deepEqual(untouched, baseline);

  // Out-of-range and wrong-type scores keep the baseline.
  const garbage = reconcileWithAiResults(baseline, {
    results: [
      { jobId: "jsearch:strong", matchScore: 150, matchReason: "bad", matchedSkills: [], missingSkills: [] },
      { jobId: "jsearch:weak", matchScore: "90", matchReason: "bad" },
    ],
  });
  assert.deepEqual(garbage, baseline);

  // A valid entry at the right index still lands via positional fallback even
  // when the jobId doesn't echo back (Gemini is told to return order).
  const positional = reconcileWithAiResults(baseline, {
    results: [
      { jobId: "typo", matchScore: 64, matchReason: "positional reason.", matchedSkills: [], missingSkills: [] },
    ],
  });
  const [posFirst, posSecond] = positional;
  assert.ok(posFirst);
  assert.ok(posSecond);
  assert.equal(posFirst.matchScore, 64);
  assert.equal(posFirst.matchReason, "positional reason.");
  assert.equal(posSecond.matchScore, baseline[1]?.matchScore);

  // Non-string reason / non-array skills fall back to the keyword wording.
  const partial = reconcileWithAiResults(baseline, {
    results: [
      {
        jobId: "jsearch:strong",
        matchScore: 88,
        matchReason: 42,
        matchedSkills: "React",
        missingSkills: null,
      },
    ],
  });
  const [partFirst] = partial;
  assert.ok(partFirst);
  assert.equal(partFirst.matchScore, 88);
  assert.equal(partFirst.matchReason, baseline[0]?.matchReason);
  assert.deepEqual(partFirst.matchedSkills, baseline[0]?.matchedSkills);
});
