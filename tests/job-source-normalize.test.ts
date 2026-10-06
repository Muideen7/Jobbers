import assert from "node:assert/strict";
import { test } from "node:test";

import type { AdzunaJob } from "../lib/adzuna.ts";
import { normalizeAdzunaJob } from "../lib/jobs/adzuna.ts";
import {
  normalizeArbeitnowJob,
  parseArbeitnowResponse,
} from "../lib/jobs/arbeitnow.ts";
import { normalizeJsearchJob, parseJsearchResponse } from "../lib/jobs/jsearch.ts";
import {
  normalizeJobicyJob,
  normalizeRemoteokJob,
  normalizeRemotiveJob,
  parseJobicyResponse,
  parseRemoteokResponse,
  parseRemotiveResponse,
} from "../lib/jobs/remote-feeds.ts";
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
  job_function: "frontend",
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

// Shape mirrors the live payload from https://www.arbeitnow.com/api/job-board-api
const arbeitnowFixture = {
  slug: "senior-software-developer-dortmund-389547",
  company_name: "Loopario",
  title: "(Senior) Software Developer (m/w/d)",
  description: "<p>Build logistics software with .NET Core.</p>",
  remote: false,
  url: "https://www.arbeitnow.com/jobs/companies/loopario/senior-software-developer-dortmund-389547",
  tags: ["Software Development"],
  job_types: ["Full Time"],
  location: "Dortmund",
  created_at: 1791291662,
};

// Shape mirrors the live payload from https://remoteok.com/api
const remoteokFixture = {
  id: "1137465",
  epoch: 1791205202,
  date: "2026-10-05T13:00:02+00:00",
  company: "RedMimicry",
  position: "Platform and Integration Engineer Security Telemetry",
  tags: ["golang", "infosec", "part time"],
  description: "Build telemetry pipelines.<br/>",
  location: "Germany",
  apply_url: "https://redmimicry.example/careers/1137465",
  salary_min: 53000,
  salary_max: 59000,
  url: "https://remoteok.com/jobs/1137465",
};

// Shape mirrors the live payload from https://remotive.com/api/remote-jobs
const remotiveFixture = {
  id: 2091149,
  url: "https://remotive.com/remote-jobs/software-development/software-engineer-2091149",
  title: "Software Engineer / AI Code Trainer",
  company_name: "CodeForAI",
  category: "Software Development",
  job_type: "contract",
  publication_date: "2026-10-05T05:15:43",
  candidate_required_location: "USA, UK, India",
  salary: "$45-$120/Hour",
  description: "<div>Who should apply…</div>",
};

// Shape mirrors the live payload from https://jobicy.com/api/v2/remote-jobs
const jobicyFixture = {
  id: 154681,
  url: "https://jobicy.com/jobs/154681-senior-information-security-engineer",
  jobSlug: "154681-senior-information-security-engineer",
  jobTitle: "Senior Information Security Engineer",
  companyName: "Five9",
  jobIndustry: ["Cybersecurity"],
  jobType: ["Full-Time"],
  jobGeo: "Portugal",
  jobLevel: "Director",
  jobExcerpt: "Join us in bringing joy to customer experience…",
  jobDescription: "<p>Join us in bringing joy to customer experience.</p>",
  pubDate: "2026-10-06T06:08:56+00:00",
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
  assert.equal(job.category, "IT Jobs");
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
  assert.equal(job.category, "frontend");
  assert.deepEqual(job.highlights, {
    responsibilities: ["Design and implement applications"],
    requirements: ["Bachelor's degree", "5+ years of experience"],
    benefits: ["dental_coverage"],
  });
});

test("both providers emit byte-identical key sets", () => {
  const adzunaKeys = Object.keys(normalizeAdzunaJob(adzunaFixture)).sort();

  // Every source added later must produce the exact same NormalizedJob shape.
  const normalized: NormalizedJob[] = [
    normalizeJsearchJob(jsearchJobFixture),
    normalizeArbeitnowJob(arbeitnowFixture),
    normalizeRemoteokJob(remoteokFixture),
    normalizeRemotiveJob(remotiveFixture),
    normalizeJobicyJob(jobicyFixture),
  ];

  for (const job of normalized) {
    assert.deepEqual(Object.keys(job).sort(), adzunaKeys, `shape drift in source: ${job.source}`);
  }
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
    for (const scalar of [
      job.salaryPeriod,
      job.salaryText,
      job.postedAt,
      job.employmentType,
      job.category,
    ]) {
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

test("Arbeitnow payload normalizes with ISO postedAt from unix seconds", () => {
  const jobs = parseArbeitnowResponse({ data: [arbeitnowFixture], meta: { per_page: 325 } });
  assert.equal(jobs.length, 1);

  const job = jobs[0]!;
  assert.equal(job.source, "arbeitnow");
  assert.equal(job.externalId, "senior-software-developer-dortmund-389547");
  assert.equal(job.company, "Loopario");
  assert.equal(job.location, "Dortmund");
  assert.equal(job.applyUrl, arbeitnowFixture.url);
  assert.equal(job.postedAt, new Date(1791291662 * 1000).toISOString());
  assert.equal(job.employmentType, "Full Time");
  assert.equal(job.remote, false);
  // First tag doubles as the category shown on public cards.
  assert.equal(job.category, "Software Development");
  // Arbeitnow publishes no salary figures — all three salary fields stay null.
  assert.equal(job.salaryMin, null);
  assert.equal(job.salaryMax, null);
  assert.equal(job.salaryText, null);
});

test("RemoteOK metadata element is skipped, jobs normalize with remote flags", () => {
  const payload = [
    { last_updated: 1791205202, legal: "Please link back to Remote OK…" },
    remoteokFixture,
  ];
  const jobs = parseRemoteokResponse(payload);
  assert.equal(jobs.length, 1);

  const job = jobs[0]!;
  assert.equal(job.source, "remoteok");
  assert.equal(job.externalId, "1137465");
  assert.equal(job.title, "Platform and Integration Engineer Security Telemetry");
  // apply_url is the real application link; url is the board listing.
  assert.equal(job.applyUrl, remoteokFixture.apply_url);
  assert.equal(job.sourceUrl, remoteokFixture.url);
  assert.equal(job.remote, true);
  // Employment type is recovered from free-text tags.
  assert.equal(job.employmentType, "part time");
  assert.equal(job.salaryMin, 53000);
  assert.equal(job.salaryText, null);
  // RemoteOK tags are skills, not categories — null so the UI falls back.
  assert.equal(job.category, null);
  assert.throws(() => parseRemoteokResponse({ jobs: [] }), /unexpected response shape/);
});

test("Remotive keeps native salary text and treats naive dates as UTC", () => {
  const jobs = parseRemotiveResponse({
    "00-warning": "Use remotive.com",
    "job-count": 18,
    jobs: [remotiveFixture],
  });
  assert.equal(jobs.length, 1);

  const job = jobs[0]!;
  assert.equal(job.source, "remotive");
  assert.equal(job.externalId, "2091149");
  assert.equal(job.salaryText, "$45-$120/Hour");
  assert.equal(job.salaryMin, null);
  // publication_date has no timezone — must not be parsed in server-local time.
  assert.equal(job.postedAt, "2026-10-05T05:15:43Z");
  assert.equal(job.location, "USA, UK, India");
  assert.equal(job.employmentType, "contract");
  assert.equal(job.remote, true);
  assert.equal(job.category, "Software Development");
});

test("Jobicy normalizes and falls back to the excerpt without full description", () => {
  const jobs = parseJobicyResponse({ success: true, jobs: [jobicyFixture, { id: "broken" }] });
  assert.equal(jobs.length, 1);

  const job = jobs[0]!;
  assert.equal(job.source, "jobicy");
  assert.equal(job.externalId, "154681");
  assert.equal(job.title, "Senior Information Security Engineer");
  assert.equal(job.location, "Portugal");
  assert.equal(job.employmentType, "Full-Time");
  assert.equal(job.description, "<p>Join us in bringing joy to customer experience.</p>");
  assert.equal(job.category, "Cybersecurity");

  const excerptOnly = normalizeJobicyJob({
    id: 1,
    url: "https://jobicy.com/jobs/1-x",
    jobTitle: "X",
    companyName: "Y",
    jobExcerpt: "Short excerpt…",
  });
  assert.equal(excerptOnly.description, "Short excerpt…");

  assert.throws(
    () => parseJobicyResponse({ success: false, error: "bad params" }),
    /unsuccessful/,
  );
});
