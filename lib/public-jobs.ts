/**
 * Pure mapping/filter/sort helpers for the public landing-page job search
 * (`/api/public/jobs`). Kept out of the route file so `node --test` can cover
 * them (Next route modules only export HTTP handlers).
 *
 * These were previously inline Adzuna-specific functions; the route now runs
 * on the multi-source searchAll orchestrator, so everything here operates on
 * NormalizedJob.
 *
 * Loads fine under `node --test`: the only runtime dependency is the
 * dependency-free `jobs/country.ts` (relative `.ts` import, like search-all),
 * and the remaining "@/…" imports are type-only, which are erased at runtime.
 */

import { countryFromText } from "./jobs/country.ts";
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

// ---------------------------------------------------------------------------
// Landing filter facets — the LiveOpportunities dropdowns (Job Categories,
// Countries, Salary Range, Skills, Employment Type). Each dropdown narrows the
// same result set server-side so `totalCount` (the "Available Positions" count
// above the grid) always matches what the cards can show.
// ---------------------------------------------------------------------------

/** Salary dropdown bands — the floor is a *verifiable* annual minimum (USD). */
export const PUBLIC_SALARY_BANDS = ["any", "50k", "100k", "150k"] as const;
export type PublicSalaryBand = (typeof PUBLIC_SALARY_BANDS)[number];

export const PUBLIC_EMPLOYMENT_TYPES = [
  "any",
  "fulltime",
  "parttime",
  "contract",
  "internship",
] as const;
export type PublicEmploymentType = (typeof PUBLIC_EMPLOYMENT_TYPES)[number];

/** Bounds keep a public, unauthenticated param from bloating cache keys or regexes. */
export const MAX_PUBLIC_CATEGORY_LENGTH = 80;
export const MAX_PUBLIC_SKILL_LENGTH = 40;
export const MAX_PUBLIC_SKILL_TERMS = 5;

export function isPublicSalaryBand(value: string): value is PublicSalaryBand {
  return (PUBLIC_SALARY_BANDS as readonly string[]).includes(value);
}

export function isPublicEmploymentType(
  value: string,
): value is PublicEmploymentType {
  return (PUBLIC_EMPLOYMENT_TYPES as readonly string[]).includes(value);
}

export function sanitizePublicCategory(raw: string | null): string | null {
  const value =
    raw?.trim().replace(/\s+/g, " ").slice(0, MAX_PUBLIC_CATEGORY_LENGTH) ?? "";
  return value || null;
}

export function sanitizePublicSkills(raw: string | null): string[] {
  if (!raw) {
    return [];
  }
  // De-dupe case-insensitively — the matcher lowercases anyway, so "React"
  // and "react" are the same term. First spelling wins.
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const term of raw.split(",")) {
    const trimmed = term.trim().replace(/\s+/g, " ").slice(0, MAX_PUBLIC_SKILL_LENGTH);
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
    if (unique.length >= MAX_PUBLIC_SKILL_TERMS) break;
  }
  return unique;
}

const SALARY_FLOORS: Record<Exclude<PublicSalaryBand, "any">, number> = {
  "50k": 50_000,
  "100k": 100_000,
  "150k": 150_000,
};

/**
 * Same promise as the legacy salary150 chip: only numeric minimums count —
 * hourly/free-form text ("$45-$120/Hour") cannot be verified against a band,
 * so it is excluded rather than guessed.
 */
export function matchesPublicSalary(
  job: NormalizedJob,
  band: PublicSalaryBand,
): boolean {
  if (band === "any") return true;
  return job.salaryMin != null && job.salaryMin >= SALARY_FLOORS[band];
}

/**
 * `fulltime` keeps the legacy chip's semantics (unknown counts as full time —
 * the cards display "Full time" for a missing type). The other bands match
 * the source's raw `employmentType` text loosely.
 */
export function matchesPublicEmployment(
  job: NormalizedJob,
  type: PublicEmploymentType,
): boolean {
  if (type === "any") return true;
  const value = job.employmentType ?? "";
  switch (type) {
    case "fulltime":
      return !value || /full|permanent/i.test(value);
    case "parttime":
      return /part/i.test(value);
    case "contract":
      return /contract|freelance|temp/i.test(value);
    case "internship":
      return /intern/i.test(value);
  }
}

/**
 * What the card prints: `category` defaults to "Technology" in `toPublicJob`,
 * so null-category jobs must count as Technology here — the facet filter and
 * the facet list can never disagree.
 */
export function displayedJobCategory(job: NormalizedJob): string {
  return job.category?.trim() || "Technology";
}

export function matchesPublicCategory(
  job: NormalizedJob,
  category: string | null,
): boolean {
  if (!category) return true;
  return displayedJobCategory(job).toLowerCase() === category.toLowerCase();
}

/**
 * Distinct displayed categories, alphabetical — drives the Job Categories
 * dropdown. Case folds ("Design"/"design" are one entry, first spelling wins)
 * so the list can never disagree with `matchesPublicCategory`.
 */
export function categoryFacets(jobs: readonly NormalizedJob[]): string[] {
  const byKey = new Map<string, string>();
  for (const job of jobs) {
    const display = displayedJobCategory(job);
    const key = display.toLowerCase();
    if (!byKey.has(key)) {
      byKey.set(key, display);
    }
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Every selected skill must appear as a word in the title or description. */
export function matchesPublicSkills(
  job: NormalizedJob,
  skills: readonly string[],
): boolean {
  if (skills.length === 0) return true;
  const haystack = `${job.title}\n${job.description}`.toLowerCase();
  return skills.every((skill) =>
    new RegExp(
      `(^|[^a-z0-9])${escapeRegExp(skill.toLowerCase())}([^a-z0-9]|$)`,
    ).test(haystack),
  );
}

/**
 * Country dropdown: the search itself is scoped (JSearch/Adzuna get the
 * country), and this post-filter keeps the count honest for sources that
 * ignore it. Remote / unresolvable locations ("Remote", "Anywhere") pass —
 * those jobs are workable from anywhere; only locations that clearly resolve
 * to a *different* country are dropped.
 */
export function matchesPublicCountry(
  job: NormalizedJob,
  countryCode: string,
): boolean {
  if (job.remote) return true;
  const location = job.location.trim();
  if (!location) return true;
  if (/\b(remote|anywhere|worldwide)\b/i.test(location)) return true;
  const resolved = countryFromText(location);
  return resolved === null || resolved === countryCode;
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
