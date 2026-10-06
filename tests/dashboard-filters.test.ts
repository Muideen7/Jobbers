import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_DASHBOARD_FILTERS,
  filterDashboardJobs,
  isRemoteListing,
  matchesJobType,
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
  assert.equal(
    isRemoteListing({ location: "Remote", job_type: null, title: "Engineer" }),
    true,
  );
  assert.equal(
    isRemoteListing({ location: "US", job_type: "fulltime", title: "Remote Backend Engineer" }),
    true,
  );
  assert.equal(
    isRemoteListing({ location: "New York, NY", job_type: "fulltime", title: "Frontend Engineer" }),
    false,
  );
  assert.equal(
    isRemoteListing({ location: "London (Hybrid)", job_type: "fulltime", title: "Engineer" }),
    false,
  );
});

test("matchesJobType handles every provider spelling of full time", () => {
  for (const raw of ["fulltime", "FULLTIME", "Full Time", "full_time", "Permanent"]) {
    assert.equal(
      matchesJobType({ job_type: raw, location: null, title: "Engineer" }, "fulltime"),
      true,
      `${raw} should be fulltime`,
    );
  }
  assert.equal(matchesJobType({ job_type: "contract", location: null, title: "E" }, "fulltime"), false);
  assert.equal(matchesJobType({ job_type: null, location: null, title: "E" }, "fulltime"), false);
});

test("matchesJobType reads contract and remote variants", () => {
  for (const raw of ["CONTRACTOR", "contract", "Contract - 12 months", "freelance", "temporary"]) {
    assert.equal(
      matchesJobType({ job_type: raw, location: null, title: "Engineer" }, "contract"),
      true,
      `${raw} should be contract`,
    );
  }
  assert.equal(matchesJobType({ job_type: "fulltime", location: null, title: "E" }, "contract"), false);
  assert.equal(
    matchesJobType({ job_type: "fulltime", location: "Remote", title: "E" }, "remote"),
    true,
  );
  assert.equal(
    matchesJobType({ job_type: "fulltime", location: "Berlin", title: "E" }, "remote"),
    false,
  );
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
  const all = [high, mid, unscored];

  assert.deepEqual(
    filterDashboardJobs(all, DEFAULT_DASHBOARD_FILTERS).map((j) => j.id),
    ["high", "mid", "unscored"],
  );

  const threshold70: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, minScore: 70 };
  assert.deepEqual(filterDashboardJobs(all, threshold70).map((j) => j.id), ["high"]);

  const contractOnly: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, jobType: "contract" };
  assert.deepEqual(filterDashboardJobs(all, contractOnly).map((j) => j.id), ["mid"]);

  const salary150: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, salaryFloor: 100 };
  assert.deepEqual(filterDashboardJobs(all, salary150).map((j) => j.id), ["high"]);

  const london: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, location: "lon" };
  assert.deepEqual(filterDashboardJobs(all, london).map((j) => j.id), ["mid"]);

  const react: DashboardFilters = { ...DEFAULT_DASHBOARD_FILTERS, query: "react" };
  assert.deepEqual(filterDashboardJobs(all, react).map((j) => j.id), ["high"]);

  const combined: DashboardFilters = {
    ...DEFAULT_DASHBOARD_FILTERS,
    minScore: 50,
    jobType: "fulltime",
    location: "rem",
    salaryFloor: 100,
    query: "frontend",
  };
  assert.deepEqual(filterDashboardJobs(all, combined).map((j) => j.id), ["high"]);
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