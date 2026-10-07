import type { Job } from "@/types";

/**
 * Pure preview-summary helpers for the job detail panel. Feed descriptions
 * almost always *lead* with company boilerplate ("About ActAI — our mission
 * is…"), so a naive first-N-words cut of `about_role` describes the company
 * instead of the role. These helpers keep the summary role-focused and capped:
 *
 * 1. Prefer the parsed `responsibilities` list — the cleanest "what the role
 *    actually does" signal (JSearch populates it; Adzuna/Arbeitnow do not).
 * 2. Fall back to the description, skipping the leading company-intro block by
 *    starting at the first role heading ("The Role", "What You'll Work On", …).
 * 3. Always cap the result at `ROLE_SUMMARY_MAX_WORDS` words.
 *
 * Free of React and InsForge so `node --test` can cover it.
 */

export const ROLE_SUMMARY_MAX_WORDS = 90;

/** Strips scraper HTML/entities (scraped postings carry `<p>/<ul>/<li>` markup) and flattens whitespace. */
export function toPlainText(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** First `maxWords` words of `text`, with an ellipsis when truncating. */
export function summarizeText(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}…`;
}

/** Headings that mark where a description stops selling the company and starts describing the role. */
const ROLE_HEADING_RE =
  /\b(the role|the job|about the role|about this role|role overview|position summary|job summary|job description|responsibilities|what you'?ll (do|work on)|what you will (do|work on)|the position|what you do|the opportunity|overview)\b/i;

/**
 * Role-focused preview summary for a job, capped at ROLE_SUMMARY_MAX_WORDS.
 * Returns null when there is nothing role-focused to show.
 */
export function buildRoleSummary(
  job: Pick<Job, "about_role" | "responsibilities">,
): string | null {
  if (job.responsibilities.length > 0) {
    const joined = job.responsibilities.join(" ");
    const plain = toPlainText(joined);
    if (plain) return summarizeText(plain, ROLE_SUMMARY_MAX_WORDS);
  }

  if (!job.about_role) return null;

  const plain = toPlainText(job.about_role);
  if (!plain) return null;

  let startAt = 0;
  const heading = plain.match(ROLE_HEADING_RE);
  if (heading?.index !== undefined && heading.index > 0) {
    // Skip leading company intro up to the first role heading.
    startAt = heading.index;
  }

  return summarizeText(plain.slice(startAt).trim(), ROLE_SUMMARY_MAX_WORDS);
}