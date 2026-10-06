import type { Job } from "@/types";

/**
 * Pure filtering helpers for the dashboard workspace feed. Kept free of React
 * and InsForge so every rule is unit-testable (tests/dashboard-filters.test.ts).
 */

export type JobTypeFilter = "all" | "fulltime" | "remote" | "contract";
export type SalaryFloor = 0 | 100 | 150;

export type DashboardFilters = {
  /** Instant title / skill / company search (navbar + feed). */
  query: string;
  jobType: JobTypeFilter;
  /** Minimum annual figure in $k — parseSalaryFloor converts/hr compares. */
  salaryFloor: SalaryFloor;
  /** Case-insensitive substring match against the job location. */
  location: string;
  /** AI match threshold from the slider (0–100). */
  minScore: number;
};

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  query: "",
  jobType: "all",
  salaryFloor: 0,
  location: "",
  minScore: 0,
};

const HOURLY_CONTEXT_RE = /\bper hour\b|\ban hour\b|\/\s*hr\b|\b\/hr\b/i;
const NUMBER_RE = /\b(\d+(?:\.\d+)?)\b/;
const ANNUAL_TOKEN_RE = /\b(\d+(?:\.\d+)?)\s*(k\b)?/gi;

/**
 * First plausible annual figure in a free-text salary string, expressed in
 * thousands. Handles ranges (takes the minimum), `$150k` shorthand, currency
 * symbols, and hourly rates (annualised at 2,080 hours). Returns null when no
 * figure can be read. Currency differences are intentionally ignored — all
 * figures are treated as thousands in the posting's own currency.
 */
export function parseSalaryFloor(salary: string | null): number | null {
  if (!salary) return null;

  // Hourly rates — must run first so "$80/hr" is not read as "$80k".
  if (HOURLY_CONTEXT_RE.test(salary)) {
    const hourly = NUMBER_RE.exec(salary)?.[1];
    if (hourly === undefined) return null;
    return Math.round((parseFloat(hourly) * 2080) / 1000);
  }

  const cleaned = salary.replace(/,/g, "").replace(/[$£€]/g, "");
  let match: RegExpExecArray | null;
  let first: number | null = null;

  ANNUAL_TOKEN_RE.lastIndex = 0;
  while ((match = ANNUAL_TOKEN_RE.exec(cleaned)) !== null) {
    if (first === null) {
      const value = parseFloat(match[1] ?? "");
      const hasK = Boolean(match[2]);
      // A bare figure under 1000 ("45", "120") is shorthand for thousands —
      // "$120k" also takes this path with hasK set; real annual figures like
      // "120,000" or "450000" fall through untouched.
      const annual = hasK || value < 1000 ? value * 1000 : value;
      first = Math.round(annual / 1000);
    }
  }

  return first;
}

export function isRemoteListing(
  job: Pick<Job, "location" | "job_type" | "title">,
): boolean {
  const haystack = [job.location, job.job_type, job.title]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /remote/i.test(haystack);
}

export function matchesJobType(
  job: Pick<Job, "job_type" | "location" | "title">,
  filter: JobTypeFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "remote") return isRemoteListing(job);

  const type = job.job_type ?? "";
  if (filter === "fulltime") {
    return /\b(full[\s_-]?time|fulltime|permanent)\b/i.test(type);
  }
  if (filter === "contract") {
    return /\b(contract|contractor|freelance|temporary)\b/i.test(type);
  }
  return true;
}

export function matchesQuery(job: Job, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    job.title,
    job.company,
    job.location,
    job.about_role,
    ...job.matched_skills,
    ...job.requirements,
    ...job.nice_to_have,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

function passesSalaryFloor(job: Job, floor: SalaryFloor): boolean {
  if (floor === 0) return true;
  const parsed = parseSalaryFloor(job.salary);
  return parsed !== null && parsed >= floor;
}

export function filterDashboardJobs(
  jobs: Job[],
  filters: DashboardFilters,
): Job[] {
  const location = filters.location.trim().toLowerCase();

  return jobs.filter((job) => {
    const score = job.match_score ?? 0;
    if (score < filters.minScore) return false;
    if (!matchesJobType(job, filters.jobType)) return false;
    if (!passesSalaryFloor(job, filters.salaryFloor)) return false;
    if (location && !(job.location ?? "").toLowerCase().includes(location)) {
      return false;
    }
    return matchesQuery(job, filters.query);
  });
}