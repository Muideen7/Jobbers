import assert from "node:assert/strict";
import { test } from "node:test";

import type { AdzunaJob } from "../lib/adzuna.ts";
import { normalizeAdzunaJob } from "../lib/jobs/adzuna.ts";
import { normalizeJsearchJob, parseJsearchResponse } from "../lib/jobs/jsearch.ts";
import type { NormalizedJob } from "../lib/jobs/types.ts";

/**
 * A1 acceptance: every provider's payload must collapse into the identical
 * NormalizedJob shape, so the matcher and the DB layer never branch on source.
 */

const adzunaFixture: AdzunaJob = {
  id: "4387585642",
  title: "Senior React Developer",
  company: { display_name: "SimVentions, Inc - Glassdoor ✪ 4.6" },
  location: { display_name: "Lagos, Nigeria" },
  description: "<p>Build dashboards for our fintech platform.</p>",
  redirect_url: "https://ss.adzuna.com/redirect/api/v4/job/4387585642",
  salary_min: 120000,
  salary_max: 160000,
  salary_is_predicted: "1",
  contract_type: "full_time",
  created: "2026-10-01T12:00:00Z",
  category: { tag: "it-jobs", label: "IT Jobs" },
};

// Shape mirrors the official OpenAPI example plus a job_highlights section:
// https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/jsearch.yaml
const jsearchJobFixture = {
  job_id: "woj2gE2S_6LqvmLAAAAAAA==",
  job_title: "Senior Developer",
  employer_name: "United Airlines",
  job_publisher: "United Airlines Jobs",
  job_apply_link: "https://careers.united.com/us/en/job/WHQ00024243/Senior-Developer",
  job_description: "We are looking for a senior developer to join our team.",
  job_location: "Chicago, IL",
  job_city: "Chicago",
  job_state: "Illinois",
  job_country: "US",
  job_min_salary: 300000,
  job_max_salary: 450000,
  job_salary_period: "YEAR",
  job_posted_at_datetime_utc: "2025-03-29T00:00:00.000Z",
  job_employment_types: ["FULLTIME"],
  job_is_remote: false,
  job_google_link: "https://www.google.com/search?q=jobs&gl=us#vhid=abc",
  job_highlights: {
    Qualifications: ["Bachelor's degree", "5+ years of experience"],
    Responsibilities: ["Design and implement applications"],
    Benefits: ["dental_coverage"],
    // Unknown sections must be ignored, not crash the mapping.
    "Company Info": ["Fortune 500 airline"],
  },
  // Extra fields the API returns — must be stripped, not break validation.
  employer_logo: "https://example.com/logo.png",
  apply_options: [{ publisher: "LinkedIn", apply_link: "https://linkedin.com/jobs/view/1" }],
};

test("Adzuna payload normalizes to the shared shape", () => {
  const job = normalizeAdzunaJob(adzunaFixture);

  assert.equal(job.source, "adzuna");
  assert.equal(job.externalId, "4387585642");
  assert.equal(job.title, "Senior React Developer");
  // Aggregator rating suffix must not leak into the company field.
  assert.equal(job.company, "SimVentions, Inc");
  assert.equal(job.location, "Lagos, Nigeria");
  assert.equal(job.description, "<p>Build dashboards for our fintech platform.</p>");
  assert.equal(job.applyUrl, adzunaFixture.redirect_url);
  assert.equal(job.sourceUrl, adzunaFixture.redirect_url);
  assert.equal(job.salaryMin, 120000);
  assert.equal(job.salaryMax, 160000);
  // Adzuna never states a period — it must be null, not an assumed YEAR.
  assert.equal(job.salaryPeriod, null);
  assert.equal(job.postedAt, "2026-10-01T12:00:00Z");
  assert.equal(job.employmentType, "full_time");
  assert.equal(job.remote, false);
  assert.deepEqual(job.highlights, {
    responsibilities: [],
    requirements: [],
    benefits: [],
  });
});

test("JSearch payload normalizes to the shared shape", () => {
  const jobs = parseJsearchResponse({
    status: "OK",
    request_id: "4f24fa29-a883-49f9-8dca-d0fede07203c",
    parameters: { query: "developer jobs in chicago", num_pages: 1, country: "us" },
    data: { jobs: [jsearchJobFixture] },
  });

  assert.equal(jobs.length, 1);
  const job = jobs[0]!;
  assert.equal(job.source, "jsearch");
  assert.equal(job.externalId, "woj2gE2S_6LqvmLAAAAAAA==");
  assert.equal(job.title, "Senior Developer");
  assert.equal(job.company, "United Airlines");
  assert.equal(job.location, "Chicago, IL");
  assert.equal(job.description, "We are looking for a senior developer to join our team.");
  assert.equal(job.applyUrl, jsearchJobFixture.job_apply_link);
  assert.equal(job.sourceUrl, jsearchJobFixture.job_google_link);
  assert.equal(job.salaryMin, 300000);
  assert.equal(job.salaryMax, 450000);
  assert.equal(job.salaryPeriod, "YEAR");
  assert.equal(job.postedAt, "2025-03-29T00:00:00.000Z");
  assert.equal(job.employmentType, "FULLTIME");
  assert.equal(job.remote, false);
  assert.deepEqual(job.highlights, {
    responsibilities: ["Design and implement applications"],
    requirements: ["Bachelor's degree", "5+ years of experience"],
    benefits: ["dental_coverage"],
  });
});

test("both providers emit byte-identical key sets", () => {
  const adzunaKeys = Object.keys(normalizeAdzunaJob(adzunaFixture)).sort();
  const jsearchKeys = Object.keys(normalizeJsearchJob(jsearchJobFixture)).sort();

  assert.deepEqual(adzunaKeys, jsearchKeys);
});

test("every normalized value is a primitive or a known object shape", () => {
  const normalized: NormalizedJob[] = [
    normalizeAdzunaJob(adzunaFixture),
    normalizeJsearchJob(jsearchJobFixture),
  ];

  for (const job of normalized) {
    assert.equal(typeof job.source, "string");
    assert.equal(typeof job.externalId, "string");
    assert.equal(typeof job.title, "string");
    assert.equal(typeof job.company, "string");
    assert.equal(typeof job.location, "string");
    assert.equal(typeof job.description, "string");
    assert.equal(typeof job.applyUrl, "string");
    assert.equal(typeof job.sourceUrl, "string");
    assert.equal(typeof job.remote, "boolean");
    for (const salary of [job.salaryMin, job.salaryMax]) {
      assert.ok(salary === null || typeof salary === "number");
    }
    for (const scalar of [job.salaryPeriod, job.postedAt, job.employmentType]) {
      assert.ok(scalar === null || typeof scalar === "string");
    }
    assert.ok(Array.isArray(job.highlights.responsibilities));
    assert.ok(Array.isArray(job.highlights.requirements));
    assert.ok(Array.isArray(job.highlights.benefits));
  }
});

test("remote JSearch posting with no location survives with empty location", () => {
  const job = normalizeJsearchJob({
    job_id: "remote-1",
    job_title: "Node.js Engineer",
    employer_name: "Anywhere Labs",
    job_apply_link: "https://example.com/apply",
    job_location: null,
    job_city: null,
    job_state: null,
    job_country: null,
    job_is_remote: true,
    job_highlights: null,
  });

  assert.equal(job.location, "");
  assert.equal(job.remote, true);
  assert.equal(job.salaryMin, null);
  assert.deepEqual(job.highlights, {
    responsibilities: [],
    requirements: [],
    benefits: [],
  });
});

test("malformed JSearch job entries are skipped, valid ones survive", () => {
  const jobs = parseJsearchResponse({
    status: "OK",
    data: {
      jobs: [
        { job_id: "no-title-only" },
        "not an object",
        jsearchJobFixture,
      ],
    },
  });

  assert.equal(jobs.length, 1);
  assert.equal(jobs[0]!.externalId, "woj2gE2S_6LqvmLAAAAAAA==");
});

test("a payload without data.jobs throws a typed shape error", () => {
  assert.throws(
    () => parseJsearchResponse({ status: "OK", data: {} }),
    /unexpected response shape/,
  );
  assert.throws(() => parseJsearchResponse(null), /unexpected response shape/);
  assert.throws(() => parseJsearchResponse([1, 2, 3]), /unexpected response shape/);
});
