/**
 * Client-side persistence for recently viewed and applied jobs.
 * Stores up to 20 job IDs in localStorage with SSR safety.
 *
 * Exposed as an external store for `useSyncExternalStore`: the server (and the
 * first client render, via the server snapshot) sees an empty list, and the
 * real localStorage values only appear after hydration. Reading localStorage in
 * a `useState` initializer instead makes the very first client render differ
 * from the server HTML and triggers a hydration mismatch.
 */

const RECENTLY_VIEWED_KEY = "jobbers_recently_viewed_jobs";
const APPLIED_JOBS_KEY = "jobbers_applied_jobs";
const MAX_RECENT = 20;

/** Stable reference returned on the server and during hydration. */
const EMPTY_IDS: string[] = [];

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/**
 * `subscribe` for useSyncExternalStore. Fires on same-tab writes (via `emit`)
 * and on cross-tab writes (via the `storage` event).
 */
export function subscribeRecentJobs(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Server snapshot — always empty, so hydration matches the server HTML. */
export function getRecentJobsServerSnapshot(): string[] {
  return EMPTY_IDS;
}

// Parsed snapshots are cached by their serialized value so the reference stays
// stable between renders (useSyncExternalStore requires a cached snapshot).
let recentViewedCache: { key: string; ids: string[] } | null = null;
let appliedCache: { key: string; ids: string[] } | null = null;

export function getRecentlyViewedSnapshot(): string[] {
  const ids = getRecentlyViewedIds();
  const key = ids.join("\u0000");
  if (!recentViewedCache || recentViewedCache.key !== key) {
    recentViewedCache = { key, ids };
  }
  return recentViewedCache.ids;
}

export function getAppliedJobsSnapshot(): string[] {
  const ids = getAppliedJobIds();
  const key = ids.join("\u0000");
  if (!appliedCache || appliedCache.key !== key) {
    appliedCache = { key, ids };
  }
  return appliedCache.ids;
}

export function getRecentlyViewedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordJobView(jobId: string): void {
  if (typeof window === "undefined" || !jobId) return;
  try {
    const existing = getRecentlyViewedIds().filter((id) => id !== jobId);
    const updated = [jobId, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    emit();
  } catch {
    // LocalStorage write fail ignored
  }
}

export function getAppliedJobIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(APPLIED_JOBS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleAppliedJob(jobId: string): boolean {
  if (typeof window === "undefined" || !jobId) return false;
  try {
    const existing = getAppliedJobIds();
    const isApplied = existing.includes(jobId);
    const updated = isApplied
      ? existing.filter((id) => id !== jobId)
      : [jobId, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(APPLIED_JOBS_KEY, JSON.stringify(updated));
    emit();
    return !isApplied;
  } catch {
    return false;
  }
}

export function isJobApplied(jobId: string): boolean {
  if (typeof window === "undefined" || !jobId) return false;
  return getAppliedJobIds().includes(jobId);
}
