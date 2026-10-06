# Job Search Expansion Plan — Multi-Source, Global, AI Auto-Apply

> **Status:** Phase A — A1–A3 ✅ complete, A4–A6 remaining (branch `feat/multi-source-job-search`)
> **Created:** 2026-10-06
> **Supersedes nothing** — Adzuna stays; this plan adds sources around it.
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

- [ ] **A4 — Arbeitnow provider**
  `lib/jobs/arbeitnow.ts`, no key. Map `data[]` → `NormalizedJob`; `slug` → canonical
  job URL; `job_types`/`remote` flags mapped.
  **Test:** live smoke — ≥50 jobs normalize; apply URLs point at ATS job domains.

- [ ] **A5 — Remote feeds provider**
  `lib/jobs/remoteok.ts`, `lib/jobs/remotive.ts`, `lib/jobs/jobicy.ts` (or one
  `remote-feeds.ts` with three fetchers). Remotive needs `redirect: "follow"` (301).
  **Test:** live smoke — each source returns ≥1 job; errors isolated per source.

- [ ] **A6 — Orchestrator + cache + cross-source dedupe**
  `lib/jobs/search-all.ts`: `searchAll({ query, location })` fans out with
  `Promise.allSettled`, per-provider try/catch (one failure never kills the run),
  normalizes all, cross-source dedupe on normalized `title|company|description-prefix`
  fingerprint (reuse the Adzuna fingerprint idea), caps to N results, caches per
  `query+location` for 5 minutes (reuse the `/api/public/jobs` Map pattern; note the
  audit flagged unbounded Map growth as a known deferred issue — add a size cap here).
  Rewire `/api/agent/find` and `/api/public/jobs` to the orchestrator.
  **Test:** mocked-provider unit tests — a throwing provider still yields results from
  the rest; cross-source duplicates collapse; cache hit avoids upstream calls;
  `npm run lint && npm run build` pass.

---

## Phase B — Location intelligence

- [ ] **B1 — Country detection**
  `lib/jobs/country.ts`: detect ISO country from search location string, falling back
  to profile `preferred_locations` then `location`, default `us`. Only call Adzuna when
  the code is in the supported list; otherwise skip Adzuna silently (other providers
  still search — JSearch/Arbeitnow don't need a country code).
  **Test:** unit table — `Lagos→ng`, `London→gb`, `Accra→gh`, empty→profile→`us`,
  unsupported code → Adzuna skipped.

- [ ] **B2 — Graceful degradation on Adzuna 404**
  `UNSUPPORTED_COUNTRY` (or any Adzuna failure) → log to `agent_logs`, continue the run
  with remaining providers. Run status never flips to `failed` because of one source.
  **Test:** mocked Adzuna 404 → run completes, `agent_logs` has a warning row, other
  sources' jobs saved.

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

Live smoke (needs network + `.env.local` keys):

```bash
npx tsx tests/jsearch-smoke.ts   # A3 — after JSEARCH_API_KEY is set
```

## Known environment notes

- `.env.local` has `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `GEMINI_API_KEY` set.
  `JSEARCH_API_KEY` needs a one-time manual signup (free, no card).
- Free-tier budgets: JSearch **200 req/month** → the orchestrator cache is mandatory,
  not optional. If the app outgrows it: RapidAPI same API, or Pro $25/mo.
- Adzuna attribution: "Jobs by Adzuna" credit must remain on any UI showing Adzuna jobs
  (API ToS).
- Deferred from the 2026-10-05 security audit and still relevant: unbounded cache `Map`
  growth in `/api/public/jobs` — cap entries when the A6 cache lands.
