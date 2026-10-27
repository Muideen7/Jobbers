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

const GERMAN_GENDER_PATTERNS = [
  /\((m|w|d)\/(m|w|d)\/(m|w|d)\)/i,
  /\b(m\/w\/d|d\/m\/w|w\/m\/d)\b/i,
  /\[(m|w|d)\/(m|w|d)\/(m|w|d)\]/i,
];

const GERMAN_INDICATOR_WORDS = [
  /\bmitarbeiter(in)?\b/i,
  /\bkundenbetreuung\b/i,
  /\bsachbearbeiter(in)?\b/i,
  /\bwerkstudent(in)?\b/i,
  /\bpraktikant(in)?\b/i,
  /\bfachkraft\b/i,
  /\bassistenz\b/i,
  /\bbuchhalter(in)?\b/i,
  /\bvertrieb\b/i,
  /\bentwickler(in)?\b/i,
  /\bvollzeit\b/i,
  /\bteilzeit\b/i,
  /\bin der\b/i,
  /\büber uns\b/i,
  /\bwir bieten\b/i,
  /\bihr profil\b/i,
];

export function isLikelyGermanJob(title: string, description?: string | null): boolean {
  for (const re of GERMAN_GENDER_PATTERNS) {
    if (re.test(title)) return true;
    if (description && re.test(description)) return true;
  }
  for (const re of GERMAN_INDICATOR_WORDS) {
    if (re.test(title)) return true;
  }
  return false;
}

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

export function parseArbeitnowResponse(
  payload: unknown,
  options: { filterGerman?: boolean } = {},
): NormalizedJob[] {
  const { filterGerman = false } = options;
  const wrapper = arbeitnowResponseSchema.safeParse(payload);
  if (!wrapper.success) {
    throw new Error("Arbeitnow returned an unexpected response shape");
  }

  const jobs: NormalizedJob[] = [];
  for (const entry of wrapper.data.data) {
    const parsed = arbeitnowJobSchema.safeParse(entry);
    if (parsed.success) {
      if (filterGerman && isLikelyGermanJob(parsed.data.title, parsed.data.description)) {
        continue;
      }
      jobs.push(normalizeArbeitnowJob(parsed.data));
    }
  }
  return jobs;
}

export async function searchArbeitnow(
  _query: JobSearchQuery,
  options: { fetchImpl?: typeof fetch; filterGerman?: boolean } = {},
): Promise<NormalizedJob[]> {
  const { fetchImpl = fetch, filterGerman = true } = options;
  const response = await fetchImpl(ARBEITNOW_ENDPOINT, {
    cache: "no-store",
    headers: {
      "User-Agent": "Jobbers/1.0 (Mozilla/5.0; https://jobbers.match)",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Arbeitnow API error: HTTP ${response.status}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Arbeitnow returned a response that was not valid JSON.");
  }

  return parseArbeitnowResponse(payload, { filterGerman });
}

export const arbeitnowProvider: JobProvider = {
  id: "arbeitnow",
  searchMode: "client",
  search(query: JobSearchQuery): Promise<NormalizedJob[]> {
    return searchArbeitnow(query);
  },
};
