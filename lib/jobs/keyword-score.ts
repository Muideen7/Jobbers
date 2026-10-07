/**
 * Keyword scoring — plan C5: a deterministic profile-vs-posting baseline that
 * *always* runs before (and without) the LLM. Two reasons it exists:
 *
 *  1. Gemini's free tier is 20 requests/day per model — when quota runs out,
 *     every batch used to come back `Score unavailable` / 0 (C4's zero-score
 *     fallback), leaving the jobs table blank and useless.
 *  2. Most searches don't need an LLM to know a React profile doesn't match an
 *     embedded-firmware posting — keywords answer that instantly and free.
 *
 * The AI still refines the same batch when it responds: `reconcileWithAiResults`
 * takes the keyword results as *baseline* and overlays valid AI entries, so a
 * rate-limited or garbage response can only improve, never blank, the scores.
 *
 * The headline score is the *coverage of the job's required skills* — the share
 * of the skills a posting names that the profile already has. All required skills
 * covered = 100%; 6 of 8 = 75%. This is what the candidate asked for ("my 27
 * skills capped me at 59%") and it keeps the number independent of how many
 * skills the profile happens to list.
 *
 * When a posting names no recognisable skill at all, the score falls back to the
 * softer context signals (weights sum 100):
 *   40 title     — desired/past title tokens covered by the posting title
 *                  (generic role words count half)
 *   20 seniority — profile experience level vs level hints in the posting
 *   20 industry  — profile industries named in the posting
 *   20 location  — remote preference + preferred locations vs the posting
 *
 * Relative/type-only imports keep this module loadable under `node --test`.
 */

import {
  scoringId,
  type ProfileScoreContext,
  type ScoredResult,
} from "./scoring-prompt.ts";
import type { NormalizedJob } from "./types.ts";

export type KeywordScore = Omit<ScoredResult, "jobId">;

/**
 * Weights for the *secondary* signals only. The headline score is required-skill
 * coverage; these weights only apply when a posting names no recognisable skills
 * (see `keywordScore`). Sum 100.
 */
export const KEYWORD_SCORE_WEIGHTS = {
  title: 40,
  seniority: 20,
  industry: 20,
  location: 20,
} as const;

/** Title tokens that carry no distinctive meaning ("Frontend *Engineer*"). */
const GENERIC_ROLE_WORDS = new Set([
  "engineer",
  "developer",
  "dev",
  "programmer",
  "specialist",
  "consultant",
  "manager",
  "lead",
  "analyst",
  "architect",
  "designer",
  "scientist",
  "member",
  "officer",
  "head",
  // level words — they describe seniority, not the domain
  "senior",
  "junior",
  "mid",
  "entry",
  "staff",
  "principal",
  "associate",
  "trainee",
]);

const TITLE_STOPWORDS = new Set([
  "a", "an", "the", "of", "and", "for", "with", "at", "in", "on", "to", "is",
  "or", "job", "jobs", "role", "roles", "position", "remote",
]);

/** Common title spellings normalized so "Developer" and "Engineer" align. */
const ROLE_SYNONYMS: Record<string, string> = {
  developer: "engineer",
  dev: "engineer",
  programmer: "engineer",
};

/** Extra literal forms a posting might use for a given skill. */
const SKILL_SYNONYMS: Record<string, string[]> = {
  go: ["golang"],
  js: ["javascript"],
  ts: ["typescript"],
  k8s: ["kubernetes"],
  postgres: ["postgresql"],
  "c#": ["csharp", "c sharp"],
  ".net": ["dotnet"],
  node: ["nodejs"],
};

/**
 * Skills we can recognise in a posting that the profile may or may not cover —
 * these become `missingSkills` ("Gap skills") on the job detail page. Kept
 * deliberately general: languages, frameworks, clouds, data and tooling a
 * job posting is likely to name.
 */
const TECH_SKILLS = [
  // languages
  "JavaScript", "TypeScript", "Python", "Java", "Go", "Rust", "C++", "C#",
  "Ruby", "PHP", "Swift", "Kotlin", "Scala", "Elixir", "Erlang", "Haskell",
  "Perl", "Lua", "Dart", "Julia", "Objective-C",
  // web frameworks & UI
  "React", "Angular", "Vue", "Next.js", "Nuxt", "Svelte", "Ember", "jQuery",
  "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring", "Rails",
  "Laravel", "ASP.NET", "Electron", "Three.js", "HTML", "CSS", "Tailwind",
  "Bootstrap", "Sass", "Less", "Redux", "Zustand", "Storybook", "Figma",
  // data & storage
  "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Cassandra", "DynamoDB",
  "Elasticsearch", "Oracle", "SQLite", "Kafka", "RabbitMQ", "GraphQL", "gRPC",
  "Snowflake", "Spark", "Hadoop", "Airflow", "Pandas", "NumPy", "PyTorch",
  "TensorFlow", "scikit-learn",
  // cloud & devops
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Ansible",
  "Jenkins", "Git", "GitHub Actions", "CI/CD", "Linux", "Nginx", "Firebase",
  "Supabase",
  // testing & build
  "Jest", "Cypress", "Playwright", "Selenium", "Mocha", "JUnit", "Webpack",
  "Vite", "Babel", "Gradle", "Maven",
  // mobile & product surface
  "React Native", "Flutter", "Android", "iOS", "WordPress", "Shopify",
  "Stripe", "OAuth", "JWT", "Salesforce", "SAP", "Jira",
] as const;

type Band = "entry" | "mid" | "senior" | "exec";

/** Distance 0..3 → points 20/12/6/2 when both sides have a known band. */
const BAND_DISTANCE_POINTS = [20, 12, 6, 2] as const;
const UNKNOWN_BAND_POINTS = 12;

/** Order matters: "Senior Director" resolves to exec, "Mid-Senior" to mid. */
const BAND_PATTERNS: ReadonlyArray<[Band, RegExp]> = [
  ["entry", /\b(entry|junior|intern|internship|graduate|trainee|assistant)\b/i],
  ["exec", /\b(director|executive|vice president|vp|chief|cxo)\b/i],
  ["mid", /\b(mid|intermediate|associate)\b/i],
  ["senior", /\b(senior|lead|principal|staff|architect|head of)\b/i],
];

const BAND_INDEX: Record<Band, number> = { entry: 0, mid: 1, senior: 2, exec: 3 };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Lowercase, separators → single spaces: "React.js" → "react js". */
function normalizePhrase(value: string): string {
  return value.toLowerCase().replace(/[.\s_\-/]+/g, " ").trim();
}

/** Separators removed: "React.js" → "reactjs" (js-ecosystem spellings). */
function compactForm(value: string): string {
  return value.toLowerCase().replace(/[.\s_\-/]+/g, "");
}

function mentionsExact(rawText: string, term: string): boolean {
  const pattern = new RegExp(
    `(^|[^A-Za-z0-9])${escapeRegExp(term)}([^A-Za-z0-9]|$)`,
  );
  return pattern.test(rawText);
}

function mentionsInsensitive(lowerText: string, term: string): boolean {
  const pattern = new RegExp(
    `(^|[^a-z0-9])${escapeRegExp(term)}([^a-z0-9]|$)`,
  );
  return pattern.test(lowerText);
}

/**
 * Does `rawText` mention `skill`?
 *
 * - Pure short lowercase-mixed words ("Go") require the posting to spell them
 *   exactly as the skill does, so the English verb "go" never scores a point.
 * - Everything else — acronyms included ("AWS", "SQL", "C#") — is a
 *   case-insensitive word/phrase boundary match; forms containing a separator
 *   ("Next.js", "CI/CD", "Tailwind CSS") also try a compact spelling against
 *   separator-stripped text.
 */
export function skillInText(rawText: string, skill: string): boolean {
  const lowerText = rawText.toLowerCase();
  const variants = [skill, ...(SKILL_SYNONYMS[skill.toLowerCase()] ?? [])];

  for (const variant of variants) {
    const alnumLength = variant.replace(/[^A-Za-z0-9]/g, "").length;
    if (alnumLength === 0) continue;

    if (/^[A-Za-z]{1,3}$/.test(variant) && variant !== variant.toUpperCase()) {
      if (mentionsExact(rawText, variant)) return true;
      continue;
    }

    const phrase = normalizePhrase(variant);
    if (phrase && mentionsInsensitive(lowerText, phrase)) return true;

    if (/[.\s_\-/]/.test(variant)) {
      const compact = compactForm(variant);
      if (compact.length >= 4 && compactForm(lowerText).includes(compact)) {
        return true;
      }
    }
  }
  return false;
}

/** Does the profile already cover this gap skill (exact or via synonyms)? */
function profileKnows(term: string, profileSkills: string[] | null): boolean {
  if (!profileSkills?.length) return false;
  const set = new Set(profileSkills.map((s) => s.toLowerCase()));
  const key = term.toLowerCase();
  if (set.has(key)) return true;
  if ((SKILL_SYNONYMS[key] ?? []).some((s) => set.has(s))) return true;
  for (const skill of set) {
    if ((SKILL_SYNONYMS[skill] ?? []).includes(key)) return true;
  }
  return false;
}

/** Everything the posting says about itself. */
function postingText(job: NormalizedJob): string {
  return [
    job.title,
    job.company,
    job.category ?? "",
    job.description,
    ...job.highlights.requirements,
    ...job.highlights.responsibilities,
  ].join("\n");
}

function desiredTitles(profile: ProfileScoreContext): string[] {
  const fromExperience = (profile.work_experience ?? [])
    .map((w) => w.title)
    .filter(Boolean);
  return [...(profile.job_titles_seeking ?? []), ...fromExperience];
}

function titleTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token && !TITLE_STOPWORDS.has(token))
    .map((token) => ROLE_SYNONYMS[token] ?? token);
}

/** 0–40 of the fallback weight: desired/past title tokens covered by the posting title. */
function titlePoints(profile: ProfileScoreContext, job: NormalizedJob): number {
  const titles = desiredTitles(profile);
  if (titles.length === 0) return 0;

  const jobTokens = new Set(titleTokens(job.title));
  if (jobTokens.size === 0) return 0;

  let best = 0;
  for (const desired of titles) {
    const desiredTokens = titleTokens(desired);
    if (desiredTokens.length === 0) continue;

    const shared = desiredTokens.filter((t) => jobTokens.has(t));
    const recall = shared.length / desiredTokens.length;

    const desiredDistinct = desiredTokens.filter((t) => !GENERIC_ROLE_WORDS.has(t));
    const distinctRecall = desiredDistinct.length
      ? desiredDistinct.filter((t) => jobTokens.has(t)).length / desiredDistinct.length
      : recall;

    best = Math.max(best, 0.5 * recall + 0.5 * distinctRecall);
  }
  return Math.round(KEYWORD_SCORE_WEIGHTS.title * best);
}

function resolveBand(value: string): Band | null {
  for (const [band, pattern] of BAND_PATTERNS) {
    if (pattern.test(value)) return band;
  }
  return null;
}

/** 0–20 of the fallback weight: profile experience level vs the posting's level hints. */
function seniorityPoints(profile: ProfileScoreContext, job: NormalizedJob): number {
  const profileBand = profile.experience_level
    ? resolveBand(profile.experience_level)
    : null;

  let jobBand = resolveBand(`${job.title}\n${job.description.slice(0, 600)}`);
  if (!jobBand) {
    // No explicit level word — infer from the first "N+ years" ask.
    const years = job.description.match(/(\d+)\s*\+?\s*(?:-\s*\d+)?\s*years?/i);
    if (years) {
      const n = Number(years[1]);
      jobBand = n <= 2 ? "entry" : n <= 4 ? "mid" : "senior";
    }
  }

  if (!profileBand || !jobBand) return UNKNOWN_BAND_POINTS;
  const distance = Math.abs(BAND_INDEX[profileBand] - BAND_INDEX[jobBand]);
  return BAND_DISTANCE_POINTS[distance] ?? UNKNOWN_BAND_POINTS;
}

/** 0–20 of the fallback weight: a named profile industry appears in the posting (absent signal = full). */
function industryPoints(profile: ProfileScoreContext, rawText: string): number {
  const industries = profile.industries ?? [];
  if (industries.length === 0) return KEYWORD_SCORE_WEIGHTS.industry;
  return industries.some((industry) => skillInText(rawText, industry))
    ? KEYWORD_SCORE_WEIGHTS.industry
    : 0;
}

type RemotePreference = "none" | "remote" | "hybrid" | "onsite";

function parseRemotePreference(value: string | null): RemotePreference {
  const normalized = (value ?? "").toLowerCase();
  if (!normalized || normalized === "any") return "none";
  if (normalized.includes("hybrid")) return "hybrid";
  if (normalized.includes("on-site") || normalized.includes("onsite")) {
    return "onsite";
  }
  if (normalized.includes("remote")) return "remote";
  return "none";
}

/** 0–20 of the fallback weight: 12 for remote fit + 8 for location fit; absent signals give full points. */
function locationPoints(profile: ProfileScoreContext, job: NormalizedJob): number {
  const preference = parseRemotePreference(profile.remote_preference);
  let points: number;
  switch (preference) {
    case "remote":
      points = job.remote ? 12 : 0;
      break;
    case "onsite":
      points = job.remote ? 0 : 12;
      break;
    case "hybrid":
      points = 6;
      break;
    case "none":
      points = 12;
      break;
  }

  const preferred = (profile.preferred_locations ?? [])
    .map((l) => l.toLowerCase().trim())
    .filter((l) => l.length >= 2);
  if (preferred.length === 0) return points + 8;

  const jobLocation = (job.location ?? "").toLowerCase();
  if (!jobLocation || jobLocation.includes("unknown location")) {
    return points + 4;
  }
  const locationMatch =
    preferred.some(
      (l) => jobLocation.includes(l) || (l.length > 3 && l.includes(jobLocation)),
    ) ||
    (job.remote && preferred.some((l) => l.includes("remote")));
  return points + (locationMatch ? 8 : 0);
}

/**
 * Is `phrase` a whole-word run inside `container`? "CSS" inside "Tailwind CSS"
 * yes; "SQL" inside "PostgreSQL" no. Used to drop sub-skills that are just
 * fragments of a longer skill name.
 */
function containsPhrase(container: string, phrase: string): boolean {
  const haystack = normalizePhrase(container);
  const needle = normalizePhrase(phrase);
  if (!needle || needle === haystack) return false;
  return new RegExp(`(^| )${escapeRegExp(needle)}( |$)`).test(haystack);
}

/**
 * Every recognisable skill a posting names — the denominator of the match score.
 * Profile skills come first (so their spelling wins) and known tech terms fill
 * in the rest. Deduplicated case-insensitively, and fragment skills that are a
 * whole word inside a longer one ("CSS"/"Tailwind" ⊂ "Tailwind CSS") drop out so
 * one requirement never counts twice.
 */
function jobSkillsIn(job: NormalizedJob, profileSkills: string[]): string[] {
  const rawText = postingText(job);
  const seen = new Set<string>();
  const skills: string[] = [];

  const add = (skill: string): void => {
    const key = skill.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    skills.push(skill);
  };

  for (const skill of profileSkills) {
    if (skillInText(rawText, skill)) add(skill);
  }
  for (const tech of TECH_SKILLS) {
    if (skillInText(rawText, tech)) add(tech);
  }

  return skills.filter(
    (skill) => !skills.some((other) => containsPhrase(other, skill)),
  );
}

function buildReason(input: {
  profile: ProfileScoreContext;
  matchedSkills: string[];
  missingSkills: string[];
  requiredCount: number;
  titleMatched: boolean;
}): string {
  const { profile, matchedSkills, missingSkills, requiredCount, titleMatched } =
    input;
  const totalProfileSkills = profile.skills?.length ?? 0;
  const titles = desiredTitles(profile);

  if (totalProfileSkills === 0 && titles.length === 0) {
    return "Profile too thin to score — add skills and desired roles to improve matching.";
  }

  const parts: string[] = [];
  if (requiredCount > 0) {
    if (matchedSkills.length > 0) {
      const shown = matchedSkills.slice(0, 4).join(", ");
      const more = matchedSkills.length > 4 ? ", …" : "";
      parts.push(
        `${matchedSkills.length}/${requiredCount} required skills covered (${shown}${more})`,
      );
    } else {
      parts.push(
        `None of the ${requiredCount} skills this role asks for are on your profile`,
      );
    }
  } else {
    parts.push(
      "This posting names no specific skills — scored on title, level and location",
    );
  }
  if (titles.length > 0) {
    parts.push(
      titleMatched
        ? `Title fits ${titles[0]}`
        : `Title does not match your desired roles`,
    );
  }
  if (missingSkills.length > 0) {
    parts.push(`Gap skills mentioned: ${missingSkills.slice(0, 3).join(", ")}`);
  }

  const reason = `${parts.join(". ")}.`;
  return reason.length > 260 ? `${reason.slice(0, 257)}…` : reason;
}

/**
 * Score one posting against the profile — deterministic, synchronous, no I/O.
 *
 * The headline number is *required-skill coverage*: the share of the skills the
 * posting names that the profile already covers. Cover everything and it is
 * 100%; cover 6 of 8 and it is 75%. The score no longer depends on how many
 * skills the profile lists, which is what used to cap good matches in the 50s.
 *
 * Postings that name no recognisable skill fall back to the softer context
 * signals (title/seniority/industry/location), so they still rank sensibly.
 */
export function keywordScore(
  job: NormalizedJob,
  profile: ProfileScoreContext,
): KeywordScore {
  const rawText = postingText(job);
  const profileSkills = profile.skills ?? [];

  const jobSkills = jobSkillsIn(job, profileSkills);
  const matchedSkills = jobSkills.filter((skill) =>
    profileKnows(skill, profileSkills),
  );
  const missingSkills = jobSkills
    .filter((skill) => !profileKnows(skill, profileSkills))
    .slice(0, 8);

  const title = titlePoints(profile, job);

  const matchScore =
    jobSkills.length > 0
      ? Math.round((matchedSkills.length / jobSkills.length) * 100)
      : Math.max(
          0,
          Math.min(
            100,
            Math.round(
              title +
                seniorityPoints(profile, job) +
                industryPoints(profile, rawText) +
                locationPoints(profile, job),
            ),
          ),
        );

  return {
    matchScore,
    matchReason: buildReason({
      profile,
      matchedSkills,
      missingSkills,
      requiredCount: jobSkills.length,
      titleMatched: title >= KEYWORD_SCORE_WEIGHTS.title / 2,
    }),
    matchedSkills,
    missingSkills,
  };
}

/** Keyword baseline for a whole batch, shaped like AI results for reconciliation. */
export function keywordScoreBatch(
  jobs: readonly NormalizedJob[],
  profile: ProfileScoreContext,
): ScoredResult[] {
  return jobs.map((job) => ({
    jobId: scoringId(job),
    ...keywordScore(job, profile),
  }));
}

function validAiEntry(value: unknown): value is Partial<ScoredResult> {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Partial<ScoredResult>;
  return (
    typeof entry.matchScore === "number" &&
    Number.isFinite(entry.matchScore) &&
    entry.matchScore >= 0 &&
    entry.matchScore <= 100
  );
}

function stringArray(value: unknown): string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
}

/**
 * C5: overlay valid AI entries on the keyword baseline. The AI wins when it
 * answers with a usable score; anything missing, malformed or out of range
 * keeps the keyword result — an LLM failure can degrade quality, never
 * blank the table (the C4 all-zeros outcome).
 */
export function reconcileWithAiResults(
  baseline: readonly ScoredResult[],
  parsed: { results?: unknown },
): ScoredResult[] {
  const results = Array.isArray(parsed.results)
    ? (parsed.results as unknown[])
    : [];

  return baseline.map((fallback, index) => {
    const candidate =
      results.find(
        (r): r is Partial<ScoredResult> =>
          validAiEntry(r) && r.jobId === fallback.jobId,
      ) ??
      (validAiEntry(results.at(index)) ? (results.at(index) as Partial<ScoredResult>) : undefined);

    if (!candidate) return fallback;

    return {
      jobId: fallback.jobId,
      matchScore: Math.round(candidate.matchScore as number),
      matchReason:
        typeof candidate.matchReason === "string" && candidate.matchReason.trim()
          ? candidate.matchReason.trim()
          : fallback.matchReason,
      matchedSkills: stringArray(candidate.matchedSkills) ?? fallback.matchedSkills,
      missingSkills: stringArray(candidate.missingSkills) ?? fallback.missingSkills,
    };
  });
}
