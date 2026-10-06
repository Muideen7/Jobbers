/**
 * What a completed search actually saved — plan C5.
 *
 * Two bugs this exists to fix:
 *  1. **Cross-run duplicates.** Jobs were inserted unconditionally, so
 *     re-running a search re-inserted rows already in the list (verified: 53
 *     rows, only 40 distinct jobs). The key mirrors `buildJobRecord`'s
 *     `source_url` (`sourceUrl || applyUrl`) so a stored row and a freshly
 *     normalized job hash identically.
 *  2. **A misleading success message.** "Found 13 jobs" (this run) sat next to
 *     a table paginated over the whole saved list ("1–20 of 53"). The message
 *     now states inserted, skipped-duplicates, high matches *and* the list
 *     total, so the two numbers reconcile on screen.
 *
 * Relative/type-only imports keep this module loadable under `node --test`.
 */

import type { NormalizedJob } from "./types.ts";

/**
 * `source_url` column semantics, replicated for a normalized job: the source's
 * own listing URL, falling back to the apply URL. Legacy rows may have neither.
 */
export function jobSaveKey(
  source: string,
  sourceUrl: string | null,
  applyUrl: string | null,
): string {
  return `${source}|${sourceUrl || applyUrl || ""}`;
}

export type ExistingJobRow = {
  source: string;
  source_url: string | null;
  external_apply_url: string | null;
};

export type PartitionedJobs<T> = {
  /** Jobs not yet in the user's list, in source order. */
  fresh: T[];
  /** How many of `found` were already saved (also counts within-batch repeats). */
  duplicates: number;
  /** Row count of the existing list — what the table paginates over. */
  existingCount: number;
};

/**
 * Split this run's findings against what the user already has. The key set
 * doubles as within-batch dedupe (defensive — `searchAll` already collapses
 * repeats inside one run).
 */
export function partitionNewJobs<T extends NormalizedJob>(
  found: readonly T[],
  existingRows: readonly ExistingJobRow[],
): PartitionedJobs<T> {
  const seen = new Set(
    existingRows.map((row) =>
      jobSaveKey(row.source, row.source_url, row.external_apply_url),
    ),
  );

  const fresh: T[] = [];
  let duplicates = 0;

  for (const job of found) {
    const key = jobSaveKey(job.source, job.sourceUrl, job.applyUrl);
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    fresh.push(job);
  }

  return { fresh, duplicates, existingCount: existingRows.length };
}

export type SearchSummary = {
  /** Rows inserted by this run. */
  inserted: number;
  /** Findings skipped because they were already in the list. */
  duplicates: number;
  /** `existing + inserted` — what the results table will paginate over. */
  total: number;
  /** Inserted rows at or above `MATCH_THRESHOLD`. */
  highMatchCount: number;
};

/**
 * The one sentence (well, up to three) shown under the search box. Every
 * variant reconciles against the table: the total here is the table's total.
 */
export function buildSearchSuccessMessage(summary: SearchSummary): string {
  const { inserted, duplicates, total, highMatchCount } = summary;

  if (inserted === 0 && duplicates === 0) {
    return "No jobs found for that search. Try a different title or location.";
  }

  if (inserted === 0) {
    return (
      `No new jobs — all ${duplicates} result${duplicates === 1 ? "" : "s"} ` +
      `already in your list. Your list: ${total} jobs.`
    );
  }

  const skipped = duplicates > 0 ? ` (${duplicates} already saved)` : "";
  const added = `Added ${inserted} new job${inserted === 1 ? "" : "s"}${skipped}.`;
  const highMatches =
    highMatchCount > 0
      ? `${highMatchCount} strong match${highMatchCount === 1 ? "" : "es"}.`
      : "No high matches yet — try a broader search.";

  return `${added} ${highMatches} Your list: ${total} jobs.`;
}
