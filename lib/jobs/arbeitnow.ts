/**
 * Arbeitnow provider — free, no-key job board API aggregating ATS-direct
 * postings (Greenhouse, SmartRecruiters, Teamtailor, Recruitee, Comeet, Join).
 * context/job-search-expansion-plan.md (task A4).
 *
 * Endpoint: GET https://www.arbeitnow.com/api/job-board-api
 * Docs:     https://www.arbeitnow.com/blog/job-board-api
 * Terms:    "free public API, please do not abuse" — 325 jobs/page, hourly
 *           updates, ?page= pagination; linking back to arbeitnow.com appreciated.
 *           The orchestrator caches results for 30 minutes (A6).
 *
 * No server-side search: the full feed comes back and the orchestrator applies
 * the local token filter (provider searchMode = "client").
 *
 * Relative imports (not "@/…") keep the module loadable under `node --test`.
 */

import { z } from "zod";

import type { JobProvider, JobSearchQuery, NormalizedJob } from "./types.ts";

const ARBEITNOW_ENDPOINT = "https://www.arbeitnow.com/api/job-board-api";

const arbeitnowJobSchema = z.object({
  slug: z.string(),
  company_name: z.string(),
  title: z.string(),
  description: z.string(),
  remote: z.boolean().nullish(),
  url: z.string(),
  tags: z.array(z.string()).nullish(),
  job_types: z.array(z.string()).nullish(),
  location: z.string().nullish(),
  created_at: z.coerce.number().nullish(),
});

const arbeitnowResponseSchema = z.object({
  data: z.array(z.unknown()),
});

export type ArbeitnowJob = z.infer<typeof arbeitnowJobSchema>;

export function normalizeArbeitnowJob(job: ArbeitnowJob): NormalizedJob {
  return {
    source: "arbeitnow",
    externalId: job.slug,
    title: job.title,
    company: job.company_name,
    location: job.location ?? "",
    description: job.description,
    applyUrl: job.url,
    sourceUrl: job.url,
    salaryMin: null,
    salaryMax: null,
    salaryPeriod: null,
    salaryText: null,
    // API returns unix seconds and promises hourly refreshes.
    postedAt: job.created_at != null ? new Date(job.created_at * 1000).toISOString() : null,
    employmentType: job.job_types?.[0] ?? null,
    remote: job.remote ?? false,
    category: job.tags?.[0] ?? null,
    highlights: { responsibilities: [], requirements: [], benefits: [] },
  };
}

export function parseArbeitnowResponse(payload: unknown): NormalizedJob[] {
  const wrapper = arbeitnowResponseSchema.safeParse(payload);
  if (!wrapper.success) {
    throw new Error("Arbeitnow returned an unexpected response shape");
  }

  const jobs: NormalizedJob[] = [];
  for (const entry of wrapper.data.data) {
    const parsed = arbeitnowJobSchema.safeParse(entry);
    if (parsed.success) {
      jobs.push(normalizeArbeitnowJob(parsed.data));
    }
  }
  return jobs;
}

export async function searchArbeitnow(
  _query: JobSearchQuery,
  options: { fetchImpl?: typeof fetch } = {},
): Promise<NormalizedJob[]> {
  const { fetchImpl = fetch } = options;
  const response = await fetchImpl(ARBEITNOW_ENDPOINT, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Arbeitnow API error: HTTP ${response.status}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Arbeitnow returned a response that was not valid JSON.");
  }

  return parseArbeitnowResponse(payload);
}

export const arbeitnowProvider: JobProvider = {
  id: "arbeitnow",
  searchMode: "client",
  search(query: JobSearchQuery): Promise<NormalizedJob[]> {
    return searchArbeitnow(query);
  },
};
