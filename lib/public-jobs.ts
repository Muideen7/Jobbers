/**
 * Pure mapping/filter/sort helpers for the public landing-page job search
 * (`/api/public/jobs`). Kept out of the route file so `node --test` can cover
 * them (Next route modules only export HTTP handlers).
 *
 * These were previously inline Adzuna-specific functions; the route now runs
 * on the multi-source searchAll orchestrator, so everything here operates on
 * NormalizedJob.
 *
 * Type-only imports are erased at runtime, so this module loads fine under
 * `node --test` despite the "@/…" paths.
 */

import type { NormalizedJob } from "@/lib/jobs/types";
import type { PublicJob } from "@/types";

export type PublicFilter = "all" | "remote" | "fulltime" | "salary150";

export const PUBLIC_FILTERS: readonly string[] = [
  "all",
  "remote",
  "fulltime",
  "salary150",
];

/** Salary floor the "$150k+" chip promises — figures below are in USD. */
const SALARY_FILTER_MIN = 150_000;

export function isPublicFilter(value: string): value is PublicFilter {
  return (PUBLIC_FILTERS as readonly string[]).includes(value);
}

/**
 * Server-side filters don't exist across all six sources, so each chip becomes
 * a post-filter over the normalized results:
 * - remote: the source's own remote flag, with a title/location fallback for
 *   sources that flag nothing (Adzuna has no remote field).
 * - fulltime: excludes explicitly part-time/contract/intern roles; an *unknown*
 *   employment type counts as full-time, matching the legacy behaviour where a
 *   missing contract type displayed "Full time".
 * - salary150: only jobs that publish a numeric minimum at or above the floor.
 *   Sources without figures (Arbeitnow, Remotive, Jobicy) are excluded rather
 *   than guessed — a "$150k+" chip must not show unverifiable salaries.
 */
export function matchesPublicFilter(job: NormalizedJob, filter: PublicFilter): boolean {
  if (filter === "remote") {
    return (
      job.remote ||
      /\bremote\b/i.test(job.title) ||
      /\bremote\b/i.test(job.location)
    );
  }
  if (filter === "fulltime") {
    return !job.employmentType || /full|permanent/i.test(job.employmentType);
  }
  if (filter === "salary150") {
    return job.salaryMin != null && job.salaryMin >= SALARY_FILTER_MIN;
  }
  return true;
}

export function formatPublicSalary(job: NormalizedJob): string {
  if (job.salaryText) {
    return job.salaryText;
  }

  const { salaryMin: min, salaryMax: max } = job;

  if (min == null && max == null) {
    return "Salary not listed";
  }

  const short = (value: number) =>
    value >= 1000 ? `$${Math.round(value / 1000)}k` : `$${value}`;

  // Sources sometimes return a single machine-predicted figure as min === max,
  // which used to render as "$184k – $184k". Collapse that to one value.
  if (min != null && max != null && min === max) {
    return short(min);
  }

  if (min != null && max != null) {
    return `${short(min)} – ${short(max)}`;
  }

  return `${short((min ?? max) as number)}+`;
}

export function formatPublicContractType(job: NormalizedJob): string {
  if (job.employmentType) {
    return job.employmentType
      .replace(/[_-]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  return "Full time";
}

export function toPublicJob(job: NormalizedJob): PublicJob {
  return {
    // Sources reuse ids ("123" from Adzuna and RemoteOK are different jobs),
    // so the composite keeps React keys and lookups unique across sources.
    id: `${job.source}:${job.externalId}`,
    title: job.title,
    company: job.company || "Unknown company",
    location: job.location || (job.remote ? "Remote" : "Anywhere"),
    salary: formatPublicSalary(job),
    contractType: formatPublicContractType(job),
    category: job.category ?? "Technology",
    created: job.postedAt ?? "",
    url: job.applyUrl || job.sourceUrl,
    description: job.description ?? "",
  };
}

function postedTime(job: NormalizedJob): number {
  if (!job.postedAt) {
    return Number.NaN;
  }
  const time = Date.parse(job.postedAt);
  return Number.isNaN(time) ? Number.NaN : time;
}

/**
 * Default ordering mixes sources together by recency — the landing page sells
 * "live" opportunities, and registry order would show one source's block at a
 * time. The $150k+ chip keeps the legacy "sort by salary" behaviour instead.
 * Unknown dates sort last.
 */
export function sortPublicJobs(jobs: NormalizedJob[], filter: PublicFilter): NormalizedJob[] {
  const sorted = [...jobs];

  if (filter === "salary150") {
    sorted.sort((a, b) => (b.salaryMin ?? -1) - (a.salaryMin ?? -1));
    return sorted;
  }

  sorted.sort((a, b) => {
    const ta = postedTime(a);
    const tb = postedTime(b);
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return tb - ta;
  });
  return sorted;
}
