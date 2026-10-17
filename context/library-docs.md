# Library Docs

Project-specific usage patterns for every third party library in this project. This file only covers how we use each library in this specific project — rules, patterns, and constraints specific to Jobbers.

Read the relevant section before implementing any feature that touches these libraries.

---

## Before Using Any Library

Before implementing any feature that uses a third party library:

1. **Check AGENTS.md** at the project root — it lists every skill installed for this project and how to use them. Skills contain up-to-date API documentation, usage patterns, and best practices specific to this codebase.

2. **Check if an MCP server is configured** for that library. Some tools have MCP servers that give the AI agent direct access to documentation, logs, and debugging tools. If an MCP server is available — use it before falling back to general knowledge.

3. **Read this file** for project-specific patterns that override general library knowledge.

The order of authority is:

```
MCP server (real-time docs) → Skills via AGENTS.md → This file (project rules) → General training knowledge
```

Never rely on general training knowledge alone for library APIs — they change frequently and training data may be outdated.

---

## shadcn/ui primitives (self-hosted, Jobbers-mapped)

**Check first:** no installed skill for these — they are plain,
hand-written variants of the classic shadcn/ui components. Read
`context/ui-registry.md` → "shadcn/ui Primitives" before using them.

### What was installed and why

| Package | Used by |
| --- | --- |
| `class-variance-authority` | `cva()` variant mapping in `components/ui/{button,badge,card}.tsx` |
| `clsx` + `tailwind-merge` | `cn(...)` in `lib/utils.ts` — `twMerge` deliberately keeps `border-ink`/`shadow-sm` (dashboard overrides) winning over `border-border`/`shadow-card` |
| `@radix-ui/react-dialog` | `components/ui/dialog.tsx` (ResumeDropzone/ExtractedReviewDialog, review flow) |
| `@radix-ui/react-slider` | `components/ui/slider.tsx` (FilterSidebar AI threshold) |
| `@radix-ui/react-scroll-area` | `components/ui/scroll-area.tsx` (sticky dashboard columns) |
| `@radix-ui/react-slot` | `asChild` composition in button/badge/dialog |

### Rules

- **The CLI / `shadcn init` must never run** — it rewrites `app/globals.css`.
  All primitives in `components/ui/` are hand-written and token-mapped
  (see the ui-registry token-pair table: `primary`→ink, `card`→surface,
  `muted`→surface-secondary, `destructive`→error, overlay `bg-ink/40`).
- `cn()` / `getInitials()` are the only additions to `lib/utils.ts` from this
  feature; `getMatchBadgeVariant` chose the score badge variant
  (success ≥ `MATCH_THRESHOLD` / info 60–69 / warning <60 / secondary null).
- Tailwind v4 arbitrary-variant gotcha: use `[&_svg]` (underscore) for
  descendant selectors — `[&svg]` generates an invalid `:is(...)svg` rule
  that breaks the CSS build (real bug, fixed in `badge.tsx`).
- `exactOptionalPropertyTypes` is on: never pass explicit `undefined` to an
  optional prop — spread conditionally (`{...(cond ? { prop } : {})}`).
- `react-hooks` v6 lint is strict: no synchronous `setState` inside effects
  (use the sanctioned adjust-state-during-render pattern) and no impure
  calls like `Date.now()` during render.
- Focus ring convention (v4): `outline-2 outline-offset-[3px]
  focus-visible:outline-accent`.
- These primitives complement — not replace — the `.btn` system; app pages
  outside the dashboard keep `.btn btn-primary`.

---

## MongoDB Atlas & Better Auth

### Client & Connection (`lib/mongodb.ts`)

MongoDB is accessed via the official `mongodb` driver. A singleton `MongoClient` is cached on `globalThis._mongoClient` in development to prevent connection exhaustion during hot reloads:

```typescript
// lib/mongodb.ts
import { MongoClient, ServerApiVersion, type Document } from "mongodb";

const client: MongoClient = ...;
export default client;

export async function getCollection<TSchema extends Document>(collectionName: string) {
  const connectedClient = await client.connect();
  return connectedClient.db().collection<TSchema>(collectionName);
}
```

### Authentication (`lib/betterAuth.ts` & `lib/auth.ts`)

Better Auth handles sessions, email/password validation (enforcing $\ge 8$ chars), and OAuth providers (GitHub & Google) backed by `@better-auth/mongo-adapter`.

```typescript
// lib/auth.ts — Server session check
import { auth } from "@/lib/betterAuth";
import { headers } from "next/headers";

export async function getCurrentUser() {
  const headerList = await headers();
  const session = await auth.api.getSession({ headers: headerList });
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return user;
}
```

### Database Operations (`lib/profile.ts`, `lib/dashboard.ts`, `lib/resumes.ts`)

```typescript
// Read profile
import { getUserProfile, upsertUserProfile } from "@/lib/profile";

const profile = await getUserProfile(user.id);

// Upsert profile
await upsertUserProfile(user.id, {
  full_name: "Jane Doe",
  skills: ["React", "TypeScript", "Node.js"],
});
```

**Rules:**
- All queries must be scoped to `userId` or `user.id`.
- Always serialize MongoDB `_id` to string (`_id.toString()`) and `Date` instances to ISO strings before passing to Client Components.
- Use `getCollection<TSchema>("name")` for type-safe collection access.

**Storage paths:**

- Base resume: `resumes/{user_id}/resume.pdf`

**Rules:**

- Always use `upsert: true` for base resume uploads — overwrites existing file
- Always save the public URL back to the DB after upload
- Never write files to disk — always upload buffer directly to storage

---

## Adzuna API

**Check first:** Check AGENTS.md for an installed Adzuna skill. If none exists — use this file and the official Adzuna API docs.

### Job Search

```typescript
// lib/adzuna.ts
export async function searchJobs(
  jobTitle: string,
  location: string,
  country: string = "us",
): Promise<AdzunaJob[]> {
  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID!,
    app_key: process.env.ADZUNA_APP_KEY!,
    what: jobTitle,
    category: "it-jobs", // always filter to IT jobs
    results_per_page: "10",
    "content-type": "application/json",
  });

  // Only add where if location is provided
  if (location) {
    params.set("where", location);
  }

  const response = await fetch(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`,
  );

  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}
```

### Response Shape

Each Adzuna job result contains:

```typescript
type AdzunaJob = {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string; // snippet only — not full description
  redirect_url: string; // Adzuna tracking URL → redirects to actual job
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted: "0" | "1"; // "1" means salary is estimated
  contract_type?: string;
  created: string; // ISO date string
  category: { tag: string; label: string };
};
```

### Saving Jobs to DB

```typescript
// Map Adzuna result to jobs table
const jobRecord = {
  user_id: userId,
  run_id: runId,
  source: "adzuna", // provider id (plan A7); legacy pre-A7 rows say "search"
  source_url: job.redirect_url,
  external_apply_url: job.redirect_url,
  title: job.title,
  company: job.company.display_name,
  location: job.location.display_name,
  salary: job.salary_min
    ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round(job.salary_max! / 1000)}k`
    : null,
  job_type: job.contract_type || "fulltime",
  about_role: job.description, // Adzuna returns snippet — used as description
  match_score: scoredJob.matchScore,
  match_reason: scoredJob.matchReason,
  matched_skills: scoredJob.matchedSkills,
  missing_skills: scoredJob.missingSkills,
  found_at: new Date().toISOString(),
};
```

**Rules:**

- Always include `category=it-jobs` — never search Adzuna without this filter
- Never pass `where` if location is empty — omit the parameter entirely
- `source` stores the provider id (`adzuna`, `jsearch`, …) on new rows — legacy pre-A7 rows say `'search'` (all Adzuna); `'url'` only for hand-saved listings
- `salary_is_predicted: "1"` means Adzuna estimated the salary — this is normal
- Attribution is per source: credit every source present in the rendered results through `lib/source-attribution.ts` + `components/shared/SourceCredits.tsx` (RemoteOK/Remotive/Jobicy ToS require on-site link-backs; legacy "search" rows credit Adzuna)
- Adzuna description is a snippet — Gemini scores from it, not a full description
- Country must come from `detectCountry` (`lib/jobs/country.ts`), never a hardcoded literal — the provider itself skips the 19-country list's absence (`ADZUNA_SUPPORTED_COUNTRIES`, plan B1: `ng` → skipped before any fetch, no 404)

---

## JSearch API (OpenWeb Ninja)

**Check first:** Check AGENTS.md for an installed JSearch skill. If none exists — use this file, `https://www.openwebninja.com/api/jsearch/llms.txt` (markdown docs) and the OpenAPI spec at `https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/jsearch.yaml`.

### Job Search

```typescript
import { searchJsearch, jsearchProvider } from "@/lib/jobs/jsearch.ts";
// NOTE: lib/jobs/* files import each other with relative ".ts" paths on purpose —
// `node --test` does not resolve the "@/…" alias. Keep that style inside lib/jobs/.

const jobs = await searchJsearch(
  { title: "frontend developer", location: "Lagos", country: "ng" },
  { numPages: 1 }, // optional; 1–20, default 1
);
```

### Endpoint & Auth

- `GET https://api.openwebninja.com/jsearch/search-v2`
- Header `x-api-key: $JSEARCH_API_KEY` — free tier at https://app.openwebninja.com/api/jsearch (200 requests/month, 1000/hour, no card)
- **Each page = 1 credit.** `num_pages` 1–20, each page returns ~10 jobs — so one request can return up to 200 jobs. Always cache results (the A6 orchestrator owns this).

### Response Shape

```typescript
{
  status: "OK",
  request_id: string,
  parameters: { query, cursor, num_pages, country, … },
  data: {
    jobs: [ /* see below */ ],
    cursor: string | null, // pass back as ?cursor= for the next page
  },
}
```

Key job fields (full list in the OpenAPI spec): `job_id`, `job_title`,
`employer_name`, `job_apply_link`, `job_description` (FULL text, unlike
Adzuna's snippet), `job_location`/`job_city`/`job_state`/`job_country` (ISO
alpha-2), `job_min_salary`/`job_max_salary`/`job_salary_period`,
`job_posted_at_datetime_utc`, `job_employment_types[]`, `job_is_remote`,
`job_google_link`, `job_highlights` (keys *typically* `Qualifications`,
`Responsibilities`, `Benefits` — parse case-insensitively, may be absent).

### Rules

- Query phrasing matters: put location inside `query` — `"developer jobs in chicago"`; `lib/jobs/jsearch.ts` (`buildJsearchParams`) builds this, don't hand-roll it
- `country` is ISO 3166-1 alpha-2 and works for **every** country (including `ng`) — unlike Adzuna's 19-country list
- Normalize through `lib/jobs/jsearch.ts` (`normalizeJsearchJob` → `NormalizedJob`) — never consume the raw payload downstream
- zod gotcha: `z.unknown()` rejects *missing* keys in zod v4 — use `.optional()` (this is why `job_highlights` is `z.unknown().optional()`)
- 401/403 → key problem, 429 → monthly quota: the provider throws human-readable messages for both; never surface raw HTTP errors to users
- Live check: `node --env-file=.env.local tests/jsearch-smoke.ts` (NG, US, GB)

---

## Arbeitnow & Remote Feeds (keyless providers)

**Check first:** none of these have an installed skill — use this section. All four
are free, keyless, public APIs verified live 2026-10-06.

### Providers

```typescript
import { searchArbeitnow, arbeitnowProvider } from "@/lib/jobs/arbeitnow.ts";
import { remoteokProvider, remotiveProvider, jobicyProvider } from "@/lib/jobs/remote-feeds.ts";
// Relative ".ts" imports inside lib/jobs/ — node --test cannot resolve "@/…" (same as JSearch).
```

| Source | Endpoint | Notes |
| --- | --- | --- |
| Arbeitnow | `GET www.arbeitnow.com/api/job-board-api` | `{ data, links, meta }`, 325 jobs/page, `?page=` pagination, hourly updates. No `?search=` (ignored) |
| RemoteOK | `GET remoteok.com/api` | Plain array; element 0 is `{ last_updated, legal }` metadata → parser skips it. `?search=`/`?tag=` **ignored** |
| Remotive | `GET remotive.com/api/remote-jobs` | Wrapper keys are hyphenated (`job-count`). `?search=` currently ignored; free feed ≈ 18 jobs |
| Jobicy | `GET jobicy.com/api/v2/remote-jobs?count=100` | `{ success, jobs, … }`; `tag`/`count` filter but `tag` semantics are unreliable for free text. Error payloads are `success:false` **without** `jobs` |

### Rules

- Normalize through each provider's `parse*Response`/`normalize*Job` → `NormalizedJob`; never consume raw payloads downstream
- All four are `searchMode: "client"` — they return the full feed and `searchAll` applies the local title-token filter (server-searched sources are Adzuna + JSearch only)
- **Caching/caps are mandatory and owned by `lib/jobs/search-all.ts`:** Remotive's ToS says ~4 GETs/day ("excessive requests will be blocked") → 6 h TTL + daily cap of 4; Arbeitnow/RemoteOK/Jobicy → 30 min TTL (big payloads: Arbeitnow is ~2.8 MB); 300-entry cache cap
- Remotive `publication_date` is naive ISO → parser appends `Z` (their timestamps are UTC); don't parse it in server-local time
- Remotive `salary` is free-form (`"$45-$120/Hour"`) → goes into `NormalizedJob.salaryText`, never parsed into min/max
- Jobicy `jobDescription` may be absent → `jobExcerpt` fallback
- **Attribution (plan A7, ToS-blocking):** RemoteOK, Remotive, Jobicy all require an on-site link-back naming the source; Arbeitnow asks for one too. Any UI rendering these feeds must credit them (alongside the existing "Jobs by Adzuna")
- Live check (no keys needed): `node tests/job-sources-smoke.ts`

---

## searchAll Orchestrator

`lib/jobs/search-all.ts` is the single entry point for job discovery:

```typescript
import { searchAll } from "@/lib/jobs/search-all";
import { detectCountry } from "@/lib/jobs/country";

const { jobs, outcomes } = await searchAll(
  { title: "frontend developer", location: "Lagos", country: detectCountry("Lagos") }, // plan B1 — never hardcode the country
  { maxResults: 40 }, // providers/state/now/sourceTtlMs/dailyLimits injectable for tests
);
```

- Registry order = output priority: `jsearch → arbeitnow → remoteok → jobicy → remotive → adzuna` — **Adzuna sits last as the fallback** (19 countries only) and must never lead the merged list again; a registry-order test locks this in
- Fans out over `PROVIDER_REGISTRY` with `Promise.allSettled`; a failing source becomes `{ source, count: 0, error }` in `outcomes` — it never throws and never kills the run
- Cross-source dedupe: lowercase/punctuation-normalized `title|company` fingerprint, fuller description wins
- `searchMode: "client"` sources are filtered locally against title tokens (≥3 chars); zero tokens disables the filter
- `remoteOnly: true` on the query maps to JSearch's `work_from_home` param (the only server-side remote filter); every other source is post-filtered on `NormalizedJob.remote` by the caller
- Both search surfaces run on it: `/api/agent/find` and the public `/api/public/jobs` — the latter's legacy `filter` chips *and* the five landing dropdowns (`category`, `country`, `salary`, `skills`, `employment`) are post-filters in `lib/public-jobs.ts`, and its response reports `data.sources[]` (the sources of the rendered cards) plus `data.facets.categories` (categories still available under the other active filters) so the UI can render the attribution line and the Job Categories dropdown
- Logging: per-provider failures are `console.error`'d as `[jobs/searchAll] <source>: …`
- Routes must map `NormalizedJob` → their own shapes; scoring ids need the `source:externalId` namespace (raw externalIds collide across sources)

### Country detection (plan B1)

`lib/jobs/country.ts` owns the search country — routes must never hardcode one:

```typescript
import { detectCountry } from "@/lib/jobs/country";

const country = detectCountry(searchLocation, [
  ...(profile.preferred_locations ?? []),
  profile.location,
]); // → "ng"; falls back to "us" when nothing resolves
```

- Detection order: search location → profile `preferred_locations` → profile `location` → `DEFAULT_COUNTRY` (`"us"`); each step tries city table (`Lagos→ng`, `London→gb`, `Accra→gh`, diacritics stripped) → country-name aliases (`uk→gb`, `south africa→za`) → bare two-letter codes **only when known** (a stray `uu` returns null, never a guess)
- `/api/public/jobs` uses its `country` param when the landing dropdown picks a resolvable market (`countryFromText("Nigeria")` → `ng`, the raw text is passed to `searchAll` as `location` so JSearch embeds it in its query); with no selection — or junk it cannot resolve — it calls `detectCountry()` with no candidates → `us` default. `matchesPublicCountry` then post-filters for sources that ignore the market: remote/unresolvable locations pass, clear other-country locations drop
- The result feeds JSearch (valid ISO code for any country) and the Adzuna provider; the remote feeds ignore country
- **Adzuna skips unsupported codes silently**: `isAdzunaCountrySupported` / `ADZUNA_SUPPORTED_COUNTRIES` (19 codes) in `lib/jobs/adzuna.ts` — outside the list the provider returns `[]` *before any fetch*, so `ng` searches never produce a 404 `UNSUPPORTED_COUNTRY`

### Source failure warnings (plan B2)

A failing source must never fail the run. `lib/jobs/source-warnings.ts`:

```typescript
import { sourceWarningLogRows } from "@/lib/jobs/source-warnings";

const rows = sourceWarningLogRows({ runId, userId: user.id, outcomes: result.outcomes });
if (rows.length > 0) await (await getCollection("agent_logs")).insertMany(rows);
```

- One `agent_logs` row (level `"warning"`, message names source + error + "Run continued") per errored outcome — insert failures are `console.error`'d, never thrown
- `/api/agent/find` inserts them right after `searchAll`, before the empty-result branch, so even an all-sources-down run records why while `agent_runs.status` stays `"completed"` (only unexpected throws reach the catch that marks a run `failed`)

### Scoring prompt builder (plan C1+C2)

`lib/jobs/scoring-prompt.ts` is the only place the Gemini scoring prompt may be built — routes must not assemble it inline:

```typescript
import { buildScoringPrompt, type ProfileScoreContext } from "@/lib/jobs/scoring-prompt";

const { system, prompt, maxOutputTokens } = buildScoringPrompt({ jobs, profile });
const parsed = (await generateJson({ system, prompt, temperature: 0.3, maxOutputTokens })) as { results?: ScoredResult[] };
```

- **Full profile (C1):** `ProfileScoreContext` carries all nine scoring fields (`skills`, `industries`, `experience_level`, `job_titles_seeking` → `desired_roles`, `years_experience`, `work_experience`, `remote_preference`, `preferred_locations`, `salary_expectation`) plus `location` (shared with B1's country detection; serialized as `current_location`). The find route must `select(...)` all ten columns.
- **Description budget (C2):** descriptions are cut to `min(6_000, 160_000 ÷ jobCount)` chars at a word boundary via `truncateAtWordBoundary`, *while the job list is built* — never truncate the assembled prompt (it would cut the JSON instructions). Adzuna snippets (~300 chars) sit below both caps and pass as-is.
- **Output budget:** `scoringMaxOutputTokens(n)` = `400n+400`, floored at 1200, capped 16384. Never hardcode `maxOutputTokens` for scoring — a flat 1200 cannot hold 40 results and `generateJson` throws `MAX_TOKENS`, zero-scoring the whole batch.
- **Scoring semantics (C4):** the zero-score fallback (`matchReason: "Score unavailable"`), jobId→positional→fallback result matching, `MATCH_THRESHOLD` from `lib/utils.ts`, and the existing event names all stay in the route — do not rename or remove them.

### Job record builder (plan C3)

`lib/jobs/job-record.ts` maps a `NormalizedJob` to its `jobs` insert row:

- `buildJobRecord({ job, userId, runId, score, foundAt })` — persists `job.highlights.{responsibilities,requirements,benefits}` into their `text[]` columns (JSearch `job_highlights` is the first source that fills them; others insert `[]`, matching the `'{}'` default), keeps `source` = provider id, `job_type` = `employmentType ?? "fulltime"`, location fallbacks `Remote`/`Unknown location`
- `formatSalaryForDb(job)` lives here too (moved verbatim from the route): source text wins; numeric figures only format when yearly/unstated — hourly/monthly dropped, never mislabelled

### Source attribution (plan A7)

`lib/source-attribution.ts` is the single registry mapping each `JobSourceId` → `{ label, url }` link-back (RemoteOK/Remotive/Jobicy ToS require one; Arbeitnow asks for one; Adzuna's "Jobs by Adzuna" obligation is covered by the same entry). `resolveSourceCredits(sources)` dedupes by label, treats legacy `"search"` as Adzuna, and skips `"url"`/unknown values. The shared `components/shared/SourceCredits.tsx` renders "Jobs via JSearch · …" — `FindJobsClient` derives credits from the jobs on screen, `LiveOpportunities` from the API's `data.sources[]`. Any new surface showing job data must render it too.

---

## Browserbase

**Check first:** Check AGENTS.md for an installed Browserbase skill. If a Browserbase MCP server is configured — use it. The skill/MCP will have the latest session management and API patterns.

### Session Creation — Company Research

```typescript
import Browserbase from "@browserbasehq/sdk";

const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });

// Single session for company research — sequential page visits
const session = await bb.sessions.create({
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  timeout: 120, // 2 minute session — visits 3-4 pages max
});
```

**Important — Browserbase runs independently from your Next.js server:**
Browserbase sessions run on Browserbase's cloud infrastructure, not inside your Next.js API route. The API route triggers the Browserbase session and returns a response while the session continues running independently on Browserbase's platform. Do not add `maxDuration` or any timeout configuration to Next.js API routes to accommodate Browserbase session length.

**Rules:**

- Always use single sessions — never parallel sessions (free plan limit)
- Session timeout is 120 seconds — sufficient for 3-4 page visits
- Always end sessions cleanly — call stagehand.close() when done
- Project ID always from `process.env.BROWSERBASE_PROJECT_ID` — never hardcode
- Browserbase client lives in `lib/browserbase.ts` — always import from there

---

## Stagehand

**Check first:** Check AGENTS.md for an installed Stagehand skill. If a Stagehand MCP server is configured — use it. The skill/MCP will have the latest act() and extract() patterns.

### Initialisation

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY!,
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  browserbaseSessionID: session.id,
  model: { modelName: `google/${getGeminiModel()}`, apiKey: process.env.GEMINI_API_KEY! },
  disablePino: true,
});

await stagehand.init();
const page = stagehand.context.activePage()!;
```

### extract()

```typescript
import { z } from "zod";

const result = await stagehand.extract({
  instruction:
    "Extract the company overview, main product description, and any technology mentions from this page.",
  schema: z.object({
    companyOverview: z.string().optional(),
    mainProduct: z.string().optional(),
    techMentions: z.array(z.string()).optional(),
    navLinks: z
      .array(
        z.object({
          label: z.string(),
          url: z.string(),
        }),
      )
      .optional(),
  }),
});
```

### act()

```typescript
// Always wrap in try/catch
try {
  await stagehand.act({
    action: "Click the About link in the navigation",
  });
} catch (error) {
  await logAgentError(jobId, null, error);
}
```

## Company Research Section

Replace the existing Stagehand "Company Research Pattern" section in library-docs.md with this:

---

### Company Research Pattern

Three-step process: homepage extraction → sub-page extraction → Gemini synthesis.
Job description and user profile come from DB — never re-fetch what you already have.
Browser's only job is the company website.

```typescript
// Step 1 — Homepage extraction
const homepageData = await stagehand.extract({
  instruction:
    "This is a company's homepage. Capture what the company actually does, who it's for, and any concrete signals (funding, customers, scale, mission, recent launches). Then find the internal links most worth visiting to research them as an employer.",
  schema: z.object({
    oneLiner: z.string().describe("What the company does in one sentence"),
    productSummary: z
      .string()
      .describe("What they build/sell and who it's for"),
    signals: z
      .array(z.string())
      .describe("Funding, notable customers, scale, mission, recent news"),
    pageLinks: z
      .array(
        z.object({
          url: z.string(),
          kind: z.enum([
            "about",
            "careers",
            "blog",
            "engineering",
            "product",
            "team",
            "other",
          ]),
        }),
      )
      .describe("Internal links worth visiting"),
  }),
});

// If oneLiner and productSummary are empty — wrong site or parked domain
// Skip to synthesis with job description and profile only
if (!homepageData.oneLiner && !homepageData.productSummary) {
  await stagehand.close();
  // proceed to synthesis with empty companyResearch
}

// Step 2 — Sub-page extraction (max 3, prefer about/blog/engineering/product over careers)
const subPageData = await stagehand.extract({
  instruction:
    "Extract substance that helps a candidate understand this company before applying: what they do, their values and how they work, the specific technologies and tools they use, notable projects or customers, and how the team operates. Ignore nav, footers, cookie banners, and generic marketing copy.",
  schema: z.object({
    keyPoints: z.array(z.string()),
    technologies: z
      .array(z.string())
      .describe("Specific languages, frameworks, tools, platforms"),
    valuesOrCulture: z
      .array(z.string())
      .describe("Stated values, working style, team norms"),
    notable: z
      .array(z.string())
      .describe("Customers, funding, scale, projects, awards"),
  }),
});

// Step 3 — Gemini synthesis (after browser closes)
// Feed three data sources: company research + job from DB + profile from DB
const systemPrompt = `You are a sharp career strategist preparing a candidate to apply for a specific role. You are given (a) research collected from the company's own website, (b) the job posting, and (c) the candidate's profile. Produce a concise, concrete briefing that gives this specific candidate an edge for this specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent funding, customers, headcount, or facts. If research was thin, infer carefully from the job posting and say what's inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this company's stack, product, and values. No generic advice that would apply to anyone.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly and what adjacent experience to lean on.
- Talking points and questions must reference real things from the research, the kind of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.

Return ONLY valid JSON matching this shape:
{
  "companyOverview": string,
  "techStack": string[],
  "culture": string[],
  "whyThisRole": string,
  "yourEdge": string[],
  "gapsToAddress": string[],
  "smartQuestions": string[],
  "interviewPrep": string[],
  "sources": string[]
}`;

const userPrompt = `COMPANY RESEARCH (from their website):
${JSON.stringify(companyResearch)}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Matched skills (already computed): ${job.matched_skills.join(", ")}
Missing skills (already computed): ${job.missing_skills.join(", ")}

CANDIDATE PROFILE:
Current title: ${profile.current_title}
Experience: ${profile.years_experience} years, level ${profile.experience_level}
Skills: ${profile.skills.join(", ")}
Work history: ${JSON.stringify(profile.work_experience)}`;

const parsed = await generateJson({
  system: systemPrompt,
  prompt: userPrompt,
  temperature: 0.4,
  maxOutputTokens: 1200,
});
```

**Dossier fields:**

| Field           | Type     | Purpose                                             |
| --------------- | -------- | --------------------------------------------------- |
| companyOverview | string   | What the company does                               |
| techStack       | string[] | Technologies they use                               |
| culture         | string[] | Values and working style                            |
| whyThisRole     | string   | Why this role exists                                |
| yourEdge        | string[] | Specific links between THIS candidate and this role |
| gapsToAddress   | string[] | Missing skills reframed as strategy                 |
| smartQuestions  | string[] | Questions that show real research                   |
| interviewPrep   | string[] | Topics to prepare for this role                     |
| sources         | string[] | Pages the company info came from                    |

**Rules:**

- Always use `extract()` with a Zod schema — never parse raw HTML or use regex
- Always wrap every `act()` and `extract()` in try/catch
- Always call `await stagehand.close()` when done — ends the Browserbase session
- Model defaults to `gemini-3-flash-preview` via `lib/llm.ts`; override with `GEMINI_MODEL`
- Temperature is `0.4` for synthesis — grounded but flexible enough to make real connections
- Max 3 sub-pages — never exceed this on free plan
- Always close session in finally block — never leave sessions open even if research fails
- Job description and profile always come from DB — never re-fetch via browser
- If browser research returns empty — still run synthesis with job + profile only
- yourEdge, gapsToAddress, and smartQuestions are the most valuable fields — never skip them

### Structured JSON Response

Every AI call in this app goes through `lib/llm.ts`:

```typescript
import { generateJson } from "@/lib/llm";

const result = await generateJson({
  system: "You are a job matching assistant. Return only valid JSON.",
  prompt: `Your prompt here`,
  temperature: 0.3,
  maxOutputTokens: 1200,
});
```

`generateJson()` sets `responseMimeType: "application/json"` on the Gemini call,
throws if the response text is empty, and returns the parsed object.

**Temperature settings:**

- `0.3` — matching, scoring, extraction, research synthesis — deterministic results
- `0.7` — resume generation — natural variation

**Max output tokens** (`maxOutputTokens`):

- Job matching + scoring: `1200`
- Company research synthesis: `1200`
- Resume generation: `1000`
- Profile extraction from resume: `800`

**Rules:**

- Call `generateJson()` from `lib/llm.ts`; never construct a provider client inline
- `generateJson()` already forces JSON output; do not add your own format hints
- `generateJson()` throws on empty/unparseable output — every caller needs its own try/catch and fallback
- Always validate the returned object with Zod before using it
- Match threshold is always `MATCH_THRESHOLD` from `lib/utils.ts` — never hardcode 70
- Company research synthesis must always return a complete dossier — never return empty even if browser research failed

---

## Resend (Email Service)

### Setup & Sending (`lib/mail.ts`)

Resend delivers branded notifications and transactional emails (such as the new account welcome message):

```typescript
// lib/mail.ts
import { Resend } from "resend";

export async function sendJobbersEmail(options: {
  to: string;
  subject: string;
  heading: string;
  bodyText: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  return await resend.emails.send({
    from: process.env.EMAIL_FROM || "Jobbers <onboarding@resend.dev>",
    to: options.to,
    subject: options.subject,
    html: renderEmailHtml(options),
  });
}
```

**Rules:**
- Always provide a safe fallback if `RESEND_API_KEY` is not configured in local development.
- Use responsive HTML email layouts with Jobbers brand styling.
- Catch errors gracefully at call sites so email delivery never blocks user registration.

---

## @react-pdf/renderer

**Check first:** Check AGENTS.md for an installed react-pdf skill. PDF generation APIs can differ from general training knowledge.

### Resume PDF Generation

```typescript
import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  section: { marginBottom: 10 },
  heading: { fontSize: 14, fontWeight: 'bold' },
  text: { fontSize: 10 },
})

const ResumePDF = ({ profile }: { profile: Profile }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.heading}>{profile.fullName}</Text>
        <Text style={styles.text}>{profile.email}</Text>
      </View>
    </Page>
  </Document>
)

// Generate buffer
const buffer = await renderToBuffer(<ResumePDF profile={profile} />)

// Save base64 buffer directly to MongoDB resumes collection
const base64Data = Buffer.from(buffer).toString("base64");
await resumesCollection.insertOne({
  id: randomUUID(),
  user_id: userId,
  file_data: base64Data,
  is_primary: true,
});
```

**Supported CSS properties:**
Only use these — others are silently ignored:
`padding, margin, fontSize, color, fontFamily, flexDirection, alignItems, justifyContent, borderRadius, width, height, fontWeight, textAlign, lineHeight`

**Rules:**

- Server-side only — never import in client components
- Always use `renderToBuffer` — not `renderToStream` or `PDFDownloadLink`
- PDF generation only in `app/api/resume/` routes
- Generated buffer stored directly in MongoDB — never written to disk
- Always sync profile `resume_pdf_url` after generation

---

## pdf-parse

**Check first:** Check AGENTS.md for an installed pdf-parse skill.

### Extract Text from Uploaded Resume

```typescript
import pdf from "pdf-parse";

// In API route handling resume upload
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("resume") as File;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const pdfData = await pdf(buffer);
  const extractedText = pdfData.text; // raw text content

  // Send to Gemini for structured extraction
}
```

**Rules:**

- Server-side only — never import in client components
- `pdfData.text` is raw unformatted text — Gemini handles the structure extraction
- Always handle parse errors — some PDFs are image-based and return empty text
- If `pdfData.text` is empty or very short — return error to user: "Could not extract text from this PDF. Please try a different file."
