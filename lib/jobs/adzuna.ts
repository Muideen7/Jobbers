/**
 * Adzuna provider — wraps the existing lib/adzuna.ts client in the shared
 * JobProvider interface (context/job-search-expansion-plan.md, task A2).
 *
 * lib/adzuna.ts itself is untouched: /api/public/jobs and /api/agent/find
 * keep consuming searchJobs/dedupeAdzunaJobs exactly as before until the
 * searchAll orchestrator (A6) rewires them.
 *
 * Imports are relative (not "@/…") so the files load under `node --test`,
 * which does not resolve the Next.js path alias.
 */

import { cleanCompanyName, searchJobs } from "../adzuna.ts";
import type { AdzunaJob } from "../adzuna.ts";
import type { JobProvider, JobSearchQuery, NormalizedJob } from "./types.ts";

const DEFAULT_COUNTRY = "us";

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
    postedAt: job.created ?? null,
    employmentType: job.contract_type ?? null,
    remote: false,
    highlights: { responsibilities: [], requirements: [], benefits: [] },
  };
}

export const adzunaProvider: JobProvider = {
  id: "adzuna",
  async search(query: JobSearchQuery): Promise<NormalizedJob[]> {
    const country = query.country.trim().toLowerCase() || DEFAULT_COUNTRY;
    const jobs = await searchJobs(query.title, query.location, country);
    return jobs.map((job) => normalizeAdzunaJob(job));
  },
};
