import type { Job } from "@/types";

/**
 * Pure filtering helpers for the workspace job feed. Kept free of React and
 * InsForge so every rule is unit-testable (tests/dashboard-filters.test.ts).
 *
 * Filter dimensions mirror the Find Jobs sidebar spec:
 * - Workplace: remote-only + AI / ML focused listings.
 * - Location: substring match on the job location string.
 * - Availability: recently-closed roles (no closures recorded yet — see
 *   `isRecentlyClosed`).
 * - Job type + Level: multi-select. Job type reads the scraper's `job_type`
 *   column; level is derived from seniority tokens in the job title (the
 *   schema carries no per-job level column).
 * - Posted within: window over `found_at`.
 * - Salary floor: first annual figure in the free-text salary string.
 * - Match score threshold + free-text query: unchanged.
 */

export type JobTypeFilter =
  | "fulltime"
  | "parttime"
  | "contract"
  | "internship"
  | "freelance";

export type LevelFilter =
  | "intern"
  | "junior"
  | "mid"
  | "senior"
  | "staff"
  | "principal"
  | "lead"
  | "manager"
  | "director"
  | "executive";

export type PostedWithinFilter = "any" | "24h" | "3d" | "week";

/** Minimum annual figure in $k, from the sidebar's segmented control. */
export type SalaryFloor = 0 | 60 | 100 | 150 | 200;

export type DashboardFilters = {
  /** Instant title / skill / company search (top-bar + feed). */
  query: string;
  /** Workplace: only list remote roles. */
  remoteOnly: boolean;
  /** Workplace: only list AI / ML focused roles. */
  aiFocus: boolean;
  /** Case-insensitive substring match against the job location. */
  location: string;
  /** Availability: only roles marked closed. No closures are recorded yet. */
  recentlyClosed: boolean;
  /** Multi-select contract types; empty array = any. */
  jobTypes: JobTypeFilter[];
  /** Multi-select title-derived seniority levels; empty array = any. */
  levels: LevelFilter[];
  /** Posted window relative to now. */
  postedWithin: PostedWithinFilter;
  /** Minimum annual figure in $k. */
  salaryFloor: SalaryFloor;
  /** AI match threshold from the (legacy) slider, 0–100. */
  minScore: number;
};

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  query: "",
  remoteOnly: false,
  aiFocus: false,
  location: "",
  recentlyClosed: false,
  jobTypes: [],
  levels: [],
  postedWithin: "any",
  salaryFloor: 0,
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
  return /\bremote\b/i.test(haystack);
}

/** AI / ML focused listing heuristic over title, description and skills. */
const AI_KEYWORDS_RE =
  /\b(ai\b|a\.i\.|artificial intelligence|machine learning|deep learning|generative ai|llm|llms|nlp|computer vision|data science|ml)\b/i;

export function isAiFocusListing(job: Job): boolean {
  const haystack = [
    job.title,
    job.about_role,
    job.job_type,
    ...job.matched_skills,
    ...job.requirements,
    ...job.nice_to_have,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return AI_KEYWORDS_RE.test(haystack);
}

const JOB_TYPE_PATTERNS: Record<JobTypeFilter, RegExp> = {
  fulltime: /\b(full[\s_-]?time|fulltime|permanent)\b/i,
  parttime: /\bpart[\s_-]?time\b/i,
  contract: /\b(contract|contractor|freelance|temporary)\b/i,
  internship: /\bintern(ship)?\b/i,
  freelance: /\bfreelance\b/i,
};

export function matchesJobType(
  job: Pick<Job, "job_type">,
  filter: JobTypeFilter,
): boolean {
  return JOB_TYPE_PATTERNS[filter].test(job.job_type ?? "");
}

const LEVEL_PATTERNS: Record<LevelFilter, RegExp> = {
  intern: /\bintern(ship)?\b/i,
  junior: /\bjunior\b|\bjr\b/i,
  mid: /\bmid([\s-]+level)?\b/i,
  senior: /\bsenior\b|\bsr\.?\b/i,
  staff: /\bstaff\b/i,
  principal: /\bprincipal\b/i,
  lead: /\blead\b/i,
  manager: /\b(manager|management)\b/i,
  director: /\bdirector\b/i,
  executive: /\b(executive|chief|vp|vice president|head of)\b/i,
};

/**
 * Seniority levels detectable from the job title. Rendered titles like
 * "Senior Lead Frontend Engineer" legitimately match several buckets — every
 * bucket that appears is returned so multi-select filtering intersects cleanly.
 */
export function deriveJobLevels(title: string | null): LevelFilter[] {
  if (!title) return [];
  return (Object.keys(LEVEL_PATTERNS) as LevelFilter[]).filter((level) =>
    LEVEL_PATTERNS[level].test(title),
  );
}

const POSTED_WINDOW_MS: Record<Exclude<PostedWithinFilter, "any">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
};

/** True when the listing was found within the posted window (relative to `now`). */
export function matchesPostedWithin(
  job: Pick<Job, "found_at">,
  filter: PostedWithinFilter,
  now: number = Date.now(),
): boolean {
  if (filter === "any") return true;
  const found = new Date(job.found_at ?? "").getTime();
  if (Number.isNaN(found)) return false; // unparseable listings are never "recent"
  return now - found <= POSTED_WINDOW_MS[filter];
}

/**
 * Whether the role has been flagged as closed. The scraper pipeline does not
 * record closures yet, so today this narrows to an empty set — the sidebar
 * control is wired to the engine ahead of that data landing.
 */
export function isRecentlyClosed(job: Job): boolean {
  const closedAt = (job as Job & { closed_at?: string | null }).closed_at;
  return typeof closedAt === "string" && closedAt.length > 0;
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
    if (filters.remoteOnly && !isRemoteListing(job)) return false;
    if (filters.aiFocus && !isAiFocusListing(job)) return false;
    if (filters.recentlyClosed && !isRecentlyClosed(job)) return false;
    if (
      filters.jobTypes.length > 0 &&
      !filters.jobTypes.some((type) => matchesJobType(job, type))
    ) {
      return false;
    }
    if (filters.levels.length > 0) {
      const derived = deriveJobLevels(job.title);
      if (!filters.levels.some((level) => derived.includes(level))) return false;
    }
    if (!matchesPostedWithin(job, filters.postedWithin)) return false;
    if (!passesSalaryFloor(job, filters.salaryFloor)) return false;
    if (location && !(job.location ?? "").toLowerCase().includes(location)) {
      return false;
    }
    return matchesQuery(job, filters.query);
  });
}