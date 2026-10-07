import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_DASHBOARD_FILTERS,
  deriveJobLevels,
  filterDashboardJobs,
  isAiFocusListing,
  isRecentlyClosed,
  isRemoteListing,
  matchesJobType,
  matchesPostedWithin,
  matchesQuery,
  parseSalaryFloor,
  type DashboardFilters,
} from "../lib/dashboard-filters.ts";
import type { Job } from "../types/index.ts";

function job(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
    run_id: null,
    user_id: "user-1",
    source: "jsearch",
    source_url: null,
    external_apply_url: null,
    title: null,
    company: null,
    location: null,
    salary: null,
    job_type: null,
    about_role: null,
    responsibilities: [],
    requirements: [],
    nice_to_have: [],
    benefits: [],
    about_company: null,
    match_score: null,
    match_reason: null,
    matched_skills: [],
    missing_skills: [],
    cover_letter: null,
    tailored_resume_url: null,
    tailored_match_score: null,
    is_tailored: false,
    company_research: null,
    found_at: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

test("parseSalaryFloor reads ranges by their minimum", () => {
  assert.equal(parseSalaryFloor("$120,000 - $150,000"), 120);
  assert.equal(parseSalaryFloor("120,000 - 150,000 USD"), 120);
  assert.equal(parseSalaryFloor("$150k–$180k"), 150);
  assert.equal(parseSalaryFloor("£40,000 per year"), 40);
});

test("parseSalaryFloor annualises hourly rates at 2080 hours", () => {
  assert.equal(parseSalaryFloor("$80/hr"), 166);
  assert.equal(parseSalaryFloor("45 - 55 per hour"), 94);
  assert.equal(parseSalaryFloor("€60 an hour"), 125);
});

test("parseSalaryFloor rejects salary strings without figures", () => {
  assert.equal(parseSalaryFloor(null), null);
  assert.equal(parseSalaryFloor(""), null);
  assert.equal(parseSalaryFloor("Competitive"), null);
  assert.equal(parseSalaryFloor("Full Time"), null);
  assert.equal(parseSalaryFloor("Based on experience"), null);
});

test("isRemoteListing trusts location, job type and title", () => {
  assert.equal(isRemoteListing({ location: "Remote", job_type: null, title: "Engineer" }), true);
  assert.equal(isRemoteListing({ location: "US", job_type: "fulltime", title: "Remote Backend Engineer" }), true);
  assert.equal(isRemoteListing({ location: "New York, NY", job_type: "fulltime", title: "Frontend Engineer" }), false);
  assert.equal(isRemoteListing({ location: "London (Hybrid)", job_type: "fulltime", title: "Engineer" }), false);
});

test("isAiFocusListing recognises AI / ML roles from title, description and skills", () => {
  const ml = job({ title: "ML Engineer", requirements: ["PyTorch"], nice_to_have: ["LLM evaluation"] });
  const genai = job({ about_role: "Build generative AI features with our foundation models." });
  const plain = job({ title: "Frontend Engineer", requirements: ["React"] });

  assert.equal(isAiFocusListing(ml), true);
  assert.equal(isAiFocusListing(genai), true);
  assert.equal(isAiFocusListing(plain), false);
});

test("matchesJobType handles every provider spelling of full time", () => {
  for (const raw of ["fulltime", "FULLTIME", "Full Time", "full_time", "Permanent"]) {
    assert.equal(
      matchesJobType({ job_type: raw }, "fulltime"),
      true,
      `${raw} should be fulltime`,
    );
  }
  assert.equal(matchesJobType({ job_type: "contract" }, "fulltime"), false);
  assert.equal(matchesJobType({ job_type: null }, "fulltime"), false);
});

test("matchesJobType reads contract, part-time, internship and freelance variants", () => {
  for (const raw of ["CONTRACTOR", "contract", "Contract - 12 months", "freelance", "temporary"]) {
    assert.equal(matchesJobType({ job_type: raw }, "contract"), true, `${raw} should be contract`);
  }
  assert.equal(matchesJobType({ job_type: "part_time" }, "parttime"), true);
  assert.equal(matchesJobType({ job_type: "internship" }, "internship"), true);
  assert.equal(matchesJobType({ job_type: "Freelance" }, "freelance"), true);
  assert.equal(matchesJobType({ job_type: "fulltime" }, "contract"), false);
});

test("deriveJobLevels extracts seniority buckets from the title", () => {
  assert.deepEqual(deriveJobLevels("Senior Frontend Engineer"), ["senior"]);
  assert.deepEqual(deriveJobLevels("Principal ML Engineer"), ["principal"]);
  assert.deepEqual(deriveJobLevels("Staff Engineer"), ["staff"]);
  assert.deepEqual(deriveJobLevels("Engineering Director"), ["director"]);
  assert.deepEqual(deriveJobLevels("Vice President of Engineering"), ["executive"]);
  assert.deepEqual(deriveJobLevels("Software Engineer"), []);
  assert.deepEqual(deriveJobLevels(null), []);
});

test("matchesPostedWithin uses found_at windows relative to now", () => {
  const now = Date.parse("2026-10-07T00:00:00Z");
  const recent = { found_at: new Date(now - 12 * 60 * 60 * 1000).toISOString() };
  const yesterday = { found_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString() };
  const ancient = { found_at: "2026-09-01T00:00:00.000Z" };
  const garbage = { found_at: "not-a-date" };

  assert.equal(matchesPostedWithin(recent, "any", now), true);
  assert.equal(matchesPostedWithin(recent, "24h", now), true);
  assert.equal(matchesPostedWithin(yesterday, "24h", now), false);
  assert.equal(matchesPostedWithin(yesterday, "3d", now), true);
  assert.equal(matchesPostedWithin(ancient, "week", now), false);
  assert.equal(matchesPostedWithin(yesterday, "week", now), true);
  assert.equal(matchesPostedWithin(garbage, "24h", now), false);
});

test("isRecentlyClosed reports roles flagged closed (no closures recorded yet)", () => {
  const closed = { ...job({ id: "closed" }), closed_at: "2026-10-06T00:00:00.000Z" } as unknown as Job;
  assert.equal(isRecentlyClosed(closed), true);
  assert.equal(isRecentlyClosed(job({ id: "open" })), false);
});

test("matchesQuery searches title, company, skills and requirements", () => {
  const reactJob = job({
    title: "React Developer",
    company: "Acme",
    matched_skills: ["React"],
    requirements: ["TypeScript"],
  });

  assert.equal(matchesQuery(reactJob, "react"), true);
  assert.equal(matchesQuery(reactJob, "acme"), true);
  assert.equal(matchesQuery(reactJob, "typescript"), true);
  assert.equal(matchesQuery(reactJob, "  REACT  "), true);
  assert.equal(matchesQuery(reactJob, "zzz-not-there"), false);
  assert.equal(matchesQuery(reactJob, ""), true);
  assert.equal(matchesQuery(reactJob, "  "), true);
});

test("filterDashboardJobs composes every rule with AND semantics", () => {
  const high = job({
    id: "high",
    title: "Senior Frontend Engineer",
    company: "Acme",
    match_score: 85,
    job_type: "fulltime",
    location: "Remote, US",
    salary: "$150k - $180k",
    matched_skills: ["React"],
    requirements: ["TypeScript"],
  });
  const mid = job({
    id: "mid",
    title: "Backend Developer",
    company: "Beacon",
    match_score: 40,
    job_type: "contract",
    location: "London",
    salary: "£60,000 - £70,000",
  });
  const unscored = job({ id: "unscored", title: "Intern", company: "Corp" });
  const ml = job({
    id: "ml",
    title: "Mid Machine Learning Engineer",
    company: "Neural",
    match_score: 70,
    job_type: "fulltime",
    location: "Remote",
    salary: "$120k - $140k",
    about_role: "Train and deploy ML models.",
  });
  const all = [high, mid, unscored, ml];

  assert.deepEqual(
    filterDashboardJobs(all, DEFAULT_DASHBOARD_FILTERS).map((j) => j.id),
    ["high", "mid", "unscored", "ml"],
  );

  const threshold70: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, minScore: 70 };
  assert.deepEqual(filterDashboardJobs(all, threshold70).map((j) => j.id), ["high", "ml"]);

  const contractOnly: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, jobTypes: ["contract"] };
  assert.deepEqual(filterDashboardJobs(all, contractOnly).map((j) => j.id), ["mid"]);

  const multiType: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, jobTypes: ["contract", "fulltime"] };
  assert.deepEqual(filterDashboardJobs(all, multiType).map((j) => j.id), ["high", "mid", "ml"]);

  const salary60: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, salaryFloor: 60 };
  assert.deepEqual(filterDashboardJobs(all, salary60).map((j) => j.id), ["high", "mid", "ml"]);
  const salary150: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, salaryFloor: 150 };
  assert.deepEqual(filterDashboardJobs(all, salary150).map((j) => j.id), ["high"]);
  const salary200: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, salaryFloor: 200 };
  assert.deepEqual(filterDashboardJobs(all, salary200).map((j) => j.id), []);

  const remoteOnly: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, remoteOnly: true };
  assert.deepEqual(filterDashboardJobs(all, remoteOnly).map((j) => j.id), ["high", "ml"]);

  const aiFocus: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, aiFocus: true };
  assert.deepEqual(filterDashboardJobs(all, aiFocus).map((j) => j.id), ["ml"]);

  const seniorLevel: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, levels: ["senior"] };
  assert.deepEqual(filterDashboardJobs(all, seniorLevel).map((j) => j.id), ["high"]);

  const internLevel: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, levels: ["intern"] };
  assert.deepEqual(filterDashboardJobs(all, internLevel).map((j) => j.id), ["unscored"]);

  const london: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, location: "lon" };
  assert.deepEqual(filterDashboardJobs(all, london).map((j) => j.id), ["mid"]);

  const react: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, query: "react" };
  assert.deepEqual(filterDashboardJobs(all, react).map((j) => j.id), ["high"]);

  const combined: DashboardFilters = {
    ...DEFAULT_DASHBOARD_FILTERS,
    minScore: 50,
    remoteOnly: true,
    aiFocus: true,
    jobTypes: ["fulltime"],
    levels: ["mid"],
    location: "rem",
    salaryFloor: 100,
    query: "ml",
  };
  assert.deepEqual(filterDashboardJobs(all, combined).map((j) => j.id), ["ml"]);
});

test("filterDashboardJobs treats a null match_score as zero for the threshold", () => {
  const unscored = job({ id: "u", title: "Intern" });
  const lowScore = job({ id: "low", title: "Engineer", match_score: 2 });
  const threshold: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, minScore: 1 };
  assert.deepEqual(
    filterDashboardJobs([unscored, lowScore], threshold).map((j) => j.id),
    ["low"],
  );
});