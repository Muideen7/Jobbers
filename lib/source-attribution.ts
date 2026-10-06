/**
 * Source attribution registry (plan task A7).
 *
 * RemoteOK, Remotive and Jobicy all require an on-site link-back naming the
 * source ("mention Remote OK as a source", "Jobicy clearly credited with a
 * direct link"), Arbeitnow asks for one, and Adzuna's ToS mandates "Jobs by
 * Adzuna". Any surface rendering job data must credit the sources behind it —
 * `resolveSourceCredits` turns the source ids found in results into that list.
 *
 * Pure and framework-free so `node --test` can cover it.
 */

import type { JobSourceId } from "./jobs/types";

export type SourceCredit = {
  label: string;
  url: string;
};

export const SOURCE_ATTRIBUTION: Record<JobSourceId | "search", SourceCredit> = {
  jsearch: { label: "JSearch", url: "https://www.openwebninja.com/api/jsearch" },
  adzuna: { label: "Adzuna", url: "https://www.adzuna.com" },
  arbeitnow: { label: "Arbeitnow", url: "https://www.arbeitnow.com" },
  remoteok: { label: "RemoteOK", url: "https://remoteok.com" },
  remotive: { label: "Remotive", url: "https://remotive.com" },
  jobicy: { label: "Jobicy", url: "https://jobicy.com" },
  // Legacy rows (pre-A7) all stored source "search" and were Adzuna-only.
  search: { label: "Adzuna", url: "https://www.adzuna.com" },
};

/**
 * Deduplicates by label (legacy "search" and explicit "adzuna" both credit
 * Adzuna once), preserves first-seen order, and silently skips values that are
 * not a job source — "url" rows were saved by hand, not fetched from an API.
 */
export function resolveSourceCredits(sources: readonly string[]): SourceCredit[] {
  const credits: SourceCredit[] = [];
  const seen = new Set<string>();

  for (const raw of sources) {
    const credit = SOURCE_ATTRIBUTION[raw as keyof typeof SOURCE_ATTRIBUTION];
    if (!credit || seen.has(credit.label)) {
      continue;
    }
    seen.add(credit.label);
    credits.push(credit);
  }

  return credits;
}
