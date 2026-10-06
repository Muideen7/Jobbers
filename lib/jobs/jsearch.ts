/**
 * JSearch provider (OpenWeb Ninja) — global discovery via Google for Jobs.
 * context/job-search-expansion-plan.md (task A3) and context/library-docs.md.
 *
 * Docs:  https://www.openwebninja.com/api/jsearch/llms.txt
 * Spec:  https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/jsearch.yaml
 * Free:  200 requests/month, 1000/hour, no card — each request may return up to
 *        num_pages × 10 jobs, so every search must be cached (see A6).
 *
 * Relative imports (not "@/…") keep the module loadable under `node --test`,
 * which does not resolve the Next.js path alias.
 */

import { z } from "zod";

import type { JobHighlights, JobProvider, JobSearchQuery, NormalizedJob } from "./types.ts";

const JSEARCH_ENDPOINT = "https://api.openwebninja.com/jsearch/search-v2";
const DEFAULT_COUNTRY = "us";
const DEFAULT_NUM_PAGES = 1;
const MAX_NUM_PAGES = 20;

/**
 * Only the fields NormalizedJob consumes are typed strictly. job_highlights is
 * validated at map time instead of schema time so one malformed highlights
 * object never drops an otherwise valid posting. Extra fields returned by the
 * API (logos, apply_options, reviews, …) are stripped by zod.
 */
const jsearchJobSchema = z.object({
  job_id: z.string(),
  job_title: z.string(),
  employer_name: z.string(),
  job_apply_link: z.string(),
  job_description: z.string().nullish(),
  job_location: z.string().nullish(),
  job_city: z.string().nullish(),
  job_state: z.string().nullish(),
  job_country: z.string().nullish(),
  job_min_salary: z.coerce.number().nullish(),
  job_max_salary: z.coerce.number().nullish(),
  job_salary_period: z.string().nullish(),
  job_posted_at_datetime_utc: z.string().nullish(),
  job_employment_type: z.string().nullish(),
  job_employment_types: z.array(z.string()).nullish(),
  job_is_remote: z.boolean().nullish(),
  job_google_link: z.string().nullish(),
  // .optional() is required: plain z.unknown() rejects *missing* keys in zod v4,
  // and many real postings ship without job_highlights.
  job_highlights: z.unknown().optional(),
});

const jsearchResponseSchema = z.object({
  status: z.string(),
  data: z.object({
    jobs: z.array(z.unknown()),
  }),
});

export type JsearchJob = z.infer<typeof jsearchJobSchema>;

export type JsearchSearchOptions = {
  /** 1–20 pages of ~10 jobs. Each page consumes one of the 200 monthly credits. */
  numPages?: number;
  /** Injection seam for tests. */
  fetchImpl?: typeof fetch;
};

function clampNumPages(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_NUM_PAGES;
  }
  return Math.min(MAX_NUM_PAGES, Math.max(1, Math.trunc(value)));
}

/**
 * Google for Jobs matches best when the location lives inside the query string,
 * e.g. "developer jobs in chicago" — mirroring the endpoint's own examples.
 */
export function buildJsearchParams(
  query: JobSearchQuery,
  numPages: number = DEFAULT_NUM_PAGES,
): URLSearchParams {
  const title = query.title.trim();
  const location = query.location.trim();
  const country = query.country.trim().toLowerCase() || DEFAULT_COUNTRY;

  return new URLSearchParams({
    query: location ? `${title} jobs in ${location}` : `${title} jobs`,
    country,
    num_pages: String(clampNumPages(numPages)),
  });
}

function pickHighlights(entries: unknown): string[] {
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries.filter((entry): entry is string => typeof entry === "string");
}

/**
 * Keys "typically" are Qualifications / Responsibilities / Benefits but Google
 * listings vary, so match on substrings and ignore unknown sections.
 */
function toHighlights(raw: unknown): JobHighlights {
  const highlights: JobHighlights = {
    responsibilities: [],
    requirements: [],
    benefits: [],
  };

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return highlights;
  }

  for (const [key, value] of Object.entries(raw)) {
    const bullets = pickHighlights(value);
    if (bullets.length === 0) {
      continue;
    }

    const section = key.toLowerCase();
    if (section.includes("responsib")) {
      highlights.responsibilities.push(...bullets);
    } else if (section.includes("qualification") || section.includes("requirement")) {
      highlights.requirements.push(...bullets);
    } else if (section.includes("benefit")) {
      highlights.benefits.push(...bullets);
    }
  }

  return highlights;
}

function buildLocation(job: JsearchJob): string {
  if (job.job_location) {
    return job.job_location;
  }
  return [job.job_city, job.job_state, job.job_country]
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

export function normalizeJsearchJob(job: JsearchJob): NormalizedJob {
  return {
    source: "jsearch",
    externalId: job.job_id,
    title: job.job_title,
    company: job.employer_name,
    location: buildLocation(job),
    description: job.job_description ?? "",
    applyUrl: job.job_apply_link,
    sourceUrl: job.job_google_link ?? job.job_apply_link,
    salaryMin: job.job_min_salary ?? null,
    salaryMax: job.job_max_salary ?? null,
    salaryPeriod: job.job_salary_period ?? null,
    postedAt: job.job_posted_at_datetime_utc ?? null,
    employmentType: job.job_employment_types?.[0] ?? job.job_employment_type ?? null,
    remote: job.job_is_remote ?? false,
    highlights: toHighlights(job.job_highlights),
  };
}

/**
 * Wraps the validated payload, skipping individual postings that fail schema
 * validation instead of rejecting the whole page.
 */
export function parseJsearchResponse(payload: unknown): NormalizedJob[] {
  const wrapper = jsearchResponseSchema.safeParse(payload);

  if (!wrapper.success) {
    throw new Error("JSearch returned an unexpected response shape");
  }

  const jobs: NormalizedJob[] = [];
  for (const entry of wrapper.data.data.jobs) {
    const parsed = jsearchJobSchema.safeParse(entry);
    if (parsed.success) {
      jobs.push(normalizeJsearchJob(parsed.data));
    }
  }
  return jobs;
}

function httpErrorMessage(status: number): string {
  if (status === 401 || status === 403) {
    return `JSearch rejected the API key (HTTP ${status}) — check JSEARCH_API_KEY in .env.local.`;
  }
  if (status === 429) {
    return "JSearch rate limit or monthly quota exhausted (HTTP 429) — cached results keep serving until it resets.";
  }
  return `JSearch API error: HTTP ${status}`;
}

export async function searchJsearch(
  query: JobSearchQuery,
  options: JsearchSearchOptions = {},
): Promise<NormalizedJob[]> {
  const apiKey = process.env.JSEARCH_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "JSEARCH_API_KEY is not set. Get a free key at https://app.openwebninja.com/api/jsearch and add it to .env.local.",
    );
  }

  const { numPages = DEFAULT_NUM_PAGES, fetchImpl = fetch } = options;
  const params = buildJsearchParams(query, numPages);

  const response = await fetchImpl(`${JSEARCH_ENDPOINT}?${params}`, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(httpErrorMessage(response.status));
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("JSearch returned a response that was not valid JSON.");
  }

  return parseJsearchResponse(payload);
}

export const jsearchProvider: JobProvider = {
  id: "jsearch",
  search(query: JobSearchQuery): Promise<NormalizedJob[]> {
    return searchJsearch(query);
  },
};
