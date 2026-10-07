/**
 * The scoring prompt builder — plan C1 (full-profile context) + C2
 * (score on full descriptions, truncated centrally, never mid-JSON).
 *
 * Extracted from `app/api/agent/find/route.ts` so both halves are unit-testable
 * under `node --test`: the profile context, the per-job description budget and
 * the output-token sizing all live here. The route keeps the Gemini call and
 * its zero-score fallback (C4: scoring semantics are unchanged — only where
 * the prompt is *built* moved).
 *
 * Relative/type-only imports keep this module loadable without the Next.js
 * path alias.
 */

import type { WorkExperience } from "../../types/index.ts";
import type { NormalizedJob } from "./types.ts";

/** The nine scoring fields (plan C1) + `location`, which B1 shares for country detection. */
export type ProfileScoreContext = {
  skills: string[] | null;
  industries: string[] | null;
  experience_level: string | null;
  job_titles_seeking: string[] | null;
  years_experience: number | null;
  work_experience: WorkExperience[] | null;
  remote_preference: string | null;
  preferred_locations: string[] | null;
  salary_expectation: string | null;
  /** Candidate's current city — B1 reads it for the search country; also a scoring signal. */
  location: string | null;
};

export type ScoredResult = {
  jobId: string;
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
};

export const SCORING_SYSTEM_PROMPT =
  "You are a job matching assistant. Score each job against the candidate profile and return only valid JSON.";

// ~4 English chars per token: the shared input budget across all jobs in one
// prompt, and the per-job ceiling when the budget divided by the job count is
// larger. Full-text sources (JSearch, Arbeitnow, the feeds) feed Gemini up to
// these caps; Adzuna's ~300-char snippets are far below both and pass as-is.
export const SCORING_TOTAL_DESCRIPTION_CHARS = 160_000;
export const SCORING_MAX_DESCRIPTION_CHARS = 6_000;

/** Per-job description budget for a prompt containing `jobCount` jobs. */
export function descriptionBudgetPerJob(jobCount: number): number {
  if (jobCount <= 0) {
    return SCORING_MAX_DESCRIPTION_CHARS;
  }
  return Math.min(
    SCORING_MAX_DESCRIPTION_CHARS,
    Math.floor(SCORING_TOTAL_DESCRIPTION_CHARS / jobCount),
  );
}

/**
 * Cut a description at a word boundary within `maxChars`. Applied to plain
 * description strings *before* they are interpolated into the prompt, so the
 * surrounding structure (the JSON instructions, the job ids) can never be
 * truncated mid-shape.
 */
export function truncateAtWordBoundary(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  const slice = text.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > maxChars / 2 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

/**
 * External ids are unique per source only — "123" from Adzuna and "123" from
 * RemoteOK are different jobs, so the source namespaces the id (and Gemini
 * echoes these back as `jobId`).
 */
export function scoringId(job: NormalizedJob): string {
  return `${job.source}:${job.externalId}`;
}

/**
 * C1: serialize every scoring field for the prompt. `desired_roles` keeps the
 * name Gemini has always been shown; `location` rides along because it is both
 * the fallback country signal (B1) and useful match context.
 */
export function buildProfileContext(profile: ProfileScoreContext): string {
  return JSON.stringify({
    years_experience: profile.years_experience,
    experience_level: profile.experience_level,
    skills: profile.skills,
    industries: profile.industries,
    desired_roles: profile.job_titles_seeking,
    work_experience: profile.work_experience,
    remote_preference: profile.remote_preference,
    preferred_locations: profile.preferred_locations,
    current_location: profile.location,
    salary_expectation: profile.salary_expectation,
  });
}

/**
 * Output budget: every job needs room for its reason + matched/missing skill
 * arrays (~256 tokens each) or Gemini hits MAX_TOKENS and the whole batch falls
 * back to zero scores. Sized from the job count, floored at the old 1200.
 */
export function scoringMaxOutputTokens(jobCount: number): number {
  return Math.min(16_384, Math.max(1200, 400 * Math.max(jobCount, 1) + 400));
}

export type ScoringPrompt = {
  system: string;
  prompt: string;
  maxOutputTokens: number;
};

/**
 * Build the complete scoring request. Identical wording to the original
 * inline template (C4: zero-score fallback, thresholds and events stay put —
 * only the construction moved here).
 */
export function buildScoringPrompt(input: {
  jobs: readonly NormalizedJob[];
  profile: ProfileScoreContext;
}): ScoringPrompt {
  const budget = descriptionBudgetPerJob(input.jobs.length);

  const jobList = input.jobs
    .map(
      (job, i) =>
        `Job ${i + 1} (id: "${scoringId(job)}"):
Title: ${job.title}
Company: ${job.company || "Unknown company"}
Description: ${truncateAtWordBoundary(job.description, budget)}`,
    )
    .join("\n\n");

  const prompt = `Score each of the following ${input.jobs.length} jobs against this candidate profile and return JSON with this exact shape:
{
  "results": [
    {
      "jobId": "string — the id field from the job",
      "matchScore": number (0-100),
      "matchReason": "string — one concise paragraph explaining the match",
      "matchedSkills": ["string — skills the job requires that the candidate has"],
      "missingSkills": ["string — skills the job requires that the candidate lacks"]
    }
  ]
}

How to score matchScore:
- List every concrete skill the job explicitly requires or names (languages, frameworks, tools, platforms).
- matchScore is the percentage of THOSE required skills the candidate's profile already covers.
  * All required skills covered = 100.
  * 6 of 8 required skills covered = 75.
  * None covered = 0.
- Ignore skills in the candidate profile that the job never mentions — they do not lower the score.
- matchedSkills must be the required skills the candidate has; missingSkills the required skills they lack.
- If the posting names no concrete skills, fall back to seniority, title and location fit and say so in matchReason.

Candidate profile:
${buildProfileContext(input.profile)}

Jobs to score:
${jobList}`;

  return {
    system: SCORING_SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: scoringMaxOutputTokens(input.jobs.length),
  };
}
