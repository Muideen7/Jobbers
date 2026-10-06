# Job Search Expansion Plan — Multi-Source, Global, AI Auto-Apply

> **Status:** Phase A — A1–A7 ✅ complete; Phase B — B1–B2 ✅ complete (branch `feat/multi-source-job-search`); Adzuna demoted to last-resort fallback, `/api/public/jobs` multi-sourced, per-source attribution live, country detection + graceful source degradation live. Phase C next
> **Created:** 2026-10-06
> **Supersedes nothing** — Adzuna stays **as a fallback only** (19 countries; never the core source again); the other sources live around it.
> Update this file and `progress-tracker.md` after every completed task.

---

## Why this plan exists

Three problems reported and verified against live APIs on 2026-10-06:

1. **Adzuna does not serve Nigeria.** Live call to
   `https://api.adzuna.com/v1/api/jobs/ng/search/1` returns **HTTP 404** with:
   `UNSUPPORTED_COUNTRY — supported ISO codes: at, au, be, br, ca, ch, de, es, fr, gb, in, it, mx, nl, nz, pl, sg, us, za`
   (South Africa `za` works; Nigeria `ng` does not). The app hardcodes `country: "us"`
   in `app/api/agent/find/route.ts`, so a Lagos search runs against the US index —
   few results, wrong region.
2. **The matcher scores from 4 profile fields only.**
   `scoreJobsBatch()` receives `skills, industries, experience_level, job_titles_seeking`.
   It ignores `years_experience`, `work_experience`, `remote_preference`,
   `preferred_locations`, `salary_expectation`. Adzuna descriptions are ~500-char
   snippets, so Gemini scores on truncated input.
3. **The profile page defaults to a resume-upload + manual resume-form stack**
   (`ResumeSection` then `ProfileForm` with no overview), which reads as
   "fill in this resume form" rather than a profile home.

New product direction (2026-10-06): **global search, not Africa-only, and AI-assisted
auto-apply.** Auto-apply is currently listed in `context/project-overview.md`
("Features Out of Scope") — Phase E updates that doc first.

---

## API decision record (all statuses verified live or from current docs)

| API | Status | Cost | Verdict |
| --- | --- | --- | --- |
| **JSearch** (OpenWeb Ninja, `GET api.openwebninja.com/jsearch/search-v2`, header `x-api-key`) | Free tier: **200 req/month**, 1000 req/hr, no credit card. Pro $25/mo = 10k | Free | **Primary global discovery.** Google for Jobs index → worldwide incl. Nigeria. Returns full descriptions, `job_highlights` (Qualifications/Responsibilities/Benefits), salary min/max, `job_apply_link`, seniority, `required_technologies`, remote flags |
| **Arbeitnow** (`GET www.arbeitnow.com/api/job-board-api`) | Free, **no key**; verified live: 325 jobs, aggregates Greenhouse/SmartRecruiters/Join/Teamtailor/Recruitee/Comeet; UK endpoint added 2026 | Free | **ATS-direct backbone.** Canonical ATS apply pages are the forms an AI agent can reliably fill. Europe-weighted but includes worldwide remote and African companies (e.g. Moniepoint's 146-job Greenhouse board) |
| **RemoteOK** (`remoteok.com/api`), **Remotive** (`remotive.com/api/remote-jobs`, needs `-L` for 301), **Jobicy** (`jobicy.com/api/v2/remote-jobs`) | Free, no key; verified live (99 / 18 / 20 jobs in samples) | Free | **Remote layer** — "Anywhere" jobs; direct employer apply links |
| **Adzuna** | Free key (already held in `.env.local`). 19 countries listed above; `ng` → 404 | Free | **Keep as fallback** where supported. Existing dedupe + "Jobs by Adzuna" credit obligation unchanged |
| **Careerjet** (`public.api.careerjet.net/search`, free OJR key signup; `careerjet.com.ng` alive) | Free, rate-limited | Free | Optional later — aggregator depth incl. NG |
| **Jooble** (`jooble.org/api/{key}`) | Free key signup (docs Cloudflare-blocked to server fetches) | Free | Optional later |
| **Indeed** | **Publisher API discontinued 2023**, no self-serve key. `docs.indeed.com` = partner GraphQL + display widget only. Scrapers violate ToS | — | **Rejected** |
| **Jobberman** | No public API; `robots.txt` disallows `/api/`; only paid Apify scrapers. Africa-only anyway → fails the global goal | — | **Rejected** |
| Google Cloud Talent Solution, JobsPipe, Fantastic Jobs | Enterprise/paid | — | Rejected for now |
| Arbeitnow-style ATS boards directly (Greenhouse/Lever/Ashby per-company) | Free, no key | Free | Deferred — Arbeitnow aggregates most of it; revisit if curated-company search is needed |

**Stack summary:** JSearch (primary global) + Arbeitnow (ATS-direct) + Remote feeds
(RemoteOK/Remotive/Jobicy) + Adzuna (fallback in supported countries), all behind one
normalized provider interface.

**Auto-apply fit:** Greenhouse/Lever/Ashby apply forms are structured and fillable by
the existing Browserbase + Stagehand stack. LinkedIn/Indeed apply flows are bot-walled
and ToS-hostile — never automate them.

---

## Phase A — Multi-source search layer

Goal: one orchestrator, many providers, one normalized job shape.

- [x] **A1 — Normalized provider interface**
  ✅ Done. `lib/jobs/types.ts` with `NormalizedJob`, `JobHighlights`,
  `JobSearchQuery` (`{ title, location, country }`), `JobProvider`,
  `JobSourceId`. Deliberately no `raw` passthrough — extend the shape when a
  later phase needs a field instead.
  **Test:** `tests/job-source-normalize.test.ts` — Adzuna + JSearch fixtures
  normalize to byte-identical key sets; primitive/type assertions per field.

- [x] **A2 — Adzuna becomes provider #1**
  ✅ Done. Implemented as an adapter in `lib/jobs/adzuna.ts` that wraps
  `searchJobs`/`cleanCompanyName` from `lib/adzuna.ts` (which stayed byte-for-byte
  untouched — current callers unaffected until A6 rewires them). Exports
  `normalizeAdzunaJob` + `adzunaProvider`.
  **Test:** existing suite green (`npm test`), plus the shared-shape assertions.

- [x] **A3 — JSearch provider**
  ✅ Done. `lib/jobs/jsearch.ts` + `JSEARCH_API_KEY` in `.env.local.example`
  (key requires one-time manual signup at https://app.openwebninja.com/api/jsearch — no card).
  Built against the official spec — keep these URLs:
  - Markdown docs: `https://www.openwebninja.com/api/jsearch/llms.txt`
  - OpenAPI spec: `https://openwebninja.s3.us-east-1.amazonaws.com/portal/openapi/jsearch.yaml`
  - Response wrapper: `{ status, request_id, parameters, data: { jobs[], cursor } }`
  - Params beyond `query`: `country` (ISO alpha-2, **works for all countries incl. ng**),
    `num_pages` (1–20, each page = 1 credit ≈ 10 jobs), `cursor`, `language`,
    `date_posted`, `work_from_home`, `employment_types`, `job_requirements`
  Pure/testable surface: `buildJsearchParams`, `parseJsearchResponse`,
  `normalizeJsearchJob`, `searchJsearch(query, { numPages, fetchImpl })`.
  401/403 → key error, 429 → quota error, missing key → actionable message;
  malformed job entries are skipped, not fatal.
  **Test:** `tests/jsearch.test.ts` (9 offline tests incl. mocked-fetch error
  paths) + live `node --env-file=.env.local tests/jsearch-smoke.ts` (NG/US/GB —
  **not yet run: needs a signup key**).

- [x] **A4 — Arbeitnow provider**
  ✅ Done. `lib/jobs/arbeitnow.ts`, no key. Wrapper `{ data, links, meta }` →
  `NormalizedJob[]`; `created_at` unix seconds → ISO; `job_types[0]` →
  `employmentType`; `remote` flag mapped; `url` is Arbeitnow's own job page
  (it links through to the Greenhouse/SmartRecruiters ATS apply form — adjust
  the original assumption: apply URLs point at arbeitnow.com, not ATS domains
  directly; `searchMode: "client"` because the API ignores `?search=`).
  **Test:** shared-shape assertions extended + live smoke
  (`node tests/job-sources-smoke.ts`) — 325 jobs, 325 with HTTP apply URLs ✅.

- [x] **A5 — Remote feeds provider**
  ✅ Done as one file `lib/jobs/remote-feeds.ts` with three fetchers +
  parsers (the plan's allowed option — they are one layer sharing
  `fetchJson`/employment-tag logic). Verified live 2026-10-06:
  - **RemoteOK** `remoteok.com/api` — array whose element 0 is a
    `{ last_updated, legal }` metadata object → skipped by the per-entry
    schema. `?search=`/`?tag=` params are **ignored** (nonsense search still
    returns all) → client mode.
  - **Remotive** `remotive.com/api/remote-jobs` — wrapper keys are hyphenated
    (`job-count`); `publication_date` is naive → appended `Z` (their UTC).
    `?search=`/`?limit=` are ignored by the current API (all probes returned
    the same 18 jobs) → client mode. Free feed exposes ~18 jobs.
  - **Jobicy** `jobicy.com/api/v2/remote-jobs?count=100` — `tag`/`count` do
    filter, but `tag` semantics are unreliable for free-text queries →
    fetched plain, client mode. Error payloads are `{ success: false }`
    **without** a `jobs` key → parser checks `success` before the array.
    `jobExcerpt` is the fallback when `jobDescription` is absent.
  Remotive's `salary` free-text string became the new `NormalizedJob.salaryText`
  field (added to A1's shape; all six sources keep byte-identical key sets).
  **Test:** shared-shape + per-source fixtures in
  `tests/job-source-normalize.test.ts`; live smoke — 99/18/100 jobs ✅.

- [x] **A6 — Orchestrator + cache + cross-source dedupe**
  ✅ Done. `lib/jobs/search-all.ts` exports `searchAll(query, options)`:
  - **Fan-out:** `Promise.allSettled` over `PROVIDER_REGISTRY` —
    originally (jsearch, adzuna, arbeitnow, remoteok, jobicy, remotive);
    **A7 reorders to jsearch, arbeitnow, remoteok, jobicy, remotive, adzuna**,
    so Adzuna is the last-resort fallback and can never again lead the merged
    list. `runProvider` never throws →
    one failing source yields `{ count: 0, error }` and the rest still land.
  - **Dedupe:** fingerprint = lowercase/punctuation-normalized
    `title|company`; the copy with the fuller description wins (better Gemini
    input). Output order follows registry priority.
  - **Cache:** per `source|country|location|title`, TTL per source —
    adzuna/jsearch 5 min, arbeitnow/remoteok/jobicy 30 min (big payloads,
    hourly feeds), **remotive 6 h + hard daily cap of 4 calls/UTC day**
    (their ToS: "max 4 times a day… excessive requests will be blocked";
    TTL alone can't bound distinct queries). `MAX_CACHE_ENTRIES = 300`
    with oldest-first eviction — the audit's unbounded-Map concern.
  - **Local token filter:** feeds with `searchMode: "client"` drop jobs whose
    *title* contains no query token (≥3 chars; zero tokens disables the
    filter). Server-searched sources pass through untouched.
  - **Result cap:** 40 by default, `maxResults` override.
  - **Route rewire:** `/api/agent/find` now runs on `searchAll` — scoring ids
    are namespaced (`source:externalId`, cross-source ids collide otherwise),
    descriptions truncated to 1200 chars in the prompt (full text stored in
    DB), salary via `formatSalaryForDb` (source text wins; numeric figures
    only formatted when yearly/unstated — hourly/monthly dropped rather than
    mislabelled), `employmentType ?? "fulltime"` → `job_type`.
    **Country detection arrived in B1** (`detectCountry` replaced the
    hardcoded `"us"`).
  - **`/api/public/jobs` was deliberately NOT rewired here** (plan change,
    executed in A7): its filters (`contractType`, `salaryMin`, `sortBy`),
    `PublicJob` `$`-currency display, over-fetch×4 dedupe and the static
    "Jobs by Adzuna" credit were all Adzuna-native — a naive rewire would show
    EUR/GBP figures as `$` and make filter promises other sources can't keep.
    A7 replaced each of those with the multi-source equivalents (see below).
    Its cache **did** get the size cap here (audit fix).
  **Test:** `tests/search-all.test.ts` — 9 mocked-provider tests (failure
  isolation, dedupe collapse + keeper rule, cache hit, TTL expiry, client
  filter, short-query fallback, cap, daily cap incl. next-day reset,
  cache-size bound); 63/63 green; lint + build pass; live smoke passes.

- [x] **A7 — Per-source attribution + Adzuna demoted from core**
  ✅ Done (combined with the requested de-coring of Adzuna). RemoteOK
  ("link back… mention Remote OK as a source"), Remotive ("link back…
  mention Remotive as source"), Jobicy ("clearly credited with a direct
  link") and Arbeitnow all **require on-site attribution**; Adzuna's credit
  obligation is unchanged. Implementation:
  - **Adzuna demoted** to last position in `PROVIDER_REGISTRY` (fallback
    only, never leads the merged list) — locked by a registry-order test in
    `tests/search-all.test.ts`.
  - **`/api/public/jobs` rewired to `searchAll`** — the last Adzuna-core
    surface. Adzuna-specific pieces replaced in `lib/public-jobs.ts`:
    - Chips became post-filters over `NormalizedJob`: *remote* = remote
      flag OR "Remote" in title/location; *fulltime* = unknown type counts
      as full-time (legacy default), explicit part-time/contract/intern
      excluded; *$150k+* = numeric minimum ≥ 150k **verified** (sources
      without figures are excluded, never guessed).
    - New `JobSearchQuery.remoteOnly` → JSearch `work_from_home` param (the
      only source that can filter remote server-side).
    - Salary display: source `salaryText` wins, then `$Xk` numerics, then
      "Salary not listed"; contract types title-cased, null → "Full time".
    - Default order mixes sources by `postedAt` desc ("live" landing page);
      `$150k+` sorts by salary desc (legacy `sortBy=salary` behaviour).
    - `PublicJob.id` = `source:externalId` (cross-source React key
      collisions), `category` = source's own label or "Technology".
    - The Adzuna-env 503 check is gone: individual failures degrade, only
      an **all-sources-failed** run returns 502.
    - Response gains `data.sources[]` = sources of the rendered cards.
  - **Shape extensions:** `NormalizedJob.category` (adzuna `category.label`,
    arbeitnow `tags[0]`, remotive `category`, jobicy `jobIndustry[0]`,
    jsearch `job_function` — enrichment-only so often null, remoteok null
    because its tags are skills). Key-set test still enforces identical
    keys across all six sources.
  - **Per-job provider attribution in the DB:** `jobs.source` (plain text,
    no migration needed) now stores the provider id for new agent-found jobs
    (`jsearch`, `adzuna`, …); legacy rows keep `"search"` (they were all
    Adzuna). `Job.source` union widened; `JobsTable` `SourceBadge` shows
    provider names (`Search`/`URL` unchanged for their legacy values).
    The PostHog `job_found.source` property stays `"search"` — it records
    provenance class, not provider, so existing dashboards keep working.
  - **Credit UI:** `lib/source-attribution.ts` (single label+link registry,
    `resolveSourceCredits` dedupes by label and skips `url`/unknown rows) +
    shared `components/shared/SourceCredits.tsx` ("Jobs via JSearch · …"
    with `target="_blank" rel="noopener noreferrer"` link-backs).
    `FindJobsClient` derives credits from the jobs on screen (correct after
    any reload/page — replaces the static "Jobs by Adzuna" line);
    `LiveOpportunities` renders the API-reported `sources`.
  **Test:** 79/79 green — new `tests/public-jobs.test.ts` (filters, salary/
  contract formatting, mapping, sorting), `tests/source-attribution.test.ts`
  (every source link-backed, dedupe, url-skipping), registry-order test,
  JSearch `work_from_home` test, category assertions per source; live smoke
  gains an A7 block (`node --env-file=.env.local tests/job-sources-smoke.ts`)
  — 10 remote-chip cards, 4 credited sources, 0 errors ✅.

---

## Phase B — Location intelligence

- [x] **B1 — Country detection**
  `lib/jobs/country.ts`: detect ISO country from search location string, falling back
  to profile `preferred_locations` then `location`, default `us`. Only call Adzuna when
  the code is in the supported list; otherwise skip Adzuna silently (other providers
  still search — JSearch/Arbeitnow don't need a country code).
  **Test:** unit table — `Lagos→ng`, `London→gb`, `Accra→gh`, empty→profile→`us`,
  unsupported code → Adzuna skipped.
  **Done:** `detectCountry(primary, fallbacks)` + `countryFromText` (city table,
  country-name aliases with `uk→gb`, two-letter passthrough only for known ISO
  codes, diacritic stripping). Find route feeds search location →
  `preferred_locations` → `location`; the landing route calls `detectCountry()`
  (no location input → `us` default). `lib/jobs/adzuna.ts` exports
  `ADZUNA_SUPPORTED_COUNTRIES` (19 codes) / `isAdzunaCountrySupported` and the
  provider returns `[]` *before any fetch* for unsupported codes.
  **Test:** `tests/country.test.ts` (10 cases: city/alias/code tables, detection
  order, default, 19-country list, fetch-stub proving zero requests for `ng`/
  `zz` and pass-through URL for `gb`/`us`). Live smoke: `detectCountry "Lagos"
  → ng`, `adzuna: 0 jobs (skipped cleanly)` ✅.

- [x] **B2 — Graceful degradation on Adzuna 404**
  `UNSUPPORTED_COUNTRY` (or any Adzuna failure) → log to `agent_logs`, continue the run
  with remaining providers. Run status never flips to `failed` because of one source.
  **Test:** mocked Adzuna 404 → run completes, `agent_logs` has a warning row, other
  sources' jobs saved.
  **Done:** `lib/jobs/source-warnings.ts` → `sourceWarningLogRows({runId, userId,
  outcomes})` builds `agent_logs` rows (level `"warning"`) for every errored
  outcome; `/api/agent/find` inserts them right after `searchAll`, *before* the
  empty-result branch, and `console.error`s insert failures instead of throwing —
  so a source failure can never flip `agent_runs.status` to `failed` (only
  unexpected throws reach the catch). Live smoke: 15 jobs despite Adzuna skip,
  warning row names the actually-failing source (JSearch missing key) ✅.
  **Test:** `tests/source-warnings.test.ts` (4 cases incl. end-to-end —
  searchAll with a provider throwing `404 UNSUPPORTED_COUNTRY` → healthy
  source's job survives + one warning row).

---

## Phase C — Matcher quality

- [ ] **C1 — Full-profile scoring context**
  Extend `ProfileScoreContext` in `app/api/agent/find/route.ts` to include
  `years_experience`, `work_experience`, `remote_preference`, `preferred_locations`,
  `salary_expectation` alongside the existing four fields.
  **Test:** context-builder unit test asserting all nine fields present.

- [ ] **C2 — Score on full descriptions**
  Providers that return full text (JSearch, Arbeitnow, remote feeds) feed Gemini
  unabridged up to a token budget; Adzuna snippets stay as-is. Truncate centrally in
  the prompt builder, never mid-JSON.
  **Test:** prompt-builder test — truncation applied, all profile fields included,
  job count matches.

- [ ] **C3 — Structured highlights into DB**
  Map JSearch `job_highlights.{Responsibilities, Qualifications, Benefits}` →
  `jobs.responsibilities` / `jobs.requirements` / `jobs.benefits` (columns exist and
  are currently never populated for search jobs).
  **Test:** normalizer unit test.

- [ ] **C4 — Preserve scoring semantics**
  Zero-score fallback on Gemini failure, `MATCH_THRESHOLD` from `lib/utils.ts` only,
  no new event names.
  **Test:** existing test suite green; `npm run lint && npm run build`.

---

## Phase D — Profile page restructure

- [ ] **D1 — Overview-first layout decision**
  Replace the "resume section then giant form" default with a profile home:
  completion summary at top, resume + **Extract Profile** as the primary fast path,
  the manual `ProfileForm` sections secondary (collapsed or tabbed). **Layout choice
  pending user decision** (overview+sections vs upload-first wizard) — do not build
  before it's confirmed.
  **Test:** visual pass at 3 viewports, lint/build, `ui-registry.md` updated with the
  new components.

---

## Phase E — AI auto-apply

> Requires doc updates first: `context/project-overview.md` currently lists
> "Auto apply" and "Cover letter generation" under **Features Out of Scope**.

- [ ] **E0 — Scope docs**
  Move auto-apply (+ per-job cover letter) into scope in `project-overview.md`,
  add the phase to `build-plan.md`, note new events in `code-standards.md`
  (PostHog event list must be extended there first per its own rule).
  **Test:** docs review — no remaining "out of scope" contradiction.

- [ ] **E1 — Apply state schema**
  Migration: `jobs.apply_status` (`saved | drafted | submitted`), `applied_at`,
  optional `application_notes`. RLS same pattern as existing policies.
  **Test:** migration runs; policy test — user-scoped reads/writes only.

- [ ] **E2 — Application dossier (Gemini)**
  Per-job tailored summary + cover letter via `generateJson()` (temperature 0.3–0.7
  per `library-docs.md`), stored on the job row or a new `applications` table.
  **Test:** smoke with fixed profile+job fixtures returns valid JSON matching schema
  (zod-validated).

- [ ] **E3 — Apply agent (Browserbase + Stagehand)**
  Target **Greenhouse and Lever forms first** (most structured). Reuse the research
  agent's session pattern: single session, try/catch every action, always close,
  log progress to `agent_logs`. Dry-run mode populates fields but never submits.
  **Test:** dry-run against a demo Greenhouse posting — name/email/resume URL/answers
  filled, submit button untouched.

- [ ] **E4 — Safety rails**
  Human confirmation required before real submit; explicit denylist (LinkedIn, Indeed,
  any site that blocks automation); per-run rate limit; no silent submissions.
  **Test:** assertion — `submit` unreachable when `dryRun` is true; denylisted domain
  aborts before the browser opens.

---

## Verification checklist (run before every handover)

```bash
npx tsc --noEmit
npx eslint .
npm test
npm run build
```

Live smoke (needs network; `job-sources-smoke` needs no keys):

```bash
node tests/job-sources-smoke.ts                        # A4–A6 — keyless feeds + orchestrator
node --env-file=.env.local tests/jsearch-smoke.ts      # A3 — after JSEARCH_API_KEY is set
```

## Known environment notes

- `.env.local` has `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `GEMINI_API_KEY` set.
  `JSEARCH_API_KEY` needs a one-time manual signup (free, no card).
- Free-tier budgets: JSearch **200 req/month** → the orchestrator cache is mandatory,
  not optional. If the app outgrows it: RapidAPI same API, or Pro $25/mo.
  Remotive **~4 GET/day** → enforced in `search-all.ts` (6 h TTL + daily cap).
- Attribution owed per source (A7): "Jobs by Adzuna" (existing), plus RemoteOK,
  Remotive, Jobicy and Arbeitnow link-backs before their feeds ship to users.
- Salary figures are formatted as `$Xk` without currency detection — pre-existing
  behaviour now reachable from non-US sources; proper `salary_currency` handling
  is C2's known gap.
- Deferred from the 2026-10-05 security audit: ~~unbounded cache `Map` growth in
  `/api/public/jobs`~~ — **fixed** during A6 (200-entry cap there, 300-entry cap
  in `search-all.ts`).
