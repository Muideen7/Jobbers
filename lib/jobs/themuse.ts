/**
 * The Muse provider — free, keyless public job search API.
 * Aggregates postings across all industries: Tech, Healthcare, Business & Strategy,
 * Design, Finance, Human Resources, Marketing, Operations, Sales, Customer Service.
 *
 * Endpoint: GET https://www.themuse.com/api/public/jobs?page=1
 * Docs:     https://www.themuse.com/developers/api/v2
 * Terms:    Free public API, pagination via ?page=
 *
 * Relative imports keep the module loadable under `node --test`.
 */

import { z } from "zod";
import type { JobProvider, JobSearchQuery, NormalizedJob } from "./types.ts";

const THEMUSE_ENDPOINT = "https://www.themuse.com/api/public/jobs";

const museLocationSchema = z.object({
  name: z.string(),
});

const museCategorySchema = z.object({
  name: z.string(),
});

const museJobSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  type: z.string().nullish(),
  publication_date: z.string().nullish(),
  company: z.object({
    name: z.string(),
  }).nullish(),
  locations: z.array(museLocationSchema).nullish(),
  categories: z.array(museCategorySchema).nullish(),
  contents: z.string().nullish(),
  refs: z.object({
    landing_page: z.string(),
  }).nullish(),
});

const museResponseSchema = z.object({
  results: z.array(z.unknown()),
});

export type MuseJob = z.infer<typeof museJobSchema>;

export function normalizeMuseJob(job: MuseJob): NormalizedJob {
  const primaryLocation = job.locations?.[0]?.name ?? "Flexible / Remote";
  const isRemote =
    primaryLocation.toLowerCase().includes("remote") ||
    primaryLocation.toLowerCase().includes("flexible") ||
    (job.name ? job.name.toLowerCase().includes("remote") : false);

  return {
    source: "themuse",
    externalId: String(job.id),
    title: job.name,
    company: job.company?.name ?? "Company",
    location: primaryLocation,
    description: job.contents ?? "",
    applyUrl: job.refs?.landing_page ?? `https://www.themuse.com/jobs/${job.id}`,
    sourceUrl: job.refs?.landing_page ?? `https://www.themuse.com/jobs/${job.id}`,
    salaryMin: null,
    salaryMax: null,
    salaryPeriod: null,
    salaryText: null,
    postedAt: job.publication_date ?? null,
    employmentType: job.type ?? "fulltime",
    remote: isRemote,
    category: job.categories?.[0]?.name ?? null,
    highlights: { responsibilities: [], requirements: [], benefits: [] },
  };
}

export function parseMuseResponse(payload: unknown): NormalizedJob[] {
  const wrapper = museResponseSchema.safeParse(payload);
  if (!wrapper.success) {
    throw new Error("The Muse API returned an unexpected response shape");
  }

  const jobs: NormalizedJob[] = [];
  for (const entry of wrapper.data.results) {
    const parsed = museJobSchema.safeParse(entry);
    if (parsed.success) {
      jobs.push(normalizeMuseJob(parsed.data));
    }
  }
  return jobs;
}

export async function searchTheMuse(
  query: JobSearchQuery,
  options: { fetchImpl?: typeof fetch } = {},
): Promise<NormalizedJob[]> {
  const { fetchImpl = fetch } = options;
  const url = new URL(THEMUSE_ENDPOINT);
  url.searchParams.set("page", "1");

  if (query.location?.trim()) {
    url.searchParams.set("location", query.location.trim());
  }

  const response = await fetchImpl(url.toString(), {
    cache: "no-store",
    headers: {
      "User-Agent": "Jobbers/1.0 (Mozilla/5.0; https://jobbers.match)",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`The Muse API error: HTTP ${response.status}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The Muse returned a response that was not valid JSON.");
  }

  return parseMuseResponse(payload);
}

export const themuseProvider: JobProvider = {
  id: "themuse",
  searchMode: "client",
  search(query: JobSearchQuery): Promise<NormalizedJob[]> {
    return searchTheMuse(query);
  },
};

