/**
 * Workspace-wide constants shared by the sidebar summary, the applications
 * layer (Prompt 2) and the pages that consume them. Kept in one place so the
 * threshold and stage vocabulary cannot drift between UI and API.
 */

/** Minimum `match_score` for a job to count as a "new match". */
export const NEW_MATCH_SCORE_THRESHOLD = 60;

/** Days until the next follow-up once an application is marked applied. */
export const DEFAULT_FOLLOW_UP_DAYS = 7;

/** The Kanban columns, in pipeline order. `closed` is intentionally excluded. */
export const APPLICATION_STAGES = ["saved", "applied", "interview", "offer"] as const;
export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

/** Every persisted application status, including the terminal `closed`. */
export const APPLICATION_STATUSES = [...APPLICATION_STAGES, "closed"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Reasons an application can be closed with. */
export const CLOSED_REASONS = ["rejected", "withdrawn", "no_response"] as const;
export type ClosedReason = (typeof CLOSED_REASONS)[number];

/** Types of rows written to `application_events`. */
export const APPLICATION_EVENT_TYPES = [
  "created",
  "status_changed",
  "follow_up_set",
  "follow_up_sent",
  "note",
] as const;
export type ApplicationEventType = (typeof APPLICATION_EVENT_TYPES)[number];