/**
 * Tab vocabulary for the merged /jobs surface (Prompt 3).
 *
 * These exact strings are what `next.config.ts`'s permanent redirects point at
 * (`/matches` -> `?tab=for-you`, `/inventory` -> `?tab=saved`,
 * `/company-research` -> `?tab=all`, `/dossiers` -> `?tab=all&researched=1`),
 * so renaming a value here silently breaks a live redirect.
 */

export const JOBS_TABS = ["for-you", "all", "saved"] as const;

export type JobsTab = (typeof JOBS_TABS)[number];

/** Without a `?tab=` param the feed opens on the ranked view. */
export const DEFAULT_JOBS_TAB: JobsTab = "for-you";

export const JOBS_TAB_LABELS: Record<JobsTab, string> = {
  "for-you": "For You",
  all: "All",
  saved: "Saved",
};

type Param = string | string[] | undefined;

/** Next may hand back an array when the param is repeated in the URL. */
function firstParam(value: Param): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** An unknown or missing `?tab=` reads as the default rather than 404ing. */
export function normalizeJobsTab(value: Param): JobsTab {
  const raw = firstParam(value);
  return (JOBS_TABS as readonly string[]).includes(raw ?? "")
    ? (raw as JobsTab)
    : DEFAULT_JOBS_TAB;
}

/** The researched chip is opt-in; only the literal `?researched=1` turns it on. */
export function normalizeResearched(value: Param): boolean {
  return firstParam(value) === "1";
}

/** Serialises tab state back into a query string, dropping defaults. */
export function jobsTabQueryString(
  tab: JobsTab,
  researched: boolean,
): string {
  const params = new URLSearchParams();
  if (tab !== DEFAULT_JOBS_TAB) params.set("tab", tab);
  if (researched) params.set("researched", "1");
  return params.toString();
}
