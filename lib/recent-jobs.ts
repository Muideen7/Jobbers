/**
 * Client-side persistence for recently viewed and applied jobs.
 * Stores up to 20 job IDs in localStorage with SSR safety.
 */

const RECENTLY_VIEWED_KEY = "jobbers_recently_viewed_jobs";
const APPLIED_JOBS_KEY = "jobbers_applied_jobs";
const MAX_RECENT = 20;

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
    return !isApplied;
  } catch {
    return false;
  }
}

export function isJobApplied(jobId: string): boolean {
  if (typeof window === "undefined" || !jobId) return false;
  return getAppliedJobIds().includes(jobId);
}
