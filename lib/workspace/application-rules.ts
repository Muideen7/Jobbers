/**
 * Pure, dependency-free helpers for the applications layer. Kept separate from
 * the route handlers so they can be unit-tested without a database, and so the
 * stage order and follow-up math cannot drift between API and UI.
 */

/** Kanban/pipeline order used to sort applications within a list. */
export const APPLICATION_STAGE_ORDER: Record<string, number> = {
  saved: 0,
  applied: 1,
  interview: 2,
  offer: 3,
  closed: 4,
};

/** Ranks a status; unknowns sort last rather than throwing. */
export function applicationStageRank(status: string): number {
  return APPLICATION_STAGE_ORDER[status] ?? 99;
}

/**
 * Adds `days` calendar days to an ISO date and returns an ISO string. Used to
 * default `next_follow_up_at` to `applied_at + DEFAULT_FOLLOW_UP_DAYS`.
 */
export function computeFollowUpDate(fromIso: string, days: number): string {
  const date = new Date(fromIso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

/** Midnight at the *end* of the day containing `now` (local time), as ISO. */
export function endOfToday(now: Date = new Date()): string {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return end.toISOString();
}

/** True when `iso` falls on the local calendar day containing `now`. */
export function isToday(iso: string, now: Date = new Date()): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}