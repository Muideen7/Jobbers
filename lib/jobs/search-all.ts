/**
 * searchAll — the multi-source job search orchestrator.
 * context/job-search-expansion-plan.md (task A6).
 *
 * Fans out to every provider in parallel (Promise.allSettled), isolates each
 * provider's failures, applies the local token filter to feeds that cannot
 * search server-side, collapses cross-source duplicates, caps the result set
 * and caches per source+query so the free quotas (JSearch 200 req/month,
 * Remotive ~4 GET/day) survive real traffic.
 *
 * Relative imports (not "@/…") keep the module loadable under `node --test`.
 */

import { adzunaProvider } from "./adzuna.ts";
import { arbeitnowProvider } from "./arbeitnow.ts";
import { jsearchProvider } from "./jsearch.ts";
import { jobicyProvider, remoteokProvider, remotiveProvider } from "./remote-feeds.ts";
import type { JobProvider, JobSearchQuery, JobSourceId, NormalizedJob } from "./types.ts";

/**
 * Server-searched sources first: their results already match the query, so
 * they lead the merged list; on description ties they win the dedupe.
 */
export const PROVIDER_REGISTRY: JobProvider[] = [
  jsearchProvider,
  adzunaProvider,
  arbeitnowProvider,
  remoteokProvider,
  jobicyProvider,
  remotiveProvider,
];

const DEFAULT_MAX_RESULTS = 40;
export const MAX_CACHE_ENTRIES = 300;
const DEFAULT_TTL_MS = 5 * 60 * 1000;

const SOURCE_TTL_MS: Record<JobSourceId, number> = {
  adzuna: DEFAULT_TTL_MS,
  jsearch: DEFAULT_TTL_MS,
  // Arbeitnow promises hourly updates; RemoteOK/Jobicy feeds are big payloads.
  arbeitnow: 30 * 60 * 1000,
  remoteok: 30 * 60 * 1000,
  jobicy: 30 * 60 * 1000,
  // Remotive's terms ask for ~4 GETs/day ("excessive requests will be blocked").
  remotive: 6 * 60 * 60 * 1000,
};

const SOURCE_DAILY_LIMITS: Partial<Record<JobSourceId, number>> = {
  remotive: 4,
};

const MIN_TOKEN_LENGTH = 3;

export type ProviderOutcome = {
  source: JobSourceId;
  count: number;
  /** Non-null when the source failed or was skipped (e.g. daily cap). */
  error?: string;
};

export type SearchAllResult = {
  jobs: NormalizedJob[];
  outcomes: ProviderOutcome[];
};

export type CacheEntry = {
  expires: number;
  jobs: NormalizedJob[];
};

export type SearchAllState = {
  /** Keyed `${source}|${country}|${location}|${title}`. */
  entries: Map<string, CacheEntry>;
  /** Keyed `${source}|${yyyy-mm-dd}` — upstream call counts per UTC day. */
  daily: Map<string, number>;
};

export function createSearchAllState(): SearchAllState {
  return { entries: new Map(), daily: new Map() };
}

const defaultState = createSearchAllState();

export type SearchAllOptions = {
  /** Injection seam for tests. Defaults to PROVIDER_REGISTRY. */
  providers?: JobProvider[];
  maxResults?: number;
  sourceTtlMs?: Partial<Record<JobSourceId, number>>;
  dailyLimits?: Partial<Record<JobSourceId, number>>;
  /** Injection seam for tests (TTL expiry, daily caps). */
  now?: () => number;
  state?: SearchAllState;
};

/** Query words long enough to be meaningful for the local feed filter. */
export function extractQueryTokens(title: string): string[] {
  return title
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);
}

/**
 * Feeds without server-side search would otherwise return their entire
 * catalogue for any query. Match on title only — matching on description too
 * would let common words through and reduce the filter to a no-op.
 * No tokens (very short queries) disables the filter rather than emptying it.
 */
export function filterClientResults(
  jobs: NormalizedJob[],
  tokens: string[],
  searchMode: JobProvider["searchMode"],
): NormalizedJob[] {
  if (searchMode === "server" || tokens.length === 0) {
    return jobs;
  }
  return jobs.filter((job) => {
    const title = job.title.toLowerCase();
    return tokens.some((token) => title.includes(token));
  });
}

function fingerprintPart(value: string): string {
  // Lowercase first — otherwise uppercase letters are eaten by the class below
  // and "Frontend Developer" stops matching "frontend developer".
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Same requisition reaches us from several aggregators (Greenhouse board +
 * Google for Jobs + Adzuna). Title+company identify the duplicate; the copy
 * with the fuller description wins because it scores better with Gemini.
 * Map.set on an existing key keeps the first source's position, so output
 * order follows PROVIDER_REGISTRY priority.
 */
export function dedupeNormalizedJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  const best = new Map<string, NormalizedJob>();

  for (const job of jobs) {
    if (!job.title.trim()) {
      continue;
    }
    const key = `${fingerprintPart(job.title)}|${fingerprintPart(job.company)}`;
    const incumbent = best.get(key);
    if (!incumbent || job.description.length > incumbent.description.length) {
      best.set(key, job);
    }
  }

  return [...best.values()];
}

function evictOldest(entries: Map<string, CacheEntry>): void {
  while (entries.size > MAX_CACHE_ENTRIES) {
    const oldest = entries.keys().next();
    if (oldest.done) {
      return;
    }
    entries.delete(oldest.value);
  }
}

type ProviderRun = { outcome: ProviderOutcome; jobs: NormalizedJob[] };

type RunContext = {
  query: JobSearchQuery;
  cacheKeyBase: string;
  tokens: string[];
  sourceTtlMs: Partial<Record<JobSourceId, number>>;
  dailyLimits: Partial<Record<JobSourceId, number>>;
  now: () => number;
  state: SearchAllState;
};

/**
 * Never throws: a failing source yields `{ count: 0, error }` so the remaining
 * providers' jobs still reach the matcher.
 */
async function runProvider(provider: JobProvider, ctx: RunContext): Promise<ProviderRun> {
  const timestamp = ctx.now();
  const ttl =
    ctx.sourceTtlMs[provider.id] ??
    SOURCE_TTL_MS[provider.id] ??
    DEFAULT_TTL_MS;

  const cacheKey = `${provider.id}|${ctx.cacheKeyBase}`;
  const cached = ctx.state.entries.get(cacheKey);
  if (cached && cached.expires > timestamp) {
    return {
      outcome: { source: provider.id, count: cached.jobs.length },
      jobs: filterClientResults(cached.jobs, ctx.tokens, provider.searchMode),
    };
  }

  const limit =
    ctx.dailyLimits[provider.id] ?? SOURCE_DAILY_LIMITS[provider.id];
  const dateKey = new Date(timestamp).toISOString().slice(0, 10);
  const dailyKey = `${provider.id}|${dateKey}`;

  if (limit !== undefined) {
    const used = ctx.state.daily.get(dailyKey) ?? 0;
    if (used >= limit) {
      return {
        outcome: {
          source: provider.id,
          count: 0,
          error: `daily source cap reached (${limit}/day)`,
        },
        jobs: [],
      };
    }
    // Count the attempt itself: a failed upstream call still consumed quota.
    ctx.state.daily.set(dailyKey, used + 1);
  }

  try {
    const raw = await provider.search(ctx.query);
    ctx.state.entries.set(cacheKey, { expires: timestamp + ttl, jobs: raw });
    evictOldest(ctx.state.entries);

    return {
      outcome: { source: provider.id, count: raw.length },
      jobs: filterClientResults(raw, ctx.tokens, provider.searchMode),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[jobs/searchAll] ${provider.id}: ${message}`);
    return { outcome: { source: provider.id, count: 0, error: message }, jobs: [] };
  }
}

export async function searchAll(
  query: JobSearchQuery,
  options: SearchAllOptions = {},
): Promise<SearchAllResult> {
  const {
    providers = PROVIDER_REGISTRY,
    maxResults = DEFAULT_MAX_RESULTS,
    sourceTtlMs = {},
    dailyLimits = {},
    now = Date.now,
    state = defaultState,
  } = options;

  const tokens = extractQueryTokens(query.title);
  const cacheKeyBase = [
    query.country.trim().toLowerCase(),
    query.location.trim().toLowerCase(),
    query.title.trim().toLowerCase(),
  ].join("|");

  const ctx: RunContext = {
    query,
    cacheKeyBase,
    tokens,
    sourceTtlMs,
    dailyLimits,
    now,
    state,
  };

  const settled = await Promise.allSettled(
    providers.map((provider) => runProvider(provider, ctx)),
  );

  const runs: ProviderRun[] = [];
  for (const entry of settled) {
    if (entry.status === "fulfilled") {
      runs.push(entry.value);
    } else {
      // Unreachable in practice — runProvider catches its own errors.
      console.error("[jobs/searchAll] unexpected provider rejection", entry.reason);
    }
  }

  const merged = dedupeNormalizedJobs(runs.flatMap((run) => run.jobs)).slice(
    0,
    maxResults,
  );

  return { jobs: merged, outcomes: runs.map((run) => run.outcome) };
}
