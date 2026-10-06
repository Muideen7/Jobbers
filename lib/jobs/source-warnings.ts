/**
 * Plan B2 — one failing job source must never fail the run, but it must be
 * visible. `sourceWarningLogRows` turns searchAll's `outcomes` into
 * `agent_logs` warning rows: the run status stays "completed", the other
 * sources' jobs are saved as usual, and the failure (e.g. Adzuna HTTP 404
 * `UNSUPPORTED_COUNTRY`, a JSearch quota overrun) lands in the log for
 * diagnostics.
 *
 * Pure and dependency-free — relative/type-only imports keep it loadable
 * under `node --test`.
 */

import type { AgentLog } from "../../types/index.ts";
import type { ProviderOutcome } from "./search-all.ts";

export type SourceWarningRow = {
  run_id: string | null;
  user_id: string;
  job_id: string | null;
  message: string;
  level: AgentLog["level"];
  created_at: string;
};

type SourceWarningInput = {
  runId: string | null;
  userId: string;
  outcomes: readonly ProviderOutcome[];
  /** Injection seam for tests; defaults to now as an ISO string. */
  now?: () => string;
};

/** Warning rows for every outcome that carries an error; [] when all healthy. */
export function sourceWarningLogRows(input: SourceWarningInput): SourceWarningRow[] {
  const createdAt = input.now?.() ?? new Date().toISOString();

  return input.outcomes
    .filter((outcome) => outcome.error)
    .map((outcome) => ({
      run_id: input.runId,
      user_id: input.userId,
      job_id: null,
      message: `Job source "${outcome.source}" failed: ${outcome.error}. Run continued with the remaining sources.`,
      level: "warning" as const,
      created_at: createdAt,
    }));
}
