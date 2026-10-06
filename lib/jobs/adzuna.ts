/**
 * Adzuna provider — wraps the existing lib/adzuna.ts client in the shared
 * JobProvider interface (context/job-search-expansion-plan.md, task A2).
 *
 * lib/adzuna.ts itself stays byte-for-byte untouched. Adzuna is now the last
 * registry entry in search-all.ts — a 19-country fallback, no longer the core
 * job source (its API does not serve Nigeria and most of the world).
 *
 * Imports are relative (not "@/…") so the files load under `node --test`,
 * which does not resolve the Next.js path alias.
 */

import { cleanCompanyName, searchJobs } from "../adzuna.ts";
import type { AdzunaJob } from "../adzuna.ts";
import type { JobProvider, JobSearchQuery, NormalizedJob } from "./types.ts";

const DEFAULT_COUNTRY = "us";

/**
 * The 19 countries Adzuna's API actually serves (live-verified: `/ng` → HTTP
 * 404 `UNSUPPORTED_COUNTRY`, plan B1). Outside this list the provider skips
 * silently instead of burning a request that must fail — JSearch and the feeds
 * still cover those regions.
 */
export const ADZUNA_SUPPORTED_COUNTRIES = [
  "at", "au", "be", "br", "ca", "ch", "de", "es", "fr", "gb", "in", "it", "mx",
  "nl", "nz", "pl", "sg", "us", "za",
] as const;

const ADZUNA_SUPPORTED = new Set<string>(ADZUNA_SUPPORTED_COUNTRIES);

export function isAdzunaCountrySupported(country: string): boolean {
  return ADZUNA_SUPPORTED.has(country.trim().toLowerCase());
}

export function normalizeAdzunaJob(job: AdzunaJob): NormalizedJob {
  return {
    source: "adzuna",
    externalId: job.id,
    title: job.title,
    company: cleanCompanyName(job.company?.display_name ?? ""),
    location: job.location?.display_name ?? "",
    // HTML snippet, kept verbatim — the prompt builder strips it downstream.
    description: job.description ?? "",
    applyUrl: job.redirect_url,
    sourceUrl: job.redirect_url,
    salaryMin: job.salary_min ?? null,
    salaryMax: job.salary_max ?? null,
    // Adzuna does not state a period; treat as unknown rather than assume YEAR.
    salaryPeriod: null,
    salaryText: null,
    postedAt: job.created ?? null,
    employmentType: job.contract_type ?? null,
    remote: false,
    category: job.category?.label ?? null,
    highlights: { responsibilities: [], requirements: [], benefits: [] },
  };
}

export const adzunaProvider: JobProvider = {
  id: "adzuna",
  searchMode: "server",
  async search(query: JobSearchQuery): Promise<NormalizedJob[]> {
    const country = query.country.trim().toLowerCase() || DEFAULT_COUNTRY;
    // Plan B1: never call Adzuna with an unsupported code — it 404s
    // (UNSUPPORTED_COUNTRY). Skip silently; the other providers still search.
    if (!isAdzunaCountrySupported(country)) {
      return [];
    }
    const jobs = await searchJobs(query.title, query.location, country);
    return jobs.map((job) => normalizeAdzunaJob(job));
  },
};
