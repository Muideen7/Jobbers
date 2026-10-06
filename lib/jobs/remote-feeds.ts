/**
 * Remote feed providers — RemoteOK, Remotive and Jobicy. Free, no key,
 * "Anywhere" jobs. context/job-search-expansion-plan.md (task A5).
 *
 * Endpoints & terms (all verified live 2026-10-06):
 * - RemoteOK  GET https://remoteok.com/api
 *   → array of jobs; element 0 is a { last_updated, legal } metadata object.
 *     Terms: link back to RemoteOK and mention "Remote OK" as the source.
 * - Remotive  GET https://remotive.com/api/remote-jobs
 *   → { "00-warning", "0-legal-notice", "job-count", "total-job-count", jobs[] }.
 *     Terms: link back to Remotive, mention it as source, do not redistribute
 *     to other job boards, ~4 GETs/day — the orchestrator enforces this with a
 *     6-hour per-source TTL + daily cap (A6).
 * - Jobicy    GET https://jobicy.com/api/v2/remote-jobs?count=100
 *   → { success, jobs[], jobCount, nextCursor, … }. `tag`/`count` params work
 *     but tag semantics are unreliable for free-text queries, so the feed is
 *     fetched plain and filtered locally. Terms: credit Jobicy with a link and
 *     keep apply buttons pointed at the feed's own job URL.
 *
 * All three lack a reliable server-side search → searchMode "client".
 * Shared code lives here rather than one file per feed: they are one layer.
 *
 * Relative imports (not "@/…") keep the module loadable under `node --test`.
 */

import { z } from "zod";

import type { JobHighlights, JobProvider, NormalizedJob } from "./types.ts";

const REMOTEOK_ENDPOINT = "https://remoteok.com/api";
const REMOTIVE_ENDPOINT = "https://remotive.com/api/remote-jobs";
const JOBICY_ENDPOINT = "https://jobicy.com/api/v2/remote-jobs?count=100";

const EMPTY_HIGHLIGHTS: JobHighlights = {
  responsibilities: [],
  requirements: [],
  benefits: [],
};

async function fetchJson(
  url: string,
  fetchImpl: typeof fetch,
  label: string,
): Promise<unknown> {
  const response = await fetchImpl(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${label} API error: HTTP ${response.status}`);
  }
  try {
    return await response.json();
  } catch {
    throw new Error(`${label} returned a response that was not valid JSON.`);
  }
}

// --- RemoteOK ---------------------------------------------------------------

const remoteokJobSchema = z.object({
  id: z.union([z.string(), z.number()]),
  date: z.string().nullish(),
  company: z.string(),
  position: z.string(),
  tags: z.array(z.string()).nullish(),
  description: z.string(),
  location: z.string().nullish(),
  apply_url: z.string().nullish(),
  salary_min: z.coerce.number().nullish(),
  salary_max: z.coerce.number().nullish(),
  url: z.string().nullish(),
});

export type RemoteokJob = z.infer<typeof remoteokJobSchema>;

const EMPLOYMENT_TAG = /full[\s-]?time|part[\s-]?time|contract|intern/i;

export function normalizeRemoteokJob(job: RemoteokJob): NormalizedJob {
  return {
    source: "remoteok",
    externalId: String(job.id),
    title: job.position,
    company: job.company,
    location: job.location ?? "Anywhere",
    description: job.description,
    applyUrl: job.apply_url || job.url || "",
    sourceUrl: job.url ?? "",
    salaryMin: job.salary_min ?? null,
    salaryMax: job.salary_max ?? null,
    salaryPeriod: null,
    salaryText: null,
    postedAt: job.date ?? null,
    employmentType: job.tags?.find((tag) => EMPLOYMENT_TAG.test(tag)) ?? null,
    remote: true,
    // RemoteOK tags are skills ("golang", "infosec"), not categories — no honest
    // category to show, so null and let the UI fall back.
    category: null,
    highlights: { ...EMPTY_HIGHLIGHTS },
  };
}

export function parseRemoteokResponse(payload: unknown): NormalizedJob[] {
  if (!Array.isArray(payload)) {
    throw new Error("RemoteOK returned an unexpected response shape");
  }

  const jobs: NormalizedJob[] = [];
  for (const entry of payload) {
    const parsed = remoteokJobSchema.safeParse(entry);
    if (parsed.success) {
      jobs.push(normalizeRemoteokJob(parsed.data));
    }
  }
  return jobs;
}

// --- Remotive ---------------------------------------------------------------

const remotiveJobSchema = z.object({
  id: z.union([z.string(), z.number()]),
  url: z.string(),
  title: z.string(),
  company_name: z.string(),
  category: z.string().nullish(),
  job_type: z.string().nullish(),
  publication_date: z.string().nullish(),
  candidate_required_location: z.string().nullish(),
  salary: z.string().nullish(),
  description: z.string(),
});

export type RemotiveJob = z.infer<typeof remotiveJobSchema>;

const remotiveResponseSchema = z.object({
  jobs: z.array(z.unknown()),
});

/**
 * publication_date arrives as a naive ISO datetime ("2026-10-05T05:15:43");
 * Remotive publishes in UTC, so assume Z rather than parse it in server-local
 * time (which would shift postedAt by the server's offset).
 */
function toIsoUtc(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return /Z$|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`;
}

export function normalizeRemotiveJob(job: RemotiveJob): NormalizedJob {
  return {
    source: "remotive",
    externalId: String(job.id),
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location ?? "Anywhere",
    description: job.description,
    applyUrl: job.url,
    sourceUrl: job.url,
    salaryMin: null,
    salaryMax: null,
    salaryPeriod: null,
    salaryText: job.salary ?? null,
    postedAt: toIsoUtc(job.publication_date),
    employmentType: job.job_type ?? null,
    remote: true,
    category: job.category ?? null,
    highlights: { ...EMPTY_HIGHLIGHTS },
  };
}

export function parseRemotiveResponse(payload: unknown): NormalizedJob[] {
  const wrapper = remotiveResponseSchema.safeParse(payload);
  if (!wrapper.success) {
    throw new Error("Remotive returned an unexpected response shape");
  }

  const jobs: NormalizedJob[] = [];
  for (const entry of wrapper.data.jobs) {
    const parsed = remotiveJobSchema.safeParse(entry);
    if (parsed.success) {
      jobs.push(normalizeRemotiveJob(parsed.data));
    }
  }
  return jobs;
}

// --- Jobicy -----------------------------------------------------------------

const jobicyJobSchema = z.object({
  id: z.union([z.string(), z.number()]),
  url: z.string(),
  jobTitle: z.string(),
  companyName: z.string(),
  jobType: z.array(z.string()).nullish(),
  jobIndustry: z.array(z.string()).nullish(),
  jobGeo: z.string().nullish(),
  pubDate: z.string().nullish(),
  jobExcerpt: z.string().nullish(),
  jobDescription: z.string().nullish(),
});

export type JobicyJob = z.infer<typeof jobicyJobSchema>;

const jobicyResponseSchema = z.object({
  success: z.boolean(),
  // Error payloads ship success:false with no jobs key — validate order below.
  jobs: z.array(z.unknown()).optional(),
});

export function normalizeJobicyJob(job: JobicyJob): NormalizedJob {
  return {
    source: "jobicy",
    externalId: String(job.id),
    title: job.jobTitle,
    company: job.companyName,
    location: job.jobGeo ?? "Anywhere",
    // Excerpt is the fallback when the feed omits the long description.
    description: job.jobDescription ?? job.jobExcerpt ?? "",
    applyUrl: job.url,
    sourceUrl: job.url,
    salaryMin: null,
    salaryMax: null,
    salaryPeriod: null,
    salaryText: null,
    postedAt: job.pubDate ?? null,
    employmentType: job.jobType?.[0] ?? null,
    remote: true,
    category: job.jobIndustry?.[0] ?? null,
    highlights: { ...EMPTY_HIGHLIGHTS },
  };
}

export function parseJobicyResponse(payload: unknown): NormalizedJob[] {
  const wrapper = jobicyResponseSchema.safeParse(payload);
  if (!wrapper.success) {
    throw new Error("Jobicy returned an unexpected response shape");
  }
  if (!wrapper.data.success) {
    throw new Error("Jobicy API reported an unsuccessful response.");
  }
  const entries = wrapper.data.jobs;
  if (!entries) {
    throw new Error("Jobicy returned an unexpected response shape");
  }

  const jobs: NormalizedJob[] = [];
  for (const entry of entries) {
    const parsed = jobicyJobSchema.safeParse(entry);
    if (parsed.success) {
      jobs.push(normalizeJobicyJob(parsed.data));
    }
  }
  return jobs;
}

// --- Providers --------------------------------------------------------------

type FeedConfig = {
  endpoint: string;
  label: string;
  parse: (payload: unknown) => NormalizedJob[];
};

function makeFeedProvider(
  id: "remoteok" | "remotive" | "jobicy",
  config: FeedConfig,
): JobProvider {
  return {
    id,
    searchMode: "client",
    // Takes no query param: feeds return the full catalogue and the
    // orchestrator applies the local token filter.
    async search(): Promise<NormalizedJob[]> {
      const payload = await fetchJson(config.endpoint, fetch, config.label);
      return config.parse(payload);
    },
  };
}

export const remoteokProvider = makeFeedProvider("remoteok", {
  endpoint: REMOTEOK_ENDPOINT,
  label: "RemoteOK",
  parse: parseRemoteokResponse,
});

export const remotiveProvider = makeFeedProvider("remotive", {
  endpoint: REMOTIVE_ENDPOINT,
  label: "Remotive",
  parse: parseRemotiveResponse,
});

export const jobicyProvider = makeFeedProvider("jobicy", {
  endpoint: JOBICY_ENDPOINT,
  label: "Jobicy",
  parse: parseJobicyResponse,
});
