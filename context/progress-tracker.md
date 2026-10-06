# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 6 — Multi-Source Job Search Expansion
**Last completed:** A1–A7 — full multi-source layer (`lib/jobs/`: interface,
Adzuna adapter, JSearch, Arbeitnow, RemoteOK/Remotive/Jobicy feeds,
`searchAll` orchestrator with cache/dedupe/daily caps; `/api/agent/find`
**and** `/api/public/jobs` rewired off Adzuna-only; Adzuna demoted to
last-resort fallback; per-source attribution via `SourceCredits` on both
results surfaces; per-job provider ids in `jobs.source`; 79/79 tests)
**Next:** Phase B (country detection) of `context/job-search-expansion-plan.md` on branch `feat/multi-source-job-search`

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage
- [x] 02 Auth
- [x] 03 PostHog Initialization
- [x] 04 Database Schema

### Phase 2 — Profile Page

- [x] 05 Profile Page — Full UI
- [x] 06 Profile Save Logic
- [x] 07 AI Profile Extraction from Resume
- [x] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [x] 09 Find Jobs Page — Full UI
- [x] 10 Adzuna Job Discovery
- [x] 11 Filter + Sort + Pagination

### Phase 4 — Job Details Page

- [x] 12 Job Details Page — Full UI
- [x] 13 Company Research Agent

### Phase 5 — Dashboard

- [x] 14 Dashboard Page — Full UI
- [x] 15 Stats Bar — Real Data
- [x] 16 Recent Activity — Real Data
- [ ] 17 Analytics Charts — PostHog Data
- [x] 18 Adzuna Multi-Location Duplicate Fix

### Phase 6 — Multi-Source Job Search Expansion (plan: `context/job-search-expansion-plan.md`)

- [x] A1 Normalized provider interface — `lib/jobs/types.ts` + shared-shape tests
- [x] A2 Adzuna provider adapter — `lib/jobs/adzuna.ts` (lib/adzuna.ts untouched)
- [x] A3 JSearch provider — `lib/jobs/jsearch.ts` (offline tests green; live smoke pending `JSEARCH_API_KEY` signup)
- [x] A4 Arbeitnow provider — `lib/jobs/arbeitnow.ts` (live: 325 jobs)
- [x] A5 Remote feeds — `lib/jobs/remote-feeds.ts` (RemoteOK 99 / Remotive 18 / Jobicy 100 live)
- [x] A6 Orchestrator — `lib/jobs/search-all.ts` (fan-out, dedupe, per-source TTL,
  Remotive 4/day cap, 300-entry cache; `/api/agent/find` rewired; `/api/public/jobs`
  kept Adzuna-native here — deferred to A7, see plan for rationale)
- [x] A7 Per-source attribution + Adzuna demoted from core —
  `lib/source-attribution.ts` + shared `components/shared/SourceCredits.tsx`
  (link-back credits on find-jobs, derived from jobs on screen, and on the
  landing page, from `data.sources[]`); `/api/public/jobs` rewired to
  `searchAll` (chips became post-filters in `lib/public-jobs.ts`); registry
  order jsearch → feeds → **adzuna last**; `jobs.source` stores the provider
  id (plain text, no migration; legacy `"search"` rows credit Adzuna);
  `NormalizedJob.category` + `JobSearchQuery.remoteOnly` extensions — 79/79 tests
- [ ] B Location intelligence · C Matcher quality · D Profile page · E Auto-apply

---

## Decisions Made During Build

- Landing page is composed from `LandingNavbar → Hero → TopCompanies → AiMatcher → HowItWorks → LiveOpportunities → WallOfLove → Faq → LandingFooter`. The older `Navbar`/`Hero`/`HowItWorks`/`Features`/`SuccessStory`/`CTASection`/`Footer` set is replaced: marketing chrome now lives in `components/homepage/LandingNavbar.tsx` and `LandingFooter.tsx`, and `components/layout/Navbar.tsx` + `Footer.tsx` are the in-app chrome.
- Landing page visuals rely on shared token-driven helpers in `app/globals.css` (`landing-panel`, `landing-grid`, `landing-hero-glow`, `landing-divider`) instead of component-level hardcoded color values.
- Landing CTA styling now uses `text-[var(--color-accent-foreground)]` on dark CTAs to guarantee readable contrast on all link/button states.
- Primary homepage CTAs currently point to `/login` until auth flow is implemented in Feature 02.
- Auth uses InsForge `@insforge/sdk` v1.3.1 with the SSR helpers from `@insforge/sdk/ssr`.
- OAuth starts through local route handlers at `/api/auth/oauth/google` and `/api/auth/oauth/github`; these store the PKCE verifier in an app-owned httpOnly cookie before redirecting to the provider.
- `/callback` completes the OAuth exchange server-side, sets InsForge auth cookies with `setAuthCookies`, then redirects incomplete or missing profiles to `/profile` and complete profiles to `/dashboard`.
- Next.js 16 route protection is implemented with root `proxy.ts`, not deprecated `middleware.ts`.
- PostHog browser initialization runs from root `instrumentation-client.ts` (Next.js 16's client entrypoint) calling `initPostHog()` in `lib/posthog-client.ts`. `components/layout/PostHogProvider.tsx` also existed and was mounted from `app/layout.tsx` — **two** init paths calling `posthog.init()`, which produced `[PostHog.js] You have already initialized PostHog! Re-initializing is a no-op` on every page load. The provider was deleted and `initPostHog` is additionally guarded by a module-level `initialized` flag so it is idempotent. It reads the canonical **`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`** plus `NEXT_PUBLIC_POSTHOG_HOST`. The env var must be read via a single static `process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` access: an `a ?? b` fallback chain leaves the first operand as a runtime lookup on `process.env`, which is always `undefined` in the browser, so the token only worked because Next.js inlined the second operand. Server tracking in `lib/posthog-server.ts` uses the same var name.
- PostHog optional features are explicitly disabled in `posthog.init()`: `disable_session_recording: true`, `capture_dead_clicks: false`, `capture_performance: false`, `autocapture: false`. This removes the `[SessionRecording] could not load recorder` and `[Dead Clicks] failed to load script` errors, which come from on-demand script loads off `us-assets.i.posthog.com` that nothing in this app uses.
- `TypeError: Failed to fetch` on `/e/` is **not** a config or token problem and must not be "fixed" in code. Verified from the shell that `POST https://us.i.posthog.com/e/` and `GET /decide/` both reach PostHog and CORS allows the origin. In-browser it fails with "Request failed before receiving an HTTP response", which is Brave Shields blocking the domain. Fix by allowlisting `us.i.posthog.com` and `us-assets.i.posthog.com` in Brave, or use a proxy region that is not blocked.
- PostHog server tracking is centralized in `lib/posthog-server.ts` with a typed event contract limited to the seven approved Jobbers event names.
- Authenticated placeholder pages call `posthog.identify()` through `PostHogIdentify`, and current sign-out links call `posthog.reset()` before hitting `/api/auth/logout`. **`/api/auth/logout` redirects to `/` (the landing page), not `/login`** — signing out should feel like leaving the product, not being bounced at a wall.

---

## Notes

- The homepage uses the provided assets from `public/logo.png` and `public/images/` to match the approved design.
- Production build verification passed after allowing `next/font` to fetch the required Inter font outside the sandbox.
- Feature 02 lint and production build verification passed. Build still requires network access for `next/font` to fetch Inter.
- Feature 03 lint and production build verification passed. The first build attempt still failed on the known sandboxed `next/font` fetch; rerunning with network access passed. The project font is now Mona Sans (the Inter import was removed during the landing redesign). PostHog stays inactive until `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is present in `.env.local`.
- Feature 04: four tables (`profiles`, `agent_runs`, `jobs`, `agent_logs`) created via InsForge CLI migrations with full RLS (16 policies). Two Postgres triggers on `profiles`: `on_profile_updated` auto-sets `updated_at`; `on_auth_user_created` on `auth.users` auto-inserts a minimal profile row on signup. `resumes` private storage bucket created with path-scoped RLS on `storage.objects`. `types/index.ts` created with `Profile`, `WorkExperience`, `Education`, `AgentRun`, `Job`, `AgentLog` interfaces.
- Feature 06: `actions/profile.ts` created with `saveProfile` (text fields → `profiles` table, `is_complete` calculated via `calculateCompletion`, `profile_completed` PostHog event on first completion) and `uploadResume` (PDF → InsForge Storage at `{userId}/resume.pdf`, URL saved to `profiles.resume_pdf_url`). `lib/profile-utils.ts` created with shared `calculateCompletion` (9 required fields). `MissingField` union type moved to `types/index.ts`. `ProfileForm` now accepts `profile` prop, initialises all state from DB, has `<form onSubmit>` with `useTransition`, loading/error/success feedback, and `coverLetterTone` field added to Job Preferences. `ResumeSection` uploads on file selection via `uploadResume`. `ProfilePage` fetches full profile from DB and passes real data to all components. Three bugs fixed post-build: (1) `requireUser()` moved outside `try/catch` in both actions so `NEXT_REDIRECT` is never swallowed; (2) `parseInt` NaN guard added for years of experience; (3) `.select("id").maybeSingle()` added after `.update()` so zero-rows-updated is caught as an error instead of silent success. Profile row backfilled for existing user via `INSERT … ON CONFLICT DO NOTHING`. `ProfileAttentionBanner` now returns `null` at 100% completion.
- Feature 08: `@react-pdf/renderer` installed. `app/api/resume/generate/route.tsx` (POST handler: auth → profile fetch → Gemini content generation → `renderToBuffer` → storage remove+upload → DB update → `revalidatePath`) and `app/api/resume/generate/ResumePDF.tsx` (server-only PDF component + `GeneratedContent` type) created. `ResumeSection.tsx` wired with `handleGenerate` handler, loading/error/success state, and `window.open('/api/resume/download')` on success. Route file is `.tsx` (JSX required for `renderToBuffer`). Buffer cast to `ArrayBuffer` before `new Blob()` to satisfy strict TS.
- Feature 07: `extractProfile` Server Action added to `actions/profile.ts`. Installs `pdf-parse@1.1.1` (v1) and `openai`. Flow: download resume from InsForge Storage → `pdf-parse` extracts text → Gemini with `response_format: json_object`, `temperature: 0.3`, `max_tokens: 800` → `ExtractedProfile` typed return. Empty-text guard returns user-friendly error. `ProfileForm` gains `ProfileFormHandle` ref type with `applyExtracted()` method via `useImperativeHandle`. `ResumeSection` gains `onExtracted` callback prop and an `Extract Profile` button (only visible when a resume exists). Thin `ProfilePageClient` client wrapper holds the `useRef<ProfileFormHandle>` and wires `ResumeSection.onExtracted → ProfileForm.applyExtracted`. `app/profile/page.tsx` now renders `ProfilePageClient` instead of the two components separately. Critical notes: (1) Must use `pdf-parse@1.1.1` (v1), NOT v2 — v2 uses pdfjs-dist v5 with ESM-only web workers that webpack cannot bundle in Server Actions. (2) Must import from `pdf-parse/lib/pdf-parse.js`, NOT the package index — the index.js has a debug block that reads a test PDF file on every `require()` call when `module.parent` is null (always true under Next.js/Turbopack), causing an ENOENT crash on page load.
- Feature 11: `GET /api/jobs` route created — accepts `search`, `matchFilter`, `sortOption`, `page` query params; runs server-side InsForge DB query with `.ilike` text search, `.gte`/`.lt` match score filters, `.order` sort, and `.range` pagination (20 per page); returns `{ jobs, totalCount, page, pageSize }`. `FindJobsClient` refactored: removed `useMemo`, added `fetchJobs` callback (called via `useEffect` on filter/sort/page changes and after a successful search); `initialTotalCount` prop added. `JobsTable` gains optional `isLoading` prop — dims table to `opacity-60` during fetch and skips empty-state when loading. `app/find-jobs/page.tsx` updated to fetch first page with `match_score` sort and pass `count` as `initialTotalCount`.
- Feature 10: `lib/adzuna.ts` — `searchJobs` HTTP helper. `app/api/agent/find/route.ts` — POST handler: auth → profile fetch → agent_run insert → Adzuna search → single Gemini batch scoring call → DB insert → agent_run update. `FindJobsClient` wired to `/api/agent/find`; after search, re-fetches from DB via `fetchJobs`. `jobs.source` corrected from `"linkedin"|"url"` to `"search"|"url"`.
- Feature 09: Find Jobs page built with mock data matching the design. `lib/utils.ts` created with `MATCH_THRESHOLD = 70`, `getMatchScoreColor`, `getMatchScoreTextColor`, `formatDate`, `formatSalary`. Components: `SearchControls` (job title + location inputs, Find Jobs button, success banner), `JobFilters` (text search + All Matches/High Match/Low Match dropdown + Match Score/Newest/Oldest sort), `JobsTable` (company icon, role, match score progress bar with score-range colors, salary, source badge, date), `JobsPagination` (showing X to Y of Z, Previous/page numbers/Next). `FindJobsClient` client wrapper owns all filter/sort/pagination state with `useMemo` for derived list. Filter and sort reset page to 1 on change. `Jobs by Adzuna` credit shown when jobs exist. Mock data uses 6 jobs matching the design exactly.
- Feature 05: full profile page UI built with mock data. Components: `ProfileAttentionBanner` (SVG completion ring, missing field warning badges), `ConnectedAccounts` (LinkedIn row with Connect button), `ResumeSection` (drag-and-drop PDF upload area, Generate Resume from Profile button), `ProfileForm` (Personal Info, Professional Info with tag inputs for skills/industries, Work Experience with add/remove roles + month/year selects, Education, Job Preferences). Navbar updated to `"use client"` with `usePathname`-driven active link highlighting.
- Feature 12: `app/find-jobs/[id]/page.tsx` created as a dynamic, server-rendered job details route. It authenticates with `requireUser()`, fetches one `jobs` row scoped by both `id` and `user_id`, and renders `notFound()` when unavailable. Components added under `components/job-details/`: `JobActions`, `JobInfo`, `MatchScore`, `JobDescription`, and `CompanyResearch`. The page matches `context/designs/job-details.png`: centered detail column, Back to Jobs link, job header with placeholder company icon, match score badge, View Job Post link, four info cards, AI match reasoning card, matched/gap skill badges, description card, company research empty state, and bottom Apply Now CTA. `Navbar` now accepts `isAuthenticated` to show the signed-in app actions shown in the design; authenticated app pages opt into that state. `types/index.ts` now includes `CompanyResearchDossier` and `Job.company_research`. Verification: `npm run lint` passes with four pre-existing warnings; `npm run build` passes and includes `/find-jobs/[id]`.
- Feature 12 review follow-up: `JobDescription` now renders the full stored description with `whitespace-pre-line`, includes populated structured sections (`responsibilities`, `requirements`, `nice_to_have`, `benefits`), and detects Adzuna previews ending in `…` or `...` to show a `View Full Job Post` notice. Important caveat: Adzuna `description` is often a source-side preview, so the app cannot display text that was never returned/saved; users get a direct full-post fallback in those cases. Verification: `npm run lint && npm run build` passes with the same four pre-existing warnings.
- Feature 16: Recent Activity wired to real DB data. `RecentActivity` now accepts an `items` prop (no more hardcoded mock array); renders an empty state when no activity exists. Dashboard page fetches `agent_runs` (completed, last 10 by `completed_at`) and `jobs` where `company_research IS NOT NULL` (last 10 by `found_at`) in the existing `Promise.all`. Both sets are mapped to a shared `ActivityItem` shape with a `sortKey`, merged, sorted descending, and sliced to 10. `formatDate` from `lib/utils.ts` formats timestamps as relative strings ("X mins ago", "Yesterday", etc.). Verification: `npm run lint && npm run build` passes with same four pre-existing warnings.
- Feature 15: Stats Bar wired to real InsForge DB data. `StatsBar` now accepts four props (`totalJobs`, `avgMatchRate`, `companiesResearched`, `jobsThisWeek`) instead of hardcoded mock values. Dashboard page runs a single `jobs` query selecting `match_score`, `company_research`, and `found_at` for the current user, then derives all four stats: total count, rounded average match score, count of non-null `company_research` rows, and count of rows with `found_at` within the last 7 days. Profile and jobs queries run in parallel via `Promise.all`. Verification: `npm run lint && npm run build` passes with same four pre-existing warnings.
- Feature 14: Dashboard Page full UI built with mock data. `recharts` installed. Components: `StatsBar` (4 stat cards — Total Jobs Found, Avg. Match Rate, Companies Researched, Jobs This Week — with green trend badges), `RecentActivity` (5 activity items with colored dot indicators: green for job_found, blue for researched), `CompanyResearchChart` / `JobsOverTimeChart` / `MatchDistributionChart` (all in `components/dashboard/AnalyticsCharts.tsx` as named client-component exports using recharts BarChart/AreaChart with token-driven colors, no hardcoded hex). Dashboard page fetches profile for completion banner, renders all components in the correct layout: stats row → activity+research chart row → jobs over time + match distribution row. Verification: `npm run lint && npm run build` passes with same four pre-existing warnings.
- Feature 13: Company Research Agent complete. `agent/research.ts` implements Browserbase Fetch API redirect resolution, single-session Browserbase + Stagehand homepage/sub-page extraction, and Gemini candidate-specific dossier synthesis with fallback synthesis when browser research fails. `app/api/agent/research/route.ts` authenticates, validates `jobId`, loads user-scoped job/profile data, logs agent progress to `agent_logs`, saves `jobs.company_research`, revalidates `/find-jobs/{id}`, and tracks `company_researched`. `components/job-details/CompanyResearch.tsx` now renders all 9 dossier fields read-only when saved, and `ResearchCompanyButton` handles loading/error/success plus `router.refresh()` after generation. `types/index.ts` now uses the full 9-field `CompanyResearchDossier`; `lib/posthog-server.ts` accepts `company_researched`; `zod` is an explicit dependency. Verification: `npm run lint` passes with four pre-existing warnings; `npm run build` passes and includes `/api/agent/research`.
- Jobbers rebrand + landing redesign complete. The whole Jobbers design system was ported from the `jobbers/` reference app into the main Next.js app: sunburst `JobbersIcon` logo (replacing the old `public/logo.png` raster), Mona Sans, zinc/purple palette, pastel bento cards, and `max-w-[1440px]` containers. `app/page.tsx` now composes `LandingNavbar → Hero → TopCompanies → AiMatcher → HowItWorks → LiveOpportunities → WallOfLove → Faq → LandingFooter`; dead `CTASection`, `Features`, `SuccessStory`, and unused `ConnectedAccounts` were deleted. All product-facing `JobPilot` strings became `Jobbers`, including the package name and the `jobbers_oauth_code_verifier` cookie. (The JSM-branded README sections and the three `public/readme/*.webp` JSM banners were removed in a later pass — see the JSM sweep entry below.) The landing page stays server-rendered except `LandingNavbar`.
- Landing UX passes: mobile menu opens from the top-left with reversible max-height/opacity animation, centered link spacing, body scroll lock, Escape/resize close, and managed tab order; footer social buttons use inline LinkedIn/GitHub/X SVGs (lucide ships no brand icons); smooth scrolling with `prefers-reduced-motion` fallback; `HowItWorks`/`AiMatcher` get 20px bottom radii; live opportunity cards are driven by `job.backgroundColor`.
- The `jobbers/` reference directory was deleted after a full audit: all 5 images verified byte-identical (md5) in `public/landing/`, and `rg` confirmed zero main-source references. Temporary `jobbers` entries were removed from `tsconfig.json` `exclude` and `eslint.config.mjs` `globalIgnores`. Dead `.btn-on-dark` CSS removed (defined but used in zero components). The `@theme` token block was intentionally kept in full — those tokens back Tailwind utility classes, so a `var()` grep under-reports their usage.
- Alicia testimonial image investigated and cleared: the file is a valid 896×1200 JPEG, the raw and `/_next/image` optimizer URLs both return 200 (94KB of real image data), the rendered `<img>` carries `src`/`srcSet`/`alt`, the center-crop trims only ~15px per side, and `WallOfLove.tsx:36-45` is behaviorally identical to the reference `WallOfLoveSection.tsx:89-98`. The reported symptom was a stale browser cache, not a code defect. All hydration errors in the dev log trace to the React DevTools extension (`chrome-extension://fmkadmapgofadopljbjfkapdkoienihi`), not app code; `<body suppressHydrationWarning>` covers the separate `cz-shortcut-listen` attribute injection.
- Dependency drift corrected. `package.json` had been hand-edited to 12 dependency versions that contradicted both `node_modules` and `package-lock.json` (e.g. `@insforge/sdk` declared `^2.0.0` while the installed/locked `1.3.1` is what actually provides the `@insforge/sdk/ssr` subpath used by `lib/insforge-client.ts`, `lib/insforge-server.ts`, and four auth routes). Nothing broke locally because `node_modules` was never reinstalled, but any fresh `npm ci` would have pulled 12 untested packages. All 12 ranges were synced to the installed versions, `next`/`react`/`react-dom` were re-pinned to exact versions to preserve the original intent, and the lock's stale `job_pilot` root name/version was corrected to `jobbers`. `npm ls` reports no invalid or missing deps.
- Verification: `npx tsc --noEmit` clean, `npm run lint` 0 errors / 3 pre-existing unused-variable warnings, `npm run build` passes all 14 routes, homepage returns 200 with all 7 section IDs, and no `JobPilot` references remain in application code. Note: the build requires env vars, so run `set -a && . ./.env.example && set +a && npm run build` — only `.env.example` exists, and a real `/login` needs actual InsForge credentials.
- Public landing-page job search shipped. New `app/api/public/jobs/route.ts` is a deliberately separate, unauthenticated endpoint from the auth-gated `/api/jobs` (which stays scoped to `user_id`). It calls Adzuna directly, validates the `filter` param against an allowlist, caps query length at 80 chars, and caches results in a module-level `Map` for 5 minutes so an anonymous visitor cannot burn the Adzuna quota per keystroke. Returns 503 with a friendly message when Adzuna creds are absent, and 502 when upstream fails. `lib/adzuna.ts` gained an optional `AdzunaSearchOptions` argument (`resultsPerPage`, `contractType`, `salaryMin`, `sortBy`) — the existing `app/api/agent/find` caller is unaffected. `LiveOpportunities` became a client component with a debounced (350ms) search input and four working filter chips (All roles / Remote / Full time / $150k+), an `aria-pressed` toggle group, a loading spinner, a result counter, an error line, and an empty state. A monotonic `requestId` ref discards out-of-order responses. Unknown companies fall back to an initials badge; known ones use `CompanyLogo`. Every "View" button points at `/login` so opening a role requires auth, which is the intended funnel. The static `jobListings` mock and its `matchScore`/`country`/`tags` showcase data were removed from `data.ts` since live results replace them; `PublicJob` lives in `types/index.ts`.
- Two real bugs found and fixed during the audit. (1) `initPostHog` was never called anywhere, so `identifyPostHogUser` / `resetPostHogUser` ran against an uninitialized `posthog-js` instance and silently no-opped; added `components/layout/PostHogProvider.tsx` (client, calls `initPostHog` in an effect) and mounted it from `app/layout.tsx`. (2) `@browserbasehq/sdk` 2.21.0 renamed `SessionCreateParams.timeout` to `api_timeout`, which broke `agent/research.ts:296`; updated. The 3 remaining lint warnings were also cleared (unused `useRef` in `ProfileForm`, unused `request`/`_req` params and their now-unneeded `NextRequest` imports in the resume routes), so lint is fully clean.
- Dependency upgrade to latest stable. Upgraded next 16.3.7, react/react-dom 19.3.0, lucide-react 1.48.0, zod 4.6.5, openai 7.23.0, recharts 3.10.1, posthog-js 1.434.18, posthog-node 5.54.1, playwright-core 1.63.0, @insforge/sdk 1.5.2, @browserbasehq/sdk 2.21.0, @react-pdf/renderer 4.9.0. Two packages are deliberately held back: **pdf-parse stays on 1.1.4** because v2 pulls pdfjs-dist v5 whose ESM-only web workers cannot be bundled in Server Actions, and `actions/profile.ts:9` imports the v1-only path `pdf-parse/lib/pdf-parse.js`; **@browserbasehq/stagehand stays on 3.5.0** because v4 makes the `Stagehand` constructor private (now `Stagehand.create()`), drops `init()` and `context` (now `browser`), and hard-pins `zod@4.4.3` internally — passing our own schema to `stagehand.extract()` then fails on a nominal zod type conflict, so "stagehand v4" and "latest zod" are mutually exclusive until that call is rewritten.
- Config cleanup. Replaced `.env.example` with a documented `.env.local.example` (no longer needed as a separate file since Next reads `.env.local`). **Open question flagged:** AGENTS.md documents the InsForge project as `2zu6ipjr.eu-central.insforge.app` but the old `.env.example` shipped `9zb7h4wq.us-east.insforge.app` — different projects in different regions; the template now carries the AGENTS.md value and needs confirming. Also noted: 3 README images (`readme-hero`, `readme-jsmpro`, `readme-videokit`) still show JSM branding and need replacing for the Jobbers rebrand.
- Dead code and asset sweep. Deleted `lib/insforge-client.ts` (unreferenced; the `/ssr` server clients are used instead), removed 13 unreferenced binary assets (17MB) covering `public/images/*`, `public/readme/{image (1),jsm-icon,jsm-thumbnail,thumbnail}`, and `public/thumbnails/*` — `public/` went 21MB → 4MB. Kept the 3 README-referenced images. `createPostHogServer` is no longer exported since only `trackPostHogEvent` uses it. Verified every custom CSS class (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-sm`, `.landing-hero-glow`) and every `data.ts` / `Logos.tsx` export is still referenced; the full `@theme` token block is intentionally kept because those tokens back Tailwind utilities, so a `var()` grep under-reports their real usage.
- Final state: `npx tsc --noEmit` 0 errors, `npm run lint` 0 errors / 0 warnings, `npm run build` passes all 16 routes including the new `/api/public/jobs`. Landing page returns 200 with all 7 section IDs, 0 `href="#"` placeholders, 0 stale testimonial names, and 22 auth-gated links. `proxy.ts` matcher covers `/dashboard`, `/profile`, `/find-jobs` and correctly leaves the public API and landing page open.
- Migrated the entire AI layer from OpenAI GPT-4o to Google Gemini. `openai` was uninstalled and `@google/genai@2.25.0` added. New `lib/llm.ts` is the single LLM entry point: `getGemini()` lazily builds a cached `GoogleGenAI` from `GEMINI_API_KEY` and throws a README-pointing error when unset, `getGeminiModel()` resolves `GEMINI_MODEL` with a `gemini-3-flash-preview` default, and `generateJson({ system, prompt, temperature, maxOutputTokens })` sends `responseMimeType: "application/json"`, guards against empty text, and returns the parsed object. All four direct call sites now use it: `app/api/agent/find/route.ts` (job scoring), `actions/profile.ts` (resume extraction), `app/api/resume/generate/route.tsx` (PDF content), `agent/research.ts` (dossier synthesis). Because `generateJson` throws, the previous "empty response" branches collapsed into the existing catch blocks, and `find/route.ts` gained a shared `unscored` fallback so a Gemini failure degrades to zero scores instead of a 500. `agent/research.ts` now configures Stagehand with `` `google/${getGeminiModel()}` `` and `GEMINI_API_KEY`; Stagehand 3.5.0 routes any `google/*` model through its own `GoogleClient`, so no SDK change was needed there. Env renamed `OPENAI_API_KEY` → `GEMINI_API_KEY` (+ optional `GEMINI_MODEL`) in `.env.local` and `.env.local.example`; README badge, AI blurb, key list, and the architecture/code-standards/library-docs/project-overview/build-plan docs were all updated. Docs now state `generateJson()` is the only sanctioned LLM call. Verified `npx tsc --noEmit` 0 errors, `npx eslint .` 0 errors, `npm run build` passes all 16 routes + proxy; a live `generateJson` smoke test resolves the model correctly and fails with the expected message while `GEMINI_API_KEY` is still blank.
- Live Gemini verification + a real truncation bug found and fixed. `GEMINI_API_KEY` verified working against the real endpoint: no 401/403, `gemini-3-flash-preview` returns valid JSON. **Bug:** Gemini 3 reasons by default and draws those tokens from the SAME `maxOutputTokens` budget. At the 800-token cap used by `extractProfile`, a 6-job scoring prompt spent 590 tokens on thinking (`thoughtsTokenCount: 590`) and stopped at `finishReason: MAX_TOKENS` mid-JSON, so `JSON.parse` failed with `Unexpected token`. Same prompt with thinking disabled returned all 6 results at 720 tokens. Fix in `lib/llm.ts`: `config.thinkingConfig.thinkingBudget` now defaults to `0` for every call (these are extract-then-format tasks, not deliberation), is overridable per-call via a new `thinkingBudget` input field, and a `finishReason === "MAX_TOKENS"` guard now throws a message naming the cap instead of surfacing a confusing JSON parse error. Re-verified live after the fix: 6-job scoring at 1200 tokens returns 6 results with scores, and a realistic resume (Jordan Alvarez, 2 roles, 9 skills) extracts correctly at the original 800-token cap. `npx tsc --noEmit` 0 errors, `npx eslint .` 0 errors, `npm run build` passes.
- Auth page chrome made auth-aware, and the two-CTA mobile bug fixed. `components/layout/Navbar.tsx` is driven by `isAuthenticated`, and the signed-out variant no longer advertises a single session-gated route. Desktop previously showed **Dashboard / Find Jobs / Profile on `/login`**, all of which 307 an anonymous visitor straight back to `/login` — removed; the signed-out desktop bar is now `Logo` + `ArrowLeft` "Back to home" + `.btn .btn-primary .btn-sm` "Get started". Mobile had **two competing CTAs** (a `"Start"` button in the bar *and* a `"Start for free"` one in the drawer); the bar button is gone so exactly one remains, and both CTAs are relabelled `"Get started"` to match `LandingNavbar`. The mobile drawer now holds one `ArrowLeft` "Home" link plus that CTA. The wordmark alone reads as a brand rather than an exit, which is why the explicit "Back to home" affordance was added. `components/layout/Footer.tsx` had the same exposure — it is rendered only on `/login`, and an earlier pass had pointed it at `/find-jobs`, `/profile`, `/dashboard`, so it now links only to `/`. Also aligned `Footer` padding to the navbar's `px-4 sm:px-6 lg:px-8` (it was `lg:px-10`, which visibly misaligned the logo under the header) and normalised `app/dashboard/page.tsx` from `max-w-360` to the shared `max-w-[1440px]` container. Verified against served HTML: **0** protected hrefs in the nav and **0** in the footer, exactly one CTA label, both back-home links present, drawer intact. `npx tsc --noEmit` 0 errors, `npx eslint .` 0 errors, `npm run build` passes.
- SEO / Open Graph shipped, and a real indexing bug fixed. Added `app/icon.svg` (sunburst vector, 32×32), replaced the Create Next App `app/favicon.ico` with a Jobbers 16/32/48 multi-size ICO, and added `app/apple-icon.png` (180×180). `app/opengraph-image.tsx` generates a 1200×630 `ImageResponse` PNG in brand colors; served output verifies as `image/png` at the correct dimensions. `app/layout.tsx` metadata now carries `metadataBase` (from `NEXT_PUBLIC_SITE_URL`, falling back to `http://localhost:3000`), a title template, description, `applicationName`, keywords, authors/creator, OpenGraph, `summary_large_image` Twitter, robots directives, and per-page canonicals. **Bug:** the root layout had `alternates: { canonical: "/" }`, which every route inherits — that declared `/login`, `/dashboard`, `/profile` and `/find-jobs` as duplicates of the homepage. The root canonical was removed; `/login` sets its own, and the four session-gated routes now opt out entirely through a shared `app/private-metadata.ts` helper (`robots: { index: false, follow: false }`, `alternates: { canonical: null }`) because they serve one user's private data. Added `app/robots.ts` (disallows `/api/`, `/dashboard`, `/profile`, `/find-jobs`; points at the sitemap) and `app/sitemap.ts` listing only the two genuinely public pages. `NEXT_PUBLIC_SITE_URL` is documented in `.env.local.example` with an explicit warning that omitting it publishes `localhost` canonicals and `og:image` URLs in production. Build now emits `/robots.txt` and `/sitemap.xml` as static routes.
- Context documentation corrected against the real code. `context/ui-rules.md` and `context/ui-tokens.md` still specified **Inter** and a `#7C5CFC` / `#E7EAF3` palette — the app has shipped **Mona Sans** and the zinc/`#6e56cf` tokens since the landing redesign; both files now name Mona Sans and the real token values, and `ui-tokens.md` states explicitly that primary buttons are near-black pills, not purple. `context/ui-registry.md` had drifted badly: it documented six `.landing-*` classes that exist in **zero** CSS rules and **zero** components, plus four deleted components (`Features`, `CTASection`, `SuccessStory`, `ConnectedAccounts`) and a hardcoded `#9CA3AF` chart axis. The phantom sections were removed, `Landing Buttons` was rewritten to document the real `.btn` system, the chart axis is now recorded as `var(--color-chart-axis)`, the mislabelled `Landing Navbar` entry became `App Navbar` (the file at `components/layout/Navbar.tsx` is the in-app chrome, not the landing one), and a new `App Footer` section was added. `AGENTS.md` told future work to use **Tailwind 3.4 (do not upgrade to v4)** while the project is locked to `tailwindcss@4.3.0` + `@tailwindcss/postcss`; that line now documents v4, the `@theme` token block, and the no-raw-palette rule. `AGENTS.md`'s AI guidance still described OpenRouter + the OpenAI SDK in four places and now describes Google Gemini via `@google/genai` funnelled through `lib/llm.ts`.
- JSM / JobPilot reference sweep. A repo-wide `rg` (excluding `node_modules`, `.next`, `.git`, `package-lock.json`) now returns **zero** matches for `jsm`, `jobpilot`, `job_pilot` or `job-pilot` outside the historical entries in `context/progress-tracker.md`. The last stragglers were all in `fix.md`, a 1,314-line point-in-time audit plan from 2026-09-29 whose findings have all since been applied; rather than delete the audit record it now opens with a `[!WARNING]` banner marking it superseded and pointing at this file as the live record, and its in-body `JSM_JobPilot` project name, `OPENAI_API_KEY` and `NEXT_PUBLIC_POSTHOG_KEY` references were corrected to `Jobbers`, `GEMINI_API_KEY` and `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`. `README.md` was rewritten to drop the JSM tutorial/promo sections, the Discord invite, the dead `BROWSERBASE_REPORT.md` link, the old `job_pilot` clone path and the inaccurate "auto-apply"/LinkedIn claims, and now describes the real Adzuna → Gemini → company research → resume flow; the three JSM-bannered `public/readme/*.webp` assets were deleted along with the now-empty directory. The `AGENTS.md` ↔ `.env` InsForge URL discrepancy flagged earlier is resolved: all three files plus the live working project now agree on `https://y7fvq3ie.us-east.insforge.app`.
- **Tailwind upgraded to the latest stable release and the no-hardcoded-colour rule enforced to the core.** `tailwindcss` and `@tailwindcss/postcss` moved `4.3.0` → `4.3.3`, and the three UI context docs were reconciled against the running app rather than against each other. Two rounds of source cleanup followed. First, every raw Tailwind palette entry in `components/` was replaced with a project token — including the neutral ones, which are the easiest to overlook because they look harmless: 78 `bg-white` / `text-white` / `border-black` / `bg-white/70` style occurrences became `bg-surface`, `text-accent-foreground` (on `bg-ink`) or `text-inverse-foreground` (on `bg-inverse`), `border-ink`, and `bg-surface/70` style equivalents. Second, all inline SVG colours were moved onto tokens: the 81 `fill`/`stroke` attributes across 68 elements in `HowItWorks.tsx` and the illustrations in `Hero.tsx`, `AiMatcher.tsx` and `TopCompanies.tsx` now use `style={{ fill: "var(--color-*)" }}`, and the footer's social glyphs use `fill="currentColor"` to inherit the button's `text-accent-foreground`. A bare `fill="var(--color-*)"` presentation attribute is not portable and would not have rendered, which is why the `style` prop is used for everything token-driven and `currentColor` is reserved for shapes that should simply inherit. New tokens were added to cover art that had no home: `--color-scrim` (the portrait gradient that was `from-black/85`), the `violet-*`, `lavender-*`, `peach-*`, `art-*` and `pastel-*` families, and `text-strong` / `text-faint`. `context/ui-tokens.md` now embeds the `@theme` block **verbatim** from `app/globals.css` — 84 colour tokens, verified identical in both directions by script rather than by eye.
- **One palette leak found and fixed during the sweep.** `text-zinc-900` / `text-zinc-100` in `HowItWorks.tsx` were real Tailwind built-ins, i.e. genuine palette leakage, and resolved to `text-text-primary` / `text-inverse-foreground`. *Correction to an earlier entry in this file:* an earlier version of this line claimed three dead-class bugs (`bg-violet`, `ring-violet`, `border-violet`). That was wrong — those bare classes were **never present in any source file**. They were false positives from a substring audit that read `.bg-violet-panel` / `.ring-violet-glow/60` / `.border-violet-border` as the bare names, and all three are valid project-token utilities. The self-validating parser described two entries below confirms this. The genuine fix in that area is the zinc pair above.
- **The hex rule is now enforced with a documented, narrow exception list.** `app/globals.css` and `context/ui-tokens.md` are the only places hex is allowed to live. Exactly four files retain literals, each commented at the point of use and listed in a table in `context/ui-rules.md`: `app/opengraph-image.tsx` and `app/api/resume/generate/ResumePDF.tsx` render in engines (`next/og`/Satori and `@react-pdf/renderer`) that cannot read CSS custom properties, and `components/homepage/Logos.tsx` / `components/homepage/TopCompanies.tsx` hold third-party trademark colours (Meta blue, the Microsoft four-square, HubSpot orange, the Rareburg mark) that would misrepresent the brands if recoloured. A repo-wide grep now returns hex in those four files and nothing else, no arbitrary `bg-[#…]` utilities survive outside the two brand wordmarks, and no raw palette class remains. `context/ui-rules.md` gained the corresponding Do-Nots — no `bg-[#f9fafb]`-style utilities, no literals in `fill=`/`stroke=`, and `bg-white` / `text-white` / `border-black` explicitly named as palette entries — while `AGENTS.md` was moved to `4.3.3` and given the same rule in condensed form.
- **`context/ui-registry.md` audited claim-by-claim instead of assumed.** A duplicate `Landing Footer` entry that documented `components/layout/Footer.tsx` (already covered by `App Footer`) was deleted. The `Landing Hero` entry had drifted badly — it claimed a `bg-gradient-to-…` arbitrary-hex gradient, `rounded-[26px]` browser frames, and clamp-based headings; the component actually uses `rounded-[32px] sm:rounded-[36px]`, `from-lavender via-lavender-soft to-peach`, and `text-4xl sm:text-5xl md:text-6xl lg:text-[72px]`, so the entry was rewritten from the live file. Smaller corrections: the attention banner's `stroke-dashoffset` is the camelCase `strokeDashoffset` SVG attribute; `PostHogLogoutLink` inherits its surface and radius from callers (Navbar passes `hover:bg-surface-secondary` and `rounded-lg`, not `bg-surface`/`rounded-md`); the Job Details page is a thin shell that composes `components/job-details/*`, so the cards belong to those files. Score-bar thresholds (`bg-success` ≥80 / `bg-info` 60–79 / `bg-warning` <60, via `getMatchScoreColor` in `lib/utils.ts`) were confirmed correct and left alone. All 19 sections were then machine-verified: every `File:` path resolves and every referenced utility exists in that file, with the only cross-file references (Tailwind-generated `.btn` utilities, `getMatchScoreColor`, caller-passed classes) individually traced to their real source.
- **The banned palette was still being compiled into the shipped CSS — root cause found.** Chasing why the built stylesheet contained `.bg-white`, `.text-white`, `.border-black`, `.text-zinc-900` and `.bg-purple-500` when no source file used them, the answer was Tailwind v4's automatic content detection. It scans the whole project, and `context/ui-rules.md`, `context/ui-tokens.md`, `AGENTS.md` and this file all quote those classes *as counter-examples* in the Do-Nots sections. Tailwind cannot tell documentation from code, so every banned class we had written down was being emitted as a live rule — the rule was being violated by the rule's own documentation. Fixed at the source with `@import "tailwindcss" source(none)` and explicit `@source` directives for `app`, `components` and `lib` (`globals.css`). All nine offending rules are gone from the bundle and the stylesheet shrank 69,667 → 65,297 bytes. The three directories are exhaustive: `actions` and `agent` contain no `className`, and nothing outside `app`/`components` renders markup. This is documented in `ui-rules.md` with the specific warning that a component directory added later will silently lose all styling.
- **Dead-class audit replaced with a parser that proves itself first.** The previous check reported 46–170 "no-op" classes depending on how it was written, which is a sign the checker was wrong rather than the code. Root causes: substring matching treats `.bg-violet-panel` as `bg-violet`; CSS escapes (`.sm\:px-6`, `.gap-1\.5`, `.w-\[800px\]`) must be reconstructed before comparison; `:where(...)` wrappers and `\\:`-escaped variant colons need unwrapping; and grouped selectors need splitting. The final parser builds the exact CSS-escaped selector for each source token and validates itself against 18 known-present control classes before reporting anything — it now passes all 18 and reports **0 of 614** class tokens as dead. A genuinely dead class would be silent at runtime, so this is the check that would have caught the earlier `bg-violet` / `ring-violet` / `border-violet` no-ops.
- **11 unreferenced design tokens removed.** `--color-error-foreground`, `info-dark`, `info-foreground`, `linkedin`, `linkedin-light`, `linkedin-foreground`, `overlay`, `overlay-dark`, `surface-muted`, `text-black` and `text-darker` had zero references in any component, CSS rule or `var()` call — the LinkedIn group in particular became dead when the footer social icons moved to `fill="currentColor"`, and the overlay pair duplicated `ink`'s value under a second name. Removing them took the theme from 84 to **73 colour tokens**; every remaining token is verified reachable from compiled CSS or source. `context/ui-tokens.md` was resynced from the live `@theme` again and still matches exactly in both directions.

- **The landing page showed 7 identical job cards for one requisition. Root cause: Adzuna
  multi-location postings, not a parsing failure.** Live API evidence — 20 raw `developer`
  results contained only **8 distinct postings**. Adzuna returns one requisition posted to N
  sites as N separate ads (`id`, `latitude`/`longitude` and a per-location *machine-predicted*
  salary all differ — `salary_is_predicted: "1"`), while `title`, `company.display_name` and
  `description` are **byte-identical**. A SimVentions "Mid-to-Senior Software Developer" req
  appeared 7 times across 7 Virginia counties, all showing the same 500-char description, so
  no amount of parsing or trimming could have separated them. Verified `description` equality
  programmatically rather than by eye. Two smaller defects surfaced in the same payload:
  aggregators append branding to the company name (`"SimVentions, Inc - Glassdoor ✪ 4.6"`), and
  a single predicted figure arrives as `salary_min === salary_max`, which rendered as the
  nonsense range `$184k – $184k`.

  **Fix, in `lib/adzuna.ts`** — `dedupeAdzunaJobs()` collapses the copies on a fingerprint of
  normalized title + company + the first 200 chars of description, keeping the copy with the
  highest `salary_max ?? salary_min` so the surviving card shows the best stated figure rather
  than whichever location ranked first. It is applied **inside `searchJobs()`**, so both
  `/api/public/jobs` and the authenticated `/api/agent/find` benefit — the latter previously
  wrote 7 near-identical `jobs` rows per requisition and spent Gemini tokens scoring the same
  description 7 times. `cleanCompanyName()` strips the trailing ` - <aggregator>` and
  `✪ rating` segments, but **only** when the remainder matches a known board name
  (`glassdoor|indeed|linkedin|…`), so legitimate names are left intact — verified against
  `American Honda Motor Co., Inc.`, `Johnson Controls` and `Wilmington Trust`, which all pass
  through unchanged. It is also applied to the Gemini scoring prompt in
  `app/api/agent/find/route.ts` so the aggregator name cannot bias a match score.

  **Over-fetching.** Because dedupe shrinks the page, `/api/public/jobs` now requests
  `RESULTS_PER_PAGE * 4` (capped at Adzuna's 50) and trims to 12 *after* dedupe. Measured
  distinct counts from 48 raw results: `developer` 28, `software engineer` 34, `react` 22,
  `data analyst` 25 — always enough to fill 12 cards. `formatSalary` collapses
  `min === max` to a single value.

  **Residual, and why it is not a bug.** After dedupe, 20 raw → 8 distinct and 50 raw → 30.
  The `Delivery Consultant - Application Development` pair that still shows twice is two
  genuinely different requisitions — `"…aws proserve"` vs `"…aws wwps proserve"`, different
  titles, posted days apart. A 200-char description fingerprint is deliberately the trade-off:
  it catches exact multi-location duplicates without merging two real jobs that happen to share
  a boilerplate AWS description prefix. Raising it would need a real similarity metric, not a
  longer slice.

  **Verified:** live `/api/public/jobs` returns 12 cards with **0** duplicate
  company+title+description tuples; 0 `Glassdoor` strings and 0 `$Xk – $Xk` ranges in the
  rendered homepage HTML. `npx tsc --noEmit` clean, `npm run lint` 0 errors / 0 warnings,
  `npm run build` passes all 22 routes.

---

## Handoff — Colour-System Sweep (2026-10-01)

### What was asked
Remove the bugs found by the raw-palette sweep. Scope grew from a class-by-class cleanup to
three root-cause fixes once the individual findings turned out to be symptoms.

### Done

**1. `HowItWorks.tsx` recovered from an accidental `git checkout --`.**
An uncommitted 277-line redesign was destroyed by a checkout. Restored from the build
artifact `.next/server/chunks/ssr/_19ud4qk._.js.map`, re-tokenized, verified back to 277
lines. Lesson recorded: never `git checkout --` an uncommitted redesign file here.

**2. Palette and hardcoded-hex sweep (`components/`, 78 occurrences).**
`bg-white` → `bg-surface`, `text-white` → `text-accent-foreground` or
`text-inverse-foreground` by surface, `border-black` → `border-ink`, plus opacity
equivalents. All inline SVG colours moved to `style={{ fill: "var(--color-*)" }}` — a bare
`fill="var(--color-*)"` presentation attribute is not portable and would not have rendered —
and footer social glyphs to `fill="currentColor"`. Gradients, illustration colours and the
`WallOfLove` portrait scrim tokenized; `--color-scrim` and the decorative `violet-*`,
`lavender-*`, `peach-*`, `art-*`, `pastel-*` families added to cover art that had no home.

**3. Exception policy documented instead of assumed.**
Exactly four files retain hex, each commented at the point of use: `app/opengraph-image.tsx`
and `app/api/resume/generate/ResumePDF.tsx` (Satori and `@react-pdf/renderer` cannot read CSS
custom properties), `components/homepage/Logos.tsx` and `components/homepage/TopCompanies.tsx`
(third-party trademark colours — recolouring Meta blue, the Microsoft four-square, HubSpot
orange or the Rareburg mark would misrepresent the brands).

**4. Root cause of the residual palette leak — docs were injecting banned CSS.**
The compiled stylesheet contained `.bg-white`, `.text-white`, `.border-black`,
`.text-zinc-900` and `.bg-purple-500` while no source file used them. Tailwind v4's automatic
content detection scans the whole project, and the Do-Nots sections in `ui-rules.md`,
`ui-tokens.md`, `AGENTS.md` and this file quote those exact classes as counter-examples.
Tailwind cannot distinguish documentation from code, so every banned class that had been
written down was compiled into a live rule — the rule was being violated by the rule's own
documentation. Fixed with `@import "tailwindcss" source(none)` plus explicit `@source` for
`app`, `components` and `lib`. Nine rules gone; bundle 69,667 → 65,297 bytes.
`@source "../lib"` is currently inert (`lib/` has no `className`) but is kept so a future
token helper there is picked up rather than silently losing styling.

**5. Dead-class checker rebuilt to validate itself.**
Earlier attempts reported 46, then 170, "no-op" classes — that spread meant the checker was
broken, not the code. Four defects: substring matching (`.bg-violet-panel` read as
`bg-violet`), CSS escape reconstruction (`.sm\:px-6`, `.gap-1\.5`, `.w-\[800px\]`), `:where()`
wrappers and escaped variant colons, and grouped selectors. The final parser builds each
token's exact escaped selector and checks 18 known-present control classes before reporting
anything. Passes 18/18, reports **0 of 614** tokens dead.

**6. 11 dead design tokens removed.** `error-foreground`, `info-dark`, `info-foreground`,
the three `linkedin-*`, `overlay`, `overlay-dark`, `surface-muted`, `text-black`,
`text-darker` — zero references anywhere. The LinkedIn group died when footer icons moved to
`currentColor`; `overlay`/`overlay-dark` duplicated `ink` under a second name. Theme 84 → **73
tokens**, each verified reachable. `ui-tokens.md` resynced from the live `@theme`.

**7. Context docs reconciled.**
`ui-tokens.md` now embeds `@theme` verbatim (script-verified both directions, not by eye).
`ui-rules.md` gained the Tailwind v4 notes, the source-scoping requirement and the exception
table. `ui-registry.md` audited claim-by-claim — removed a duplicate `Landing Footer`, rewrote
a badly drifted `Landing Hero` from the live file, and corrected `PostHogLogoutLink`,
`strokeDashoffset` and Job Details card ownership. All 19 sections machine-verified.
`AGENTS.md` moved to `4.3.3` with the condensed rule.

### Verified state
`npx tsc --noEmit` clean · `npx eslint .` clean · `npm run build` passes, 22 routes ·
0 no-op class tokens · 0 built-in palette vars in the bundle · hex confined to the 4
sanctioned files · `ui-tokens.md` ↔ `app/globals.css` identical.

### Where I stopped
The last code change was complete and fully verified. I was on the **one item still open:
rendering the app to confirm the `style`-based SVG token colours actually paint.** Those
colours are provably correct in CSS but have never been seen in a browser.

- `playwright install chromium` needs sudo — blocked.
- `firefox --headless --screenshot` was then tried as a workaround and produced **no PNG**
  across every flag combination (`--screenshot <path>`, `--screenshot=<path>`, bare
  `--screenshot`, with and without a dedicated `--profile`; Firefox 156.0.1, `MOZ_HEADLESS=1`).
  Cause not yet diagnosed. `playwright-core` is installed but has no browser binary to drive.
- I started `next start -p 3000` to get a live server for the check. **It is still running** —
  It has since exited, so the server is **not** running — start it again before retrying the check.

**Resume here:** diagnose the Firefox screenshot failure (`--profile /tmp/ffprof` was created
but the process exited without writing a file; likely worth checking `about:support` config or
trying `--window-size` with a URL passed after `--`), or use any other route to a headless
browser. The only assertion outstanding is that the SVG `style={{ fill: "var(--color-*)" }}`
attributes in `HowItWorks.tsx`, `Hero.tsx` and `AiMatcher.tsx` render with the intended
colours rather than falling back to black.

### Known environment limits (unrelated to this work)
- `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` blank → `/api/public/jobs` returns no live results.
- `NEXT_PUBLIC_SITE_URL` unset → production canonicals and `og:image` fall back to
  `http://localhost:3000`.
- Authenticated route checks may need an active InsForge session.

---

## Handoff — Security Audit Remediation (2026-10-05)

A full codebase audit was run (1 Critical, 2 High, ~26 Medium, ~10 Low). Three findings were
fixed; the remainder were reported and deliberately deferred. New shared modules: `lib/auth-cookies.ts`,
`lib/search-query.ts`, `lib/security-headers.ts`, plus `tests/` (28 tests, `npm test`).

### Done

**1. PostgREST filter injection (was Critical) — `lib/search-query.ts`.**
`GET /api/jobs` interpolated the raw `search` query param into a PostgREST `.or=(...)` filter.
Two independent grammar breaks: PostgREST treats `,` `(` `)` `"` `\` as structural, so a query
string could append predicates (`?search=dev,or=(user_id.not.is.null)`); `ilike` separately
treats `%` / `*` as wildcards, so a bare `%` widened the term to every row. `parseJobSearch()`
replaces those seven characters with a space, collapses whitespace runs, lowercases and caps at
80 chars. Extracted out of the route handler into `lib/` so it is unit-testable and so business
logic stops living in a route file.

**2. Security headers — `lib/security-headers.ts`, `proxy.ts`, `next.config.ts`.**
Eight headers, split by what needs to know the request:

| Header | Where | Why there |
|---|---|---|
| nosniff, XFO, Referrer-Policy, X-DNS-Prefetch-Control, Permissions-Policy | `next.config.ts`, `/:path*` | identical everywhere, static |
| HSTS | `next.config.ts`, gated by `has: x-forwarded-proto === https` | `headers()` receives **no request object**, so runtime gating is impossible there; `has` is the declarative equivalent |
| CSP | **both**, on non-overlapping sources | the strict policy needs a per-request nonce |

**CSP is nonce-based on exactly the session-gated routes.** `proxy.ts` generates a nonce per
request and sets the policy on both the request and response headers; Next.js reads it back out
of the CSP request header and stamps it on its own scripts, the page bundles and the inline
flight payload. Those routes were *already* `ƒ (Dynamic)` — `/login` included — so the strict
policy costs **zero** extra SSR. Only `/` and `/_not-found` are prerendered, and a nonce cannot
reach build-time HTML, so those two keep a static `'unsafe-inline'` policy via
`NON_PROXY_OWNED_SOURCE`. Forcing the 208KB marketing page dynamic to buy nothing was rejected:
the docs state nonces disable static optimization and CDN caching.

`style-src` stays `'unsafe-inline'` even under the nonce. A nonce **suppresses** `'unsafe-inline'`
for the directive it appears in, so a nonced `style-src` would silently drop Tailwind's runtime
styles instead of failing loudly, and inline CSS is not a script-execution vector.

`next.config.ts` and `proxy.ts` must never both set CSP on one path: duplicate response headers
resolve last-wins, so the static policy would overwrite the nonce. `PROXY_OWNED_ROUTE_PREFIXES`
drives the `next.config.ts` complement; `proxy.ts`'s own matcher is a hand-written literal because
**Next.js parses `config` at build time and rejects computed values** (a real build failure, not a
guess). `tests/security-headers.test.ts` reads `proxy.ts` and asserts the two lists are identical.

Also fixed: `upgrade-insecure-requests` was previously unconditional and would have rewritten
`http://localhost` in dev. It is now production-only, matching the Next.js CSP guide.

**3. Logout GET→POST + httpOnly cookies — `app/api/auth/logout/route.ts`, `lib/auth-cookies.ts`.**
Logout was a GET, so any `<img src>`, prefetch or crawler could sign a user out. It is now POST
only (GET returns 405 + `allow: POST`) with a 303 redirect and a real error log.
`components/analytics/PostHogLogoutLink.tsx` posts via `<form className="contents">` so
`components/layout/Navbar.tsx` needed no edits and its desktop-row / mobile-drawer layout holds.

`lib/auth-cookies.ts` is the single source of truth for `AUTH_COOKIE_SETTINGS` (`httpOnly: true`,
inferred as `NonNullable<Parameters<typeof setAuthCookies>[2]>` because `@insforge/sdk/ssr` does not
export the type). Three separate sites write auth cookies — `/callback`, `proxy.ts`,
`/api/auth/refresh` — and the SDK's `accessTokenCookieOptions` defaults `httpOnly` to **false**, so
one missed call site would have let a refresh silently restore a script-readable cookie.
`AuthCookieSettings` is spread into `createRefreshAuthRouter(AUTH_COOKIE_SETTINGS)` rather than
passed positionally, which is where the setting would otherwise be silently dropped.

### Tests — `npm test` (28 passing, zero new dependencies)

Node 26 strips TypeScript natively, so `node --test` runs the suite directly. `tsconfig.json`
gained `allowImportingTsExtensions` for the explicit `.ts` specifiers. Coverage is on the security
properties, not on trivia: the SDK's bare default is asserted to be `httpOnly: false` so the
httpOnly test would actually fail if someone deleted `AUTH_COOKIE_SETTINGS`; injection payloads are
asserted to be structurally inert; and `proxy.ts`'s matcher is diffed against the shared prefix
list. `tests/search-query.test.ts` **caught a real bug while being written** — per-character
replacement left `"sales, marketing"` → `"sales  marketing"`, so the `ilike` pattern could never
match; `parseJobSearch` now collapses whitespace runs.

### The verification that mattered

Header inspection alone was not proof. A temporary experiment (proxy temporarily owning `/login`,
session check short-circuited, both reverted) rendered a real page and confirmed in a **single**
response: the header nonce matched all 18 `<script>` tags, **zero** scripts were un-nonced, and the
inline `self.__next_f` flight payload was nonced. Without this, the strict policy would have
white-screened `/dashboard`, `/profile` and `/find-jobs`. Also verified live: nonces differ per
request; HSTS is absent without `x-forwarded-proto`, present with `https`, absent with `http`.

### Not done

- **The login round-trip is still untested.** No live InsForge session or browser is available here,
  so the httpOnly change is verified through SDK source and unit tests only. **Log out and back in
  once after deploy.**
- Audit items 4–7 deferred on request: no rate limiting on the 3 AI routes, a singleton PostHog
  client, and unbounded `Map` growth in unauthenticated `/api/public/jobs`.
- Dead PostHog events (`job_url_submitted`, `cover_letter_generated`, `resume_tailored`,
  `linkedin_connected`) and the `linkedin_connected` column.
- 11 bare `fill="var(--color-*)"` / `stroke=` presentation attributes in `AnalyticsCharts.tsx`,
  `ProfileAttentionBanner.tsx` and `ResumeSection.tsx` that the project's own rules say will not
  render — the same defect the earlier sweep fixed elsewhere.
- `app/api/jobs/route.ts:19` — `page` yields `NaN`, defeating its own `Math.max` guard.
- `app/api/agent/find/route.ts:152` — unvalidated `location`.

---

## Handoff — Footer Social Icons Invisible (2026-10-05)

**Symptom:** the three footer social buttons rendered as plain near-black rounded squares — the
LinkedIn / GitHub / X glyphs were invisible. Reported as "only black circular background".

**Root cause: a CSS cascade-layer bug, not a colour-token bug.** `app/globals.css` ended with
element defaults written **unlayered**, including:

```css
a { color: inherit; text-decoration: none; }
```

Tailwind v4 emits every utility into `@layer utilities`, and per the CSS cascade spec an
**unlayered rule outranks every layered one regardless of specificity**. So `color: inherit` beat
`.text-accent-foreground` on the button, and each glyph — which is `fill="currentColor"` — inherited
`text-text-primary` (near-black) from the surrounding light `bg-surface` panel, painting black on the
`#18181b` circle.

This was **systemic, not footer-local**: it silently defeated the colour of *every* `<a>` in the app
carrying a `text-*` utility. Measured before the fix — `.text-accent-foreground` and `bg-ink` were
both present and correct in the compiled CSS (`#fff` on `#18181b`), the SVG markup and path data
were correct in the prerendered HTML, which is why it looked like a token-pairing problem and was not.

**Fix:** the trailing block is now layered. Element defaults (`html`, `body`, `box-sizing`, `a`,
`a[href]`/`button` cursors, tap-highlight, `font: inherit`, `::selection`, `scroll-margin-top`) moved
into `@layer base`; the reusable classes (`.landing-hero-glow`, the whole `.btn*` system) into
`@layer components`. Cascade order is now base → components → utilities, which is the intended
Tailwind v4 hierarchy.

`.btn*` was also unlayered, which had the same defect in reverse — it outranked utilities, so a
one-off `bg-*`/`text-*` on a `.btn` element would have been ignored. Moving it to
`@layer components` fixes that. Verified safe first: **no** element in the codebase combines a
`.btn*` class with a conflicting colour utility, so no existing element changes appearance.

**Verified in the compiled CSS** (`python3` layer-trace over the built stylesheet): `a{color:inherit}`
enclosing layer = `base`, `.btn-primary` = `components`, `.text-accent-foreground` and `.bg-ink` =
`utilities`. 8 anchors that carry an explicit `text-*` colour now render the colour they always
asked for (`text-text-primary` ×3, `text-text-secondary` ×2, `text-text-muted` ×2,
`text-text-strong` ×1) instead of silently inheriting.

**Lesson for future work: never add element defaults to `globals.css` unlayered.** A new unlayered
`a`/`button`/`svg` rule will silently outrank every Tailwind utility in the app, and the symptom
(invisible or wrong-coloured icons/text) points nowhere near the cause.

**Also in this pass** — social links now point at the real accounts
(`linkedin.com/in/muideen7`, `github.com/muideen7`, `x.com/OlayeyeMuideen`), and the label→icon
pairing was changed from an `if/if/return` chain with an implicit X fallback into a
`Record<SocialLabel, ReactNode>` keyed off a literal union of `socialLinks`. A renamed or
misspelled network is now a compile error rather than a silently wrong brand glyph.

`npx tsc --noEmit` 0 errors · `npx eslint .` 0 errors · `npm run build` passes · `npm test` 28/28.

### Strict TypeScript pass — completed

The flags outside `strict` are now on and the code satisfies them: `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`,
`noImplicitReturns`, `noFallthroughCasesInSwitch`. Combined with the earlier work the codebase has
zero `any`, zero `@ts-ignore`/`@ts-nocheck`, zero `as unknown as` double-assertions, and **no
non-null assertions or index assertions added to silence the new flags**. Every fix is a real code
change:

- `app/api/agent/find/route.ts` — the parallel-array read `unscored[i]` (indexed with `jobs`'s
  index) is gone. The map now iterates `unscored` and uses `parsed.results?.at(i)` for the
  positional fallback, so the element it returns *is* the fallback. Same behaviour, no unchecked
  read.
- `app/dashboard/page.tsx` — `DAY_LABELS[d.getDay()]` → `DAY_LABELS.at(...)` guarded by an
  `undefined` check, in both the jobs-by-day and research-by-day loops.
- `app/(auth)/callback/route.ts` — the auth-critical `refreshToken`. The object is now built with
  `const tokens: Parameters<typeof setAuthCookies>[1]` and the key is only assigned when a refresh
  token actually exists. This is **behaviour-identical**: the SDK guards with
  `if (tokens.refreshToken)`, so an absent key and an explicit `undefined` are equivalent. Deriving
  the type from the SDK means it cannot drift.
- `tests/auth-cookies.test.ts` — the `Record<string, unknown>` that was hiding `httpOnly` (found
  while measuring `noPropertyAccessFromIndexSignature`) is replaced with the SDK's real
  `CookieOptions`. The test previously compared an `unknown` against `true`, so a misspelled cookie
  flag could never have failed it; it can now.
- `agent/research.ts`, `lib/adzuna.ts` — index reads folded into the existing null/fallback.

`noPropertyAccessFromIndexSignature` remains deliberately **off**: all 35 errors are
`process.env.X` → `process.env["X"]` churn with no real safety gain.

### PostHog "[ExceptionAutocapture] failed to load script"

Reported as a Next.js console error. Root cause traced through the minified `posthog-js` 1.434.18
bundle rather than guessed at: `init` with `capture_exceptions: true` constructs the
exception-autocapture loader, whose `tf()` reads `config.capture_exceptions` and whose
`startIfEnabledOrStop()` only calls `loadExternalDependency("exception-autocapture", ...)` when
`isEnabled` — any of `capture_console_errors` / `capture_unhandled_errors` /
`capture_unhandled_rejections`. With `capture_exceptions: false` all three are false, so it takes
the stop path and the request is never made. This is the same class of error already fixed for
session recording and dead clicks, and it costs nothing here: **there is no error boundary and no
`posthog.captureException()` call anywhere in the codebase**, so exception autocapture had nothing
to report even when the script did load.

Also checked the other six tags posthog can fetch (`tracing-headers`, `surveys`, `toolbar`,
`remote-config`, `product-tours`, `dead-clicks-autocapture`): every one is either already opted out
or not constructed by this config. Note `disable_external_dependency_loading: true` is **not** a
fix — it calls the error callback with a message instead, so the console error persists.

`lib/posthog-server.ts` uses `posthog-node`, which has no browser asset loading, so it was
unaffected. `lib/posthog-client.ts` now exports `buildPostHogConfig(host?)` so the 5 new tests in
`tests/posthog-client.test.ts` assert on the object `posthog.init` actually receives, not on
grepped source text.

`npx tsc --noEmit` 0 errors · `npx eslint .` 0 errors · `npm run build` passes (22 routes) ·
`npm test` 33/33.

**Still needs a human:** log out and back in once after deploy to confirm the httpOnly
access-token cookie behaves on a real session — no live InsForge session is available locally.

## Handoff — OAuth Provider Icons Were Not The Real Brands (2026-10-05)

### Done

The two provider buttons on `/login` drew **generic lucide glyphs**, not the brands they sign you
in with: Google rendered `<Globe />` (a globe, shared with every other OAuth provider) and GitHub
rendered `<GitBranch />` (a git-branch diagram, which is Git's icon, not GitHub's). Both buttons now
render the real marks via the existing `CompanyLogo`:

```tsx
<CompanyLogo type="google" className="h-5 w-5 shrink-0" />  // Continue with Google
<CompanyLogo type="github" className="h-5 w-5 shrink-0" />  // Continue with GitHub
```

`CompanyLogo` in `components/homepage/Logos.tsx` already had correct marks for both, so this is a
reuse rather than new artwork — no new SVG path data was introduced, and `Globe` / `GitBranch` are
no longer imported.

### Why not just recolour the lucide icons

Two of the reasons matter enough to record:

1. **A tint of a wrong shape is still a wrong logo.** Recolouring `<Globe />` blue would not make it
   Google's mark; the silhouette is not Google's. Google's mark is also genuinely four-colour, so
   the "make it a single path in `currentColor`" shortcut produces a *different logo*, not a themed
   one. `Logos.tsx` already carries that reasoning in a comment on the Google branch, and it returns
   early with explicit brand fills before `companyFills` is consulted — which is why
   `companyFills.google` is `""` and yet Google still renders in colour.
2. **GitHub needed no new colour at all.** `companyFills.github` is `currentColor`, so the Octocat
   inherits the button's `text-text-primary`. Dropping the icon's own `text-text-primary` (and the
   Google button's `text-accent`) is what keeps the ink consistent with the button label rather than
   hardcoding it twice.

`shrink-0` was added so the `h-5 w-5` mark cannot be squeezed by the flex button at narrow widths.

### Trade-off worth knowing

`CompanyLogo` lives under `components/homepage/` and is now imported from `components/auth/`. That is
a cross-feature import, permitted by the architecture rules — `components/` is UI-only with no data
fetching, and the one hard boundary (`/agent` never imports from `/components`) does not apply here.
The alternative is promoting the brand marks to a shared `components/brand/` and re-pointing the five
homepage call sites; that is the tidier end state if this file keeps growing, and it is the change I
would make before adding a third provider.

`context/ui-registry.md` now records the provider-icon rule so a future edit does not reintroduce
`Globe` / `GitBranch`.

### Verification

`npx tsc --noEmit` 0 errors · `npx eslint .` 0 errors · `npm test` 33/33 · `npm run build` passes
(22 routes).

**Still needs a human:** eyeball `/login` in both colour schemes. The GitHub mark is `currentColor`,
so it is correct by construction, but the Google mark's four brand hexes are fixed and are the one
thing here that will not adapt to a dark-theme surface on its own.

---

## Handoff — OAuth Sign-In Silently Failed In Chromium Browsers (2026-10-06)

**Symptom:** "Continue with Google/GitHub" bounced straight back to `/login` with no error in
Brave/Chrome. Firefox completed the whole flow. Deployed app only (`jobbers-match.vercel.app`).

**Root cause — not the browser profile, not the backend, not the Oct 5 auth commit:**
`lib/security-headers.ts` sets `form-action 'self'` on every policy. The buttons were
`<form action="/api/auth/oauth/{provider}" method="get">`. Chromium re-checks `form-action`
against every hop of a *form submission's* redirect chain, so the route's `307` to
`accounts.google.com` / `github.com` violated `'self'` and Chromium aborted the navigation —
the user silently landed back on `/login`. Firefox does not apply `form-action` to redirects,
which is exactly why it only "broke after switching system" (new machine → different default
browser).

**Proof:**
- Fresh-profile headless Brave on the deployed `/login`: form click → CSP violation
  `Sending form data to .../api/auth/oauth/google? violates "form-action 'self'"`, never leaves
  the page. Same result on localhost.
- Direct `page.goto("/api/auth/oauth/google")` in the same Brave: lands on Google sign-in,
  zero violations → the backend chain was always fine.
- Backend logs corroborate: `OAuth PKCE code created` + clean `302`, and Firefox's full
  round-trip (`/shared/callback` → app `/callback` → exchange) completed successfully.

**Fix (`components/auth/LoginCard.tsx`):** the two provider buttons are now plain
`<a href="/api/auth/oauth/{provider}">` links (identical classes, no visual change). A link
navigation is not a form submission, so `form-action` never applies and the strict CSP stays
untouched — deliberately **not** loosened to `form-action 'self' https://accounts.google.com …`.
`<a>` over `<Link>` on purpose: these are API routes and Link's viewport prefetch would fire
`signInWithOAuth` and burn the one-time PKCE state before the click; the
`@next/next/no-html-link-for-pages` rule is disabled inline with that reasoning.

**Verification:** `npx eslint .` 0 · `npx tsc --noEmit` 0 · `npm test` 33/33 · headless Brave
click on the rebuilt login page reaches `accounts.google.com` with zero `form-action` violations.

**Known separate issue (untouched):** PostHog's `us-assets.i.posthog.com` config fetch is blocked
by `script-src`/`connect-src` on the static (nonce-less) policy — analytics config + surveys fail
to load on prerendered routes. Pre-dates this fix; needs its own pass (add the host to
`connect-src`/`script-src` or self-host the loader).

**Still needs a human:** complete one real Google **and** GitHub sign-in in Brave on the deployed
app after this ships.
