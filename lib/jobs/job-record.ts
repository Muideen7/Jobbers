/**
 * NormalizedJob → `jobs` insert record — plan C3 (structured highlights into
 * the DB) with `formatSalaryForDb` moved alongside it from the find route so
 * the salary and highlight rules are unit-testable.
 *
 * `jobs.responsibilities/requirements/benefits` are `text[]` columns that
 * existed since the jobs table was created but were never populated for
 * search jobs; JSearch's `job_highlights` (already normalized into
 * `NormalizedJob.highlights`) is their first real content.
 *
 * Relative/type-only imports keep this module loadable under `node --test`.
 */

import type { NormalizedJob } from "./types.ts";

export type JobScoreFields = {
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
};

/**
 * Cross-source salary rules: the source's own text wins (currency and period
 * intact, e.g. Remotive's "$45-$120/Hour"). Numeric figures only collapse to
 * the "$120k" convention when the period is yearly or unstated — hourly and
 * monthly numbers are dropped rather than mislabelled. Currency tracking for
 * numeric figures is plan C2's known gap.
 */
export function formatSalaryForDb(job: NormalizedJob): string | null {
  if (job.salaryText) {
    return job.salaryText;
  }

  const { salaryMin: min, salaryMax: max } = job;
  if (min == null || (job.salaryPeriod !== null && job.salaryPeriod !== "YEAR")) {
    return null;
  }

  const short = (value: number) => `$${Math.round(value / 1000)}k`;

  if (max != null && min === max) {
    return short(min);
  }
  if (max != null) {
    return `${short(min)} - ${short(max)}`;
  }
  return `${short(min)}+`;
}

export type JobDbRecord = {
  user_id: string;
  run_id: string | null;
  // Provider id ("jsearch", "adzuna", …) so every saved row can be attributed
  // to its source (plan A7); legacy rows say "search".
  source: string;
  source_url: string | null;
  external_apply_url: string | null;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  job_type: string;
  about_role: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  match_score: number;
  match_reason: string;
  matched_skills: string[];
  missing_skills: string[];
  found_at: string;
};

export function buildJobRecord(input: {
  job: NormalizedJob;
  userId: string;
  runId: string | null;
  score: JobScoreFields;
  foundAt: string;
}): JobDbRecord {
  const { job, score } = input;

  return {
    user_id: input.userId,
    run_id: input.runId,
    source: job.source,
    source_url: job.sourceUrl || job.applyUrl,
    external_apply_url: job.applyUrl,
    title: job.title,
    company: job.company || "Unknown company",
    location: job.location || (job.remote ? "Remote" : "Unknown location"),
    salary: formatSalaryForDb(job),
    job_type: job.employmentType ?? "fulltime",
    about_role: job.description,
    // C3: JSearch highlights land in their columns; sources without them
    // insert empty arrays (matching the columns' '{}' default).
    responsibilities: job.highlights.responsibilities,
    requirements: job.highlights.requirements,
    benefits: job.highlights.benefits,
    match_score: score.matchScore,
    match_reason: score.matchReason,
    matched_skills: score.matchedSkills,
    missing_skills: score.missingSkills,
    found_at: input.foundAt,
  };
}
