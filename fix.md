# Jobbers — Codebase Audit & Fix Plan

**Audit date:** 2026-09-29
**Commit:** `788baa5 Update`
**Scope:** Full-stack audit — backend/data layer, frontend/UI layer, config, docs, infra.
**Method:** Static read of all 74 source files + verification against installed `node_modules` type definitions, Next.js 16 bundled docs, and live `tsc` / `eslint` / `next build` runs.

> No source files were modified during this audit. This document is a plan, not a record of applied changes.

> [!WARNING]
> **Superseded — do not treat this file as current state.** This is a point-in-time audit plan from
> 2026-09-29 and every finding below has since been applied. It is retained only as an audit record.
> The live record of the codebase is [`context/progress-tracker.md`](context/progress-tracker.md).
> Known drift in this document: the InsForge project is **Jobbers** (not `JSM_JobPilot`), the AI
> provider is **Gemini** (`GEMINI_API_KEY`, not `OPENAI_API_KEY`), PostHog uses the canonical
> `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, and `.env.local` now exists and *is* git-ignored (§4.1/§4.3).

---

## Table of Contents

- [1. How the Project Works](#1-how-the-project-works)
- [2. Verification Results](#2-verification-results)
- [3. Blocker — Build Fails](#3-blocker--build-fails)
- [4. Blocker — Environment Configuration](#4-blocker--environment-configuration)
- [5. Security Fixes](#5-security-fixes)
- [6. Correctness Bugs](#6-correctness-bugs)
- [7. Missing Infrastructure](#7-missing-infrastructure)
- [8. Deprecated & Stale Documentation](#8-deprecated--stale-documentation)
- [9. Dead Code](#9-dead-code)
- [10. Design Token Violations](#10-design-token-violations)
- [11. Analytics Contract Mismatch](#11-analytics-contract-mismatch)
- [12. Schema Gaps](#12-schema-gaps)
- [13. Resource & Performance](#13-resource--performance)
- [14. What Works Well](#14-what-works-well)
- [15. Fix Priority](#15-fix-priority)
- [16. Appendix — Full File Reference](#16-appendix--full-file-reference)

---

## 1. How the Project Works

### Stack

| Layer | Technology | Installed version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | `16.2.7` |
| UI runtime | React / React DOM | `19.2.4` |
| Language | TypeScript | `^5` |
| Styling | Tailwind CSS (v4, CSS-first `@theme`) | `4.3.0` |
| BaaS | `@insforge/sdk` (Postgres + Auth + Storage) | `1.3.1` |
| AI | `openai` (`gpt-4o` / `openai/gpt-4o`) | `^6.42.0` |
| Browser automation | `@browserbasehq/stagehand` + `playwright-core` | `^3.5.0` / `^1.60.0` |
| Jobs data | Adzuna API (v1) | via `lib/adzuna.ts` |
| Charts | `recharts` | `^3.8.1` |
| PDF | `@react-pdf/renderer` | `^4.5.1` |
| Analytics | `posthog-js` + `posthog-node` | `^1.379.0` / `^5.35.12` |
| Validation | `zod` (only used in `agent/research.ts`) | `^4.4.3` |

### Routing & Middleware

`proxy.ts` sits at the repository root and **is live** — `next build` emits `ƒ Proxy (Middleware)`.
This is the Next.js 16 replacement for the deprecated `middleware.ts` convention, confirmed against
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md:9`
(*"The `middleware` file convention is deprecated and has been renamed to `proxy`."*).

**Request flow:**

```
Browser request
   │
   ├─ matcher: /dashboard/:path* , /profile/:path* , /find-jobs/:path*
   │     proxy.ts:50  → updateSession()  [@insforge/sdk/ssr]
   │     proxy.ts:57  → no accessToken?  → redirect /login?next=<path>
   │     proxy.ts:61  → refresh cookie on response
   │
   ├─ Server Component page
   │     lib/auth.ts:22  requireUser()  → lib/auth.ts:10 getCurrentUser()
   │     lib/insforge-server.ts  → createServerClient({ cookies: await cookies() })
   │     → InsForge Postgres (PostgREST passthrough, RLS via auth.uid())
   │
   └─ Server Action (actions/profile.ts)
         → requireUser() → Zod-less validation → upsert profiles / storage
```

`lib/insforge-client.ts` also creates a browser client, but **it has zero importers** — see [§9](#9-dead-code).

### Authentication

OAuth-only, PKCE, server-exchanged:

1. `app/api/auth/oauth/[provider]/route.ts:30` — `auth.signInWithOAuth(provider, { redirectTo, skipBrowserRedirect: true })`.
   Provider is allow-listed at `:4,23` against `["google", "github"]`.
2. PKCE verifier is stashed in an httpOnly `jobbers_oauth_code_verifier` cookie (`:45-51`).
3. Redirect lands on `/callback` (the `(auth)` route group is not part of the URL — confirmed in
   `.next/dev/types/routes.d.ts:5`).
4. `app/(auth)/callback/route.ts:45` — bare `createServerClient()` (no cookie store, so `isServerMode: true`
   with an undefined edge token; the SDK uses the `client_type=mobile` exchange endpoint and returns the
   refresh token in the body, which `:63-66` writes to httpOnly cookies).
5. `lib/auth.ts:30` — `getPostLoginRedirectPath()` routes to `/profile` if `profiles.is_complete` is false,
   else `/dashboard`.

### The AI Agent Pipeline

**Find jobs** — `app/api/agent/find/route.ts`
```
POST { jobTitle, location }
  → requireUser()                                :130
  → load profile (skills/industries/experience)   :161-165
  → INSERT agent_runs { status: "running" }       :177-189
  → searchJobs()  → lib/adzuna.ts                :205
  → LLM scoring  → openai gpt-4o                 (ScoredResult)
  → INSERT jobs[] (19 fields)                     :240-260
  → UPDATE agent_runs { status: "completed" }     :288-292
  → INSERT agent_logs                             (fire-and-forget)
  → trackPostHogEvent("job_found") per job        :275-284
```

**Research company** — `app/api/agent/research/route.ts` → `agent/research.ts`
```
POST { jobId }  (UUID-validated at :38-42, :66)
  → load job + profile
  → resolve homepage URL  → bb.fetchAPI.create   (up to 5 candidates)
  → bb.sessions.create({ timeout: 120 })          research.ts:296
  → Stagehand drives the page (≤3 navigations, 30s each)
  → LLM synthesis → Zod parse → safeParse         research.ts:530
  → UPDATE jobs.company_research (jsonb)          :169
  → revalidatePath()                              :192
```

**Graceful degradation is genuinely implemented** — `buildFallbackDossier()` (`research.ts:429-465`)
synthesises a usable dossier from job + profile data, and there are five `emptyResearch` early-returns.
Caveat: see [§3](#3-blocker--build-fails) — the Browserbase guard is currently unreachable.

### Data Model

Five tables, six migrations, all in `migrations/`:

| Table | File | Purpose |
|---|---|---|
| `profiles` | `20260603114532` | 26 columns, 1:1 with `auth.users` |
| `agent_runs` | `20260603114534` | One row per `/api/agent/find` invocation |
| `jobs` | `20260603114535` | 28 columns incl. `match_score`, `company_research` |
| `agent_logs` | `20260603114536` | Per-run activity log |
| `storage.objects` RLS | `20260603114724` | Policies for `bucket = 'resumes'` |
| `jobs.company_research` | `20260605000000` | Additive `jsonb` column |

`profiles.handle_new_user()` (`20260603114532:63-74`) is an `AFTER INSERT ON auth.users` trigger —
the app hard-depends on it firing, since `actions/profile.ts:100-125` only `UPDATE`s and errors with
*"Profile not found. Please sign out and sign in again."* at `:134` if no row matches.

---

## 2. Verification Results

| Check | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | ✅ **exit 0**, clean |
| Lint | `npx eslint` | ✅ **0 errors**, 4 warnings |
| Build (no env) | `npm run build` | ❌ **FAILS** — see [§3](#3-blocker--build-fails) |
| Build (dummy env) | `npm run build` | ✅ 28s compile, 14 routes, proxy registered |
| SDK API surface | Read `node_modules/@insforge/sdk/dist/*.d.ts` | ✅ All app calls valid in 1.3.1 |
| Schema drift | Cross-checked every column | ✅ **Zero drift** |
| `any` types | Repo-wide regex | ✅ **Zero** |
| `console.log` | Repo-wide grep | ✅ **Zero** (39 `console.error`, all prefixed) |
| Raw Tailwind palette | Word-bounded regex | ✅ **Zero** |
| Hardcoded secrets | Scan for `sk-`, `phx_`, `eyJ`, `api_key=` | ✅ **Zero** |
| Tracked env files | `git ls-files \| grep -i env` | ✅ Only `.env.example` |

**Installed version reality-check** (all confirmed via `node_modules`):

| Claim source | Says | Reality |
|---|---|---|
| `AGENTS.md` | Tailwind **3.4**, "do not upgrade to v4" | ❌ **v4.3.0 installed & correctly configured** |
| `context/ui-tokens.md:9`, `ui-rules.md:184` | Tailwind **v4** | ✅ Correct |
| `context/architecture.md:308` | `@insforge/ssr` | ❌ Package is `@insforge/sdk/ssr` |
| `context/library-docs.md:40` | `createBrowserClient(url, anonKey)` positional | ❌ Takes a single options object |
| `proxy.ts` convention | — | ✅ Correct for Next 16, live |
| `app/api/resume/generate/route.tsx` | `.tsx` route | ⚠️ Valid (matches on `/route`), but violates `code-standards.md:59` |

---

## 3. Blocker — Build Fails

### 3.1 `lib/browserbase.ts` throws at import time

**Severity: CRITICAL — `npm run build` fails out of the box.**

```
▲ Next.js 16.2.7 (Turbopack)
  ✓ Compiled successfully in 26.5s
  ✓ Finished TypeScript in 12.9s
  Collecting page data using 7 workers ...

Error: The BROWSERBASE_API_KEY environment variable is missing or empty;
       either provide it, or instantiate the Browserbase client with an apiKey
       option, like new Browserbase({ apiKey: 'My API Key' }).
    at new di (.next/server/chunks/...js:324:33055)
    at module evaluation (...)
    at Object.<anonymous> (.next/server/app/api/agent/research/route.js:15:3)

Error: Failed to collect page data for /api/agent/research
```

**Root cause** — `lib/browserbase.ts:1-5`:

```ts
import Browserbase from "@browserbasehq/sdk";

export const bb = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY!,
});
```

The module-level `new Browserbase(...)` executes during the build's page-data collection phase.
The SDK's constructor **throws** when `apiKey` is `undefined` or empty. The `!` non-null assertion
lies — it suppresses the TypeScript error but does nothing at runtime.

### 3.2 The existing degradation guards are unreachable dead code

`agent/research.ts` already contains the correct defensive checks:

- `research.ts:202` — `if (!candidateUrl || !process.env.BROWSERBASE_API_KEY) { ... }`
- `research.ts:280-281` — `const apiKey = process.env.BROWSERBASE_API_KEY; const projectId = process.env.BROWSERBASE_PROJECT_ID;`

**These can never execute.** The `import { bb } from "@/lib/browserbase"` at `research.ts:5` evaluates
first, and throws during module initialisation. The graceful-degradation design the team built is
defeated by the eager constructor.

**Consequence:** Browserbase becomes a *hard, undeclared build and runtime dependency* for the whole app,
including the ~13 pages that have nothing to do with browser automation.

**Fix** — convert to a lazy factory so the constructor only runs after the guard passes:

```ts
// lib/browserbase.ts
import Browserbase from "@browserbasehq/sdk";

let client: Browserbase | null = null;

export function getBrowserbase(): Browserbase {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  if (!apiKey) {
    throw new Error("BROWSERBASE_API_KEY is not set");
  }
  client ??= new Browserbase({ apiKey });
  return client;
}
```

Then in `agent/research.ts`, replace the top-level import and all `bb.` references with a local
`const bb = getBrowserbase()` placed **after** the `:280` guard. Also change `research.ts:5`'s
static import to a type-only import where possible so the module is not evaluated at build time.

**Verify:** `npm run build` must succeed with `BROWSERBASE_API_KEY` unset.

### 3.3 `lib/insforge-server.ts` has the same fragility

```ts
// lib/insforge-server.ts:4-8
export async function createInsforgeServer() {
  return createServerClient({ cookies: await cookies() });
}
```

No `baseUrl` / `anonKey` is passed. The SDK falls back to `process.env.NEXT_PUBLIC_INSFORGE_URL` and
`NEXT_PUBLIC_INSFORGE_ANON_KEY` and **throws** `"Missing InsForge baseUrl or anonKey…"` if either is absent
(`node_modules/@insforge/sdk/dist/ssr.mjs:2980-2988`).

The build survived this only because the four data pages are `force-dynamic` and were not prerendered.
Any future addition of a static page that imports `createInsforgeServer()` will break the build the same way.
`app/(auth)/callback/route.ts:29,45` has the identical bare-constructor pattern.

**Fix:** pass `baseUrl`/`anonKey` explicitly and fail with a clear message:

```ts
const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
if (!baseUrl || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_INSFORGE_URL or NEXT_PUBLIC_INSFORGE_ANON_KEY. " +
      "Create .env.local — see README.",
  );
}
return createServerClient({ baseUrl, anonKey, cookies: await cookies() });
```

### 3.4 `proxy.ts` has an unguarded throw

`proxy.ts:52-55` calls `updateSession()`, which calls `refreshAuth()` internally
(`ssr.mjs:3192` → `ssr.mjs:3074-3078`). That **throws** rather than returning an error object,
and `proxy.ts` does not catch it. With missing env vars this produces an unhandled rejection and a
**500 on every matched route** instead of a helpful error.

**Fix:** wrap `updateSession` in try/catch and fail open to a redirect:

```ts
let session;
try {
  session = await updateSession({ /* ... */ });
} catch (error) {
  console.error("[proxy] updateSession", error);
  return NextResponse.redirect(new URL("/login", request.url));
}
```

---

## 4. Blocker — Environment Configuration

### 4.1 No `.env.local` and no `.env` exist

The project **cannot run in its current state.** Only `.env.example` is present, and it ships with
every secret blank:

```env
NEXT_PUBLIC_INSFORGE_ANON_KEY=      # ← blank
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=   # ← blank
GEMINI_API_KEY=                      # ← blank
BROWSERBASE_API_KEY=                 # ← blank
BROWSERBASE_PROJECT_ID=              # ← blank
ADZUNA_APP_ID=                       # ← blank
ADZUNA_APP_KEY=                      # ← blank
```

**Create `.env.local`** (git-ignored) with all eight values. Full checklist in [§15](#15-fix-priority).

### 4.2 InsForge backend URL is contradictory — one source is wrong

| Source | URL |
|---|---|
| `AGENTS.md:185` | `https://2zu6ipjr.eu-central.insforge.app` |
| `.env.example:1` | `https://9zb7h4wq.us-east.insforge.app` |
| `README.md:120` | `https://9zb7h4wq.us-east.insforge.app` |

**The URL is not hardcoded in any source file** — verified with a repo-wide grep for
`9zb7h4wq`, `2zu6ipjr`, and `insforge.app` across `lib/`, `app/`, `actions/`, `agent/`.
This is purely a config-doc discrepancy, so it is safe to correct the docs.

`AGENTS.md` is the authoritative project record (`**Project:** **Jobbers** (API base
`https://2zu6ipjr.eu-central.insforge.app`)`), so `.env.example` and `README.md` should be updated to
`https://2zu6ipjr.eu-central.insforge.app`. **Verify against the live dashboard before applying** —
if the actual provisioned project is the `us-east` one, then `AGENTS.md` is the file to change instead.

### 4.3 `.gitignore` will not protect secrets — CRITICAL

`.gitignore:24-25` contains only:

```
# env files (can opt-in for committing if needed)
.env.local
```

But `README.md:117` instructs users:

> **Create a new file named `.env`** in the root of your project

**`.env` is not ignored.** Every real credential this project needs — `GEMINI_API_KEY`,
`ADZUNA_APP_KEY`, `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID`, and
`NEXT_PUBLIC_INSFORGE_ANON_KEY` — would be committed to git and pushed.

Currently safe (`git ls-files` shows only `.env.example` is tracked), but the next person who follows
the README leaks the entire backend.

**Fix — two options, apply both:**

```gitignore
# env files
.env
.env.local
.env.*.local
!.env.example
```

And change `README.md:117` from *"Create a new file named `.env`"* to
*"Create a new file named `.env.local`"* to match the gitignore.

Also note `.env.example:2` ships an **empty** `NEXT_PUBLIC_INSFORGE_ANON_KEY=`. Because the SDK throws
on empty rather than absent, a user who copies the file verbatim without editing it gets a hard throw
with a confusing error. Consider a placeholder value or an explicit comment.

### 4.4 PostHog host default contradicts the configured value

- `.env.example:5` and `README.md:123` → `https://eu.i.posthog.com`
- `lib/posthog-server.ts:67` → `?? "https://us.i.posthog.com"`
- `lib/posthog-client.ts:14` → same `us` default

The env var wins when set, so this is latent rather than active. Still, the fallbacks should be `eu`
to match the project's own config, and a GDPR-region mismatch would silently send EU user data to US
infrastructure.

---

## 5. Security Fixes

### 5.1 Logout is a `GET` — forced-logout CSRF

`app/api/auth/logout/route.ts:4`:

```ts
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const insforge = createServerClient({ cookies: request.cookies });
    await insforge.auth.signOut();
  } catch (error) {
    console.error("[auth/logout]", error);   // ← :12-13, error swallowed
  }
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearAuthCookies(response.cookies);
  return response;
}
```

**Two problems:**

1. **Any cross-origin page can log the user out** by embedding
   `<img src="https://app.example.com/api/auth/logout">` or a top-level navigation to it. No token,
   no confirmation, no SameSite protection helps because a top-level GET navigation sends the cookie.
2. **The `catch` at `:12` swallows the failure.** If `signOut()` throws server-side, the user is still
   redirected to `/login` with cookies cleared — a false success. The session may still be live.

The `GET` was chosen because `components/analytics/PostHogLogoutLink.tsx:16` uses a `<Link href>`.

**Fix:** convert to `POST` and render a real form/button.

```ts
// app/api/auth/logout/route.ts
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const insforge = createServerClient({ cookies: request.cookies });
    const { error } = await insforge.auth.signOut();
    if (error) console.error("[auth/logout] signOut", error);
  } catch (error) {
    console.error("[auth/logout]", error);
  }
  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  clearAuthCookies(response.cookies);
  return response;
}
```

```tsx
// components/analytics/PostHogLogoutLink.tsx
<form action="/api/auth/logout" method="POST">
  <button type="submit" onClick={/* posthog.reset() */}>Log out</button>
</form>
```

Use `303` so the browser follows with `GET` after the `POST`.

### 5.2 PostgREST filter injection in job search

`app/api/jobs/route.ts:33-35`:

```ts
query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
```

`search` is `searchParams.get("search")?.trim().toLowerCase()` (`:16`) — a raw user string interpolated
into a PostgREST `or=` filter with **no escaping**. PostgREST's filter grammar treats `,` as a logical
`or` separator and `)` as a group terminator, so `search=foo,deleted_at.not.is.null` injects an extra
filter term.

**Impact is bounded** — the `.eq("user_id", user.id)` at `:24` is ANDed at the top level and the
`jobs_select_own` RLS policy applies — but the input is unsanitised and malformed values cause a 500.

**Fix:** strip PostgREST metacharacters, and reject rather than 500 on empty results:

```ts
const search = (searchParams.get("search") ?? "")
  .replace(/[,()%*\\]/g, " ")   // strip PostgREST + ilike metacharacters
  .trim()
  .toLowerCase();
```

### 5.3 Server Actions have no runtime validation

`actions/profile.ts` is a `"use server"` module. Server actions are **directly callable over HTTP** —
TypeScript types are erased at runtime and provide no protection at the network boundary.

`actions/profile.ts:112-119` writes five fields straight into `text[]` columns
(`skills`, `industries`, `jobTitlesSeeking`, `preferredLocations`, plus `workEntries` JSON) with no
length, type, or element checks. `zod@4.4.3` is already a dependency — it is only used in
`agent/research.ts`.

**Fix:** define a `zod` schema mirroring `ProfileFormData` and `safeParse` at the top of
`uploadResume`, `saveProfile`, and the profile-update action. Reject oversized arrays
(e.g. `z.array(z.string().max(120)).max(50)`).

### 5.4 `app/find-jobs/[id]/page.tsx` — verify ownership scoping

The page calls `notFound()` at `:37`. Confirm the query is scoped with
`.eq("user_id", user.id)` and not only by `id`, so a user cannot enumerate other users' jobs by ID.
RLS should backstop this, but an explicit filter is defence in depth.

### 5.5 Adzuna credentials are sent as URL query parameters

`lib/adzuna.ts:21-28,35` — `app_id` and `app_key` are query-string parameters. This is the only option
in the Adzuna v1 API, so it cannot be changed, but the keys will land in any proxy/CDN access logs.
Note this as an accepted risk; prefer server-side calls only (which is already the case).

---

## 6. Correctness Bugs

### 6.1 `app/api/agent/find/route.ts:180` — crash on missing `location`

```ts
const { jobTitle, location } = body;      // :148 — typed string
if (!jobTitle?.trim()) { /* 400 */ }      // :149 — only jobTitle validated
...
location_searched: location.trim() || null,  // :180 — 💥 TypeError if undefined
location: location.trim(),                    // :203 — 💥
searchJobs(jobTitle.trim(), location.trim()),// :207 — 💥
```

A body of `{"jobTitle":"dev"}` makes `location` `undefined`; `.trim()` throws `TypeError`, caught by
the generic handler at `:309`, returning **500 "Internal server error"** instead of a 400.

The client (`components/find-jobs/FindJobsClient.tsx:76`) always sends `location`, so this is only
reachable by a direct API call — but that is exactly what an attacker or a stale client does.

**Fix:** validate both, or default:

```ts
const location = typeof body.location === "string" ? body.location.trim() : "";
```

### 6.2 `app/api/jobs/route.ts:19` — unvalidated `page` yields 500

```ts
const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
```

`Math.max(1, NaN)` is `NaN`. So `from = NaN`, `to = NaN`, and `.range(NaN, NaN)` writes
`offset=NaN&limit=NaN` into the PostgREST URL. PostgREST rejects it, and `:52-58` returns
**500 "Failed to fetch jobs"** for a client error.

Reachable by any authenticated user via `/api/jobs?page=abc`.

**Fix:**

```ts
const parsed = parseInt(searchParams.get("page") ?? "1", 10);
const page = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
```

### 6.3 `app/api/agent/find/route.ts:140` — unvalidated request body

`body = (await req.json()) as RequestBody` — a bare assertion. `zod` is available and unused here.
`app/api/agent/research/route.ts` does this correctly (UUID validation at `:38-42,66`) and should be
the model.

### 6.4 Inconsistent error envelopes

- `/api/jobs`, `/api/agent/*`, `/api/resume/generate` → `{ success, error }`
- `/api/resume/download` (`route.ts:10,22,32,49`) → bare `{ error }`

Standardise on one envelope across all API routes.

### 6.5 `proxy.ts` `next` param is write-only

`proxy.ts:59` sets `?next=<pathname>` on the login redirect, but `app/(auth)/login/page.tsx:9-12,21-22`
only reads `params.error`. **The `next` param is silently discarded.**

Consequence: a user deep-linking to `/find-jobs/abc` gets bounced to login, signs in, and lands on
`/dashboard` instead of the page they requested.

**Fix:** read `next` in the login page, validate it is a same-origin relative path (reject
protocol-relative `//evil.com` to avoid an open redirect), and pass it through
`getPostLoginRedirectPath()`.

### 6.6 `app/dashboard/page.tsx` is missing `force-dynamic`

`app/find-jobs/page.tsx:1`, `app/profile/page.tsx:1`, and `app/find-jobs/[id]/page.tsx:1` all declare
`export const dynamic = "force-dynamic"`. `app/dashboard/page.tsx` does **not**, despite performing
four DB queries with a per-request `requireUser()` at `:41`. It is currently served as `ƒ (Dynamic)`
per the build output, but the declaration should be explicit and consistent.

### 6.7 No `runtime` / `maxDuration` on the agent routes

`app/api/agent/find/route.ts` and `app/api/agent/research/route.ts` make blocking OpenAI calls
(`gpt-4o`, `max_tokens: 1200`) plus Browserbase/Stagehand browser sessions
(`agent/research.ts:296-323`, up to 3 navigations at 30s each, with `timeout: 120` on the session).

On any serverless host these will exceed the platform's default function timeout. Add explicit
segment config:

```ts
export const maxDuration = 300;
export const runtime = "nodejs";
```

`nodejs` is required — Stagehand/Playwright cannot run on the Edge runtime.

### 6.8 Unvalidated `matchScore` from the LLM

`app/api/agent/find/route.ts:17-23` defines `ScoredResult` with TypeScript types only, and `:92-125`
falls back to synthetic "Score unavailable" values on LLM failure. But a successful LLM response with
`matchScore: 150` is written straight to `jobs.match_score` (an `int` column) with no range check and
no DB `CHECK` constraint. Validate the parsed result with `zod` before insert.

### 6.9 `app/(auth)/callback/route.ts` — all failures look identical

Every failure path redirects to `/login?error=callback` — `:38`, `:53`, and `:71` (the internal `catch`).
A missing env var, a bad state parameter, and a genuine OAuth rejection are indistinguishable to the user
and in the logs. At minimum, log the real error server-side and pass a distinct code to the login page.

Also, the 3-line failure branch is duplicated three times (`:37-43`, `:51-58`, `:69-76`) — extract it.

### 6.10 `lib/browserbase.ts` unvalidated constructor (also `lib/adzuna.ts`)

- `lib/browserbase.ts:3-5` — see [§3.1](#31-libbrowserbasets-throws-at-import-time)
- `lib/adzuna.ts:22-23` — `process.env.ADZUNA_APP_ID!` / `ADZUNA_APP_KEY!`, both unguarded.
  Missing → `app_id=undefined` in the query string → Adzuna 400 → `throw new Error("Adzuna API error: 400")`
  at `:39` → 500 at `find/route.ts:309`. Add an explicit guard with a clear message.
- `actions/profile.ts` — the Gemini client factory. A missing key
  produces a raw SDK throw caught by the generic catch, surfacing to the user as
  *"Failed to extract profile from resume."* Only `agent/research.ts:581` guards properly.

---

## 7. Missing Infrastructure

### 7.1 The `resumes` storage bucket is never created

`migrations/20260603114724_create-storage-rls.sql` creates four RLS policies referencing
`bucket = 'resumes'`, but **no migration provisions the bucket**, and there is no `.insforge/project.json`
or installed `insforge` CLI in this environment.

Both `actions/profile.ts:176` and `app/api/resume/generate/route.tsx:121` will fail if the bucket
does not exist.

**Create it manually** via the InsForge dashboard or CLI, then document it in the README setup steps:

```bash
npx @insforge/cli create-bucket resumes --public=false
```

Add a `public/resumes` bootstrap note to `README.md` and to `.env.example` as a comment.

### 7.2 No `loading.tsx`, `error.tsx`, `global-error.tsx`, or `not-found.tsx`

All four are absent from `app/`. Consequences:

- **`app/find-jobs/[id]/page.tsx:37` calls `notFound()`** but there is no `app/not-found.tsx`, so users
  hit Next's unstyled built-in 404 — outside the design system.
- The four data pages (`/dashboard`, `/profile`, `/find-jobs`, `/find-jobs/[id]`) are all `force-dynamic`
  with multiple awaited DB queries and **no Suspense boundary**. A slow InsForge query blocks the entire
  page with zero feedback.
- No error boundary anywhere: a throw from `createInsforgeServer()` or any query produces the raw
  Next.js error page.

**Add:**

| File | Purpose |
|---|---|
| `app/not-found.tsx` | Branded 404 using existing `ui-registry.md` patterns |
| `app/error.tsx` | `"use client"` error boundary with retry |
| `app/global-error.tsx` | Catches root-layout failures |
| `app/dashboard/loading.tsx` | Skeleton matching `StatsBar` + `AnalyticsCharts` |
| `app/profile/loading.tsx` | Skeleton matching `ProfileForm` |
| `app/find-jobs/loading.tsx` | Skeleton matching `JobsTable` |

Use the documented `--color-surface-muted` / `--color-border` tokens so the skeletons match
`context/designs/*.png`.

### 7.3 No test infrastructure

No test runner, no `test` script in `package.json`, no test files. `package.json:5-8` has only
`dev`, `build`, `start`, `lint`. At minimum, the pure functions in `lib/profile-utils.ts` (9 checks)
and `lib/utils.ts` are trivially testable and currently unverified.

### 7.4 No `serverExternalPackages` for `@react-pdf/renderer`

`next.config.ts:3` is an empty object. `@react-pdf/renderer` is not in Next's default external list, so
it is webpack-bundled. It works today, but is a known build-fragility point as `pdfkit` pulls in native-ish
deps. Consider:

```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer", "pdf-parse"],
};
```

---

## 8. Deprecated & Stale Documentation

### 8.1 `AGENTS.md` Tailwind 3.4 rule is actively harmful — HIGH

`AGENTS.md` (INSForge block) states:

> **EXTRA IMPORTANT**: Use Tailwind CSS 3.4 (do not upgrade to v4). Lock these dependencies in `package.json`

**Reality:** `tailwindcss@4.3.0` and `@tailwindcss/postcss@4.3.0` are installed and correctly configured:

- `postcss.config.mjs:3` — `@tailwindcss/postcss` plugin (v4-only; v3.4 used `tailwindcss` + `autoprefixer`)
- `app/globals.css:1` — `@import "tailwindcss";` (v4 directive)
- `app/globals.css:3-70` — `@theme { --color-*, --radius-*, --shadow-* }` (v4 CSS-first tokens)
- **No `tailwind.config.ts` / `.js` exists** — correct for v4, and matches `ui-rules.md:193`

Confirmed at runtime by v4-only utilities that resolve in the built CSS:
`h-55` (`AnalyticsCharts.tsx:26,76,142`) and `max-w-360` (`app/dashboard/page.tsx:184`) →
`height: calc(var(--spacing) * 55)` and `max-width: calc(var(--spacing) * 360)`
in `.next/dev/.../app_globals_css_*.css:622,742`. **Neither exists in v3.4.**

`context/ui-tokens.md:9` and `context/ui-rules.md:184-186` both correctly say **Tailwind v4**.

**Fix: delete the v3.4 lock instruction from `AGENTS.md`.** `context/` is right; `AGENTS.md` is the
stale document. Following it would trigger an unnecessary downgrade that breaks the entire token system.

### 8.2 `context/` documents a non-existent InsForge SDK API

`context/architecture.md:308-334` and `context/library-docs.md:40-64` both show:

```ts
import { createBrowserClient } from "@insforge/ssr";
const client = createBrowserClient(url, anonKey);   // positional args
```

**This is wrong on both counts:**

- The installed export is `@insforge/sdk/ssr` (`node_modules/@insforge/sdk/package.json` → `"./ssr"`),
  not `@insforge/ssr`.
- `createBrowserClient` takes a **single options object**
  (`node_modules/@insforge/sdk/dist/ssr.d.ts:57-67`), not positional arguments.

Anyone following these docs writes code that does not compile.

**Fix:** update both files to the real signature, and note that the browser client is optional —
this project only ever uses `createServerClient`.

### 8.3 `context/architecture.md` file tree is largely fiction

Files listed in the architecture doc that **do not exist on disk**:

`agent/adzuna.ts` · `agent/matcher.ts` · `agent/extractor.ts` · `agent/types.ts` ·
`actions/jobs.ts` · `lib/stagehand.ts` · `components/ui/` ·
`components/profile/ResumeUpload.tsx` · `components/profile/ResumePreview.tsx` ·
`components/profile/CompletionIndicator.tsx` · `app/api/resume/extract/route.ts` ·
`app/(auth)/callback/page.tsx` (it is `route.ts`) · `app/api/resume/generate/route.ts` (it is `route.tsx`)

Conversely, `proxy.ts`, `lib/adzuna.ts`, `lib/browserbase.ts`, `instrumentation-client.ts`, and
`app/api/jobs/route.ts` all exist but are undocumented.

### 8.4 `progress-tracker.md` is stale

- `:47` — `- [ ] 17 Analytics Charts — PostHog Data` is the only unchecked box, but the charts
  **do exist and are wired up** (`AnalyticsCharts.tsx:20,70,136`, mounted at `app/dashboard/page.tsx`).
  The tracker understates completion. Its stated premise is also wrong — see [§11](#11-analytics-contract-mismatch).
- `:56` — *"Primary homepage CTAs currently point to `/login` until auth flow is implemented in Feature 02"*.
  Auth **is** implemented. `Hero.tsx:21,28` and `CTASection.tsx:17,24` still hardcode `/login`.
  Fix the CTAs to be auth-aware, or update this line.
- `:63` — *"Authenticated placeholder pages call `posthog.identify()`"*. The pages are no longer placeholders.
- `:75` — *"8 pre-existing lint warnings"*. Actual count is **4**.

### 8.5 `code-standards.md` is stale

- `:232` — *"These four events are the only events"*. `lib/posthog-server.ts:3-61` defines an **8-event**
  union: `job_search_started`, `job_found`, `job_url_submitted`, `cover_letter_generated`,
  `resume_tailored`, `profile_completed`, `company_researched`, `linkedin_connected`.
- `:246-247` — attributes `NEXT_PUBLIC_INSFORGE_*` to `lib/insforge-client.ts`, the file that is
  **never used**. They are actually consumed by `lib/insforge-server.ts` and the SDK's internal fallback.
- `:248` — attributes `BROWSERBASE_PROJECT_ID` to `lib/browserbase.ts`, which never references it
  (it is read at `agent/research.ts:281`).
- `:296-321` — the approved-dependency list omits `recharts`, `playwright-core`, `zod`, `next`, `react`.
- `:59` — *"API route files: always `route.ts`"*, but `app/api/resume/generate/route.tsx` is `.tsx`.
  Technically valid (Next matches on `/route` after extension stripping — confirmed in
  `node_modules/next/dist/lib/is-app-route-route.js` and the generated
  `.next/dev/types/routes.d.ts:5`), but inconsistent with the stated rule. Either rename to `.ts` and
  move the JSX into `ResumePDF.tsx`, or relax the rule.

### 8.6 `context/ui-registry.md` contradicts itself and the code

- `:141-157` and `:245-263` document **`ConnectedAccounts` twice with contradictory specs** — one says
  `p-6` / `rounded-2xl` cards, the other says a `border border-border` outer container. Only one can be true.
- `:460` documents the `StatsBar` trend badge as `rounded-sm bg-success-lightest … text-success-darker`.
  **`StatsBar.tsx:40-43` renders no badge at all** — just a bare `TrendingUp` icon + `trendLabel` text.
- `:332-338` documents the Logo as a **36×36 gradient tile with 10px radius**. `Logo.tsx:12-19` renders
  `<Image src="/logo.png" width={112} height={38}>` at `h-9 w-auto`. Completely different.

### 8.7 `proxy.ts` deep-imports Next.js internals — fragile

`proxy.ts:2-3`:
```ts
import type { ResponseCookies } from "next/dist/server/web/spec-extension/cookies";
import type { RequestCookies } from "next/dist/server/web/spec-extension/cookies";
```

The path exists in 16.2.7 and re-exports from `@edge-runtime/cookies`, so it compiles — but it is an
unsupported internal path with no stability guarantee. The Supabase convention (which this code follows)
is to type these loosely and rely on structural compatibility:

```ts
import type { RequestCookies } from "next/dist/server/web/spec-extension/cookies";
```

is required for the `CookieStore` adapter, so this is a known trade-off — but add a comment noting
it must be re-checked on every Next.js upgrade. Add a CI step that greps for
`next/dist/` imports so an upgrade failure is caught immediately.

### 8.8 Minor

- `components/layout/Footer.tsx:7-8` — "Privacy Policy" and "Terms & Condition" both `href="#"`.
  Dead links in a production footer.
- `app/globals.css:4` sets `--font-sans` in `@theme` while `app/layout.tsx:5-8` sets next/font's
  `--font-sans` on `<html>`. Both emit to the same scope; the next/font class wins. `ui-rules.md:16`
  claims the variable is "already declared in `@theme`", which is technically true but redundant.
  Pick one source of truth.
- `app/api/resume/download/route.ts:6` — the `request` parameter is never used (lint warning).
- `actions/profile.ts:207` — exports a `type` from a `"use server"` module. Valid (types are erased,
  and both consumers use `import type`), but it is the file's only non-function export.
- `actions/profile.ts:9-11` — `require("pdf-parse/lib/pdf-parse.js")` deep-imports into a package's
  internal `lib/`. Documented with an eslint-disable, but fragile across `pdf-parse` releases.
- `context/ui-rules.md:22` mandates 1440px max-width; implemented three different ways —
  `max-w-[1440px]`, `max-w-360` (`app/dashboard/page.tsx:184`), and `max-w-[820px]`
  (`app/find-jobs/[id]/page.tsx:47`).

---

## 9. Dead Code

| Item | Evidence | Action |
|---|---|---|
| **`components/profile/ConnectedAccounts.tsx`** | **Zero importers.** Calls `POST /api/linkedin/connect` (`:25`) and `POST /api/linkedin/save-context` (`:43`) — **neither route exists** (`app/api/` contains only `agent/{find,research}`, `auth/{logout,oauth/[provider],refresh}`, `jobs`, `resume/{download,generate}`). Ships a hardcoded brand hex `#0A66C2` at `:86`. | **Delete** the file, its `ui-registry.md` entries (`:141-157`, `:245-263`), and its `progress-tracker.md:80` mention. |
| **`lib/insforge-client.ts`** | Exports a browser client. **Zero importers** anywhere. Its `"use client"` at `:1` is also pointless. Its `/api/auth/refresh` target exists but is only reachable from this dead module. | **Delete**, or keep and add a comment explaining the intended client-side use. |
| `lib/utils.ts:15` `formatSalary` | Exported, **zero call sites**. | Delete, or wire into the jobs table. |
| `.posthog-events.json` | All 8 declared events unimplemented. | See [§11](#11-analytics-contract-mismatch). |
| `public/thumbnails/*` (12 MB, ~13 files) | **Zero references.** | Delete. |
| `public/readme/*` (1.5 MB, 6 files) | **Zero references** in app code. | Keep only if used by a GitHub README outside this repo; otherwise delete. |
| `public/images/*.webp` (8 untracked files) | Zero references; also untracked in git. | Delete or commit deliberately. |
| **~11 of ~50 design tokens** | `--color-border-muted`, `--color-chart-axis`, `--color-error-foreground`, `--color-info-dark`, `--color-success-dark`, `--color-surface-muted`, `--color-text-black`, `--color-text-darker`, `--color-text-darkest`, `--color-text-slate-medium`, `--color-accent-dark` — declared, never referenced. | Either use them or prune. `--color-chart-axis` is the notable one — it exists *specifically* to fix [§10](#10-design-token-violations). |
| `profiles.linkedin_context_id`, `profiles.linkedin_connected` | In DDL (`20260603114532:23-24`) and `types/index.ts:34-35`. **Never read or written.** | Drop from the schema and types if LinkedIn is out of scope. |
| `jobs` columns: `responsibilities`, `requirements`, `nice_to_have`, `benefits`, `about_company`, `cover_letter`, `tailored_resume_url`, `tailored_match_score`, `is_tailored` | Created, typed (`types/index.ts:81-93`), and **read for display** at `app/find-jobs/[id]/page.tsx:57-60` — but **never populated** by `find/route.ts:240-260`. Render as empty. | Either populate them from the LLM extraction, or stop rendering them. |
| `Job.source: "url"` | `types/index.ts:72` declares it; only `"search"` is ever written. | Narrow the union or implement manual job URL submission. |
| `insforge_pkce_verifier` in sessionStorage | The SDK's own `signInWithOAuth` stashes it (`ssr.mjs:852-855`), but the server-side flow bypasses that, leaving an orphan entry. | Clear it in the callback route, or ignore. |

---

## 10. Design Token Violations

The token system is **substantially adopted** — zero raw Tailwind palette classes across `app/` and
`components/`, which is a genuine achievement. The violations are narrow and specific.

### 10.1 `AnalyticsCharts.tsx:18` — hex that has a token waiting for it

```ts
const AXIS_STYLE = { fill: "#9CA3AF", fontSize: 12 };
```

`--color-chart-axis: #9ca3af` is already defined at `app/globals.css:25` and **referenced nowhere**.
This is the exact case the token was created for.

**Fix:** `const AXIS_STYLE = { fill: "var(--color-chart-axis)", fontSize: 12 };`

### 10.2 `ConnectedAccounts.tsx:86` — moot if the file is deleted

```tsx
<rect width="20" height="20" rx="4" fill="#0A66C2" />
```

`--color-linkedin: #0a66c2` exists at `app/globals.css:56`. Also `fill="white"` at `:89,93`
should be `var(--color-surface)`. Resolved by deleting the file ([§9](#9-dead-code)).

### 10.3 `rgba()` shadow drift — 3 sites, byte-identical to an existing token

```
components/find-jobs/JobsTable.tsx:47
components/find-jobs/JobsTable.tsx:59
components/find-jobs/SearchControls.tsx:23
```

All three inline:
```
shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]
```

This is **byte-identical** to the `--shadow-card` token at `app/globals.css:69`, which 17 other
call sites already use via `shadow-card`. Pure drift.

**Fix:** replace all three with `shadow-card`.

### 10.4 `fill="white"` in inline SVG

`components/profile/ProfileAttentionBanner.tsx:31,32` (2×) and `ConnectedAccounts.tsx:89,93` (2×).
Use `var(--color-surface)`.

### 10.5 Documented as accepted — `@react-pdf/renderer` hex values

`app/api/resume/generate/ResumePDF.tsx:28,33,37,42,48,55,60,71,75,82,90,94` — 12 hex values
(`#1a1a1a`, `#111111`, `#444444`, `#666666`, `#333333`, `#555555`).

**This is defensible and should be left alone.** `StyleSheet.create()` requires literal color strings;
CSS custom properties are not supported inside `@react-pdf/renderer`. This is not a UI-layer violation
— the PDF is a separate rendering target. Add a comment at the top of the file recording this exemption
so future audits do not re-flag it.

### 10.6 Inline styles — 6 undocumented sites

`code-standards.md:97` says "No inline styles". Found at:

| Site | Registry status |
|---|---|
| `components/dashboard/RecentActivity.tsx:19,23,31,35` | Partially excused by `ui-registry.md:486` |
| `components/find-jobs/JobsTable.tsx:21` | Undocumented |
| `components/profile/ProfileAttentionBanner.tsx:56` | Undocumented |

Either extract to tokens or add registry entries documenting why each is dynamic.

### 10.7 `Navbar.tsx` is `"use client"` unnecessarily

`components/layout/Navbar.tsx:1` needs `"use client"` for `usePathname` (documented at
`ui-registry.md:80`), but this pushes the entire header + `Logo` into the client bundle on all 6 pages.
Since the active-route state is already known at request time, consider passing the path as a prop from
each server page, or using CSS-only active states, and dropping the client boundary.

Similarly, `"use client"` appears in `lib/posthog-client.ts:1` and `lib/insforge-client.ts:1` —
directives belong in components, not `lib/`.

### 10.8 Minor

- `code-standards.md:61` "one component per file" is violated by
  `components/dashboard/AnalyticsCharts.tsx` (3 exports), `components/job-details/CompanyResearch.tsx`
  (4 internal), `components/profile/ProfileForm.tsx` (6 internal).
- `code-standards.md:24-25` "no type assertions unless commented" — double assertions exist at
  `app/api/resume/generate/route.tsx:20` and `:125` (both commented, fine),
  `actions/profile.ts:300` (commented, fine), but
  `app/find-jobs/page.tsx:21` and `app/api/agent/find/route.ts:273` are **uncommented**.
- `components/profile/ResumeSection.tsx:105` — `const showExistingLink = existingResumeUrl && !fileName;`
  is typed `string | null | boolean`. Used only as a JSX condition, but should be an explicit `boolean`.
- `code-standards.md:37-44` prefers `"use client"` only in leaf components. `lib/insforge-client.ts` and
  `lib/posthog-client.ts` violate this.

---

## 11. Analytics Contract Mismatch

**The PostHog event contract is fictional in both directions.** Three sources, zero overlap.

### Source A — `.posthog-events.json` (8 events, 0 implemented)

```
get_started_clicked          cta_get_started_clicked
find_first_match_clicked     cta_find_first_match_clicked
sign_in_provider_clicked     user_signed_in
user_sign_in_failed          user_signed_out
```

Grepped `app/`, `components/`, `lib/`, `actions/`, `agent/` — **zero matches for any of these.**

### Source B — `lib/posthog-server.ts:3-61` (8 events, 4 implemented)

| Event | Fired? | Where |
|---|---|---|
| `job_search_started` | ✅ | `find/route.ts:198` |
| `job_found` | ✅ | `find/route.ts:275-284` (per job) |
| `company_researched` | ✅ | `research/route.ts` |
| `profile_completed` | ✅ | `actions/profile.ts` |
| `job_url_submitted` | ❌ | — |
| `cover_letter_generated` | ❌ | — |
| `resume_tailored` | ❌ | — |
| `linkedin_connected` | ❌ | dead LinkedIn feature |

### Source C — `code-standards.md:232` claims 4 events. Actual is 8.

### 11.1 Missing logout / auth analytics

`app/api/auth/logout/route.ts` fires **no** event, despite `.posthog-events.json:37-41` declaring
`user_signed_out` for exactly that. Same for `sign_in_provider_clicked`, `user_signed_in`, and
`user_sign_in_failed` — the OAuth route and callback emit nothing.

### 11.2 Dashboard charts do not use PostHog at all

`context/build-plan.md:434-446` requires querying **PostHog** for `job_found` and `company_researched`.
The implementation instead queries **InsForge Postgres** (`app/dashboard/page.tsx:50-76`) and derives all
three chart datasets server-side at `:123-163`. No PostHog query API is used anywhere in the app.

**This was a deliberate and better decision** — Postgres is the source of truth, and it avoids a
runtime dependency on a third-party API for core dashboard rendering. But `build-plan.md` was never
updated, and `progress-tracker.md:47` still frames item 17 as incomplete on the basis of the abandoned
approach.

**Action:** update `build-plan.md:434-446` and `progress-tracker.md:47` to describe the Postgres
implementation, and mark item 17 done.

### 11.3 Missing per-chart empty states

`AnalyticsCharts.tsx` has no `length === 0` branch — all three charts render empty axes with no message.
`RecentActivity.tsx:47` correctly implements one. Add the same to each chart component.

### 11.4 `posthog.identify()` has no guard

`PostHogIdentify.tsx` is mounted on 4 pages (`app/profile/page.tsx:36`, `app/dashboard/page.tsx:182`,
`app/find-jobs/page.tsx:26`, `app/find-jobs/[id]/page.tsx:45`). Repeated `identify()` calls are safe in
posthog-js, so this is not a bug — but a `hasIdentified` ref guard avoids redundant network calls.

`lib/posthog-client.ts:33` — `posthog.identify(userId, { userId })` — the `userId` property is
redundant with `distinctId`. Remove it.

---

## 12. Schema Gaps

**Good news: zero schema drift.** Every column referenced by app code exists in the migrations, and
`types/index.ts` (118 lines, 5 interfaces) matches the DDL column-for-column. Specifically verified:
all 21 columns written at `actions/profile.ts:102-122`; `resume_pdf_url` (3 sites);
`company_research` (`20260605000000:1` + 4 read sites); all 19 fields in the jobs insert at
`find/route.ts:240-260`; all 7 `agent_runs` fields; all 6 `agent_logs` fields.

### 12.1 No `CHECK` constraints on enum-like or range columns

- `agent_runs.status` — text, no constraint. Values used: `"running"`, `"completed"`.
- `agent_logs.level` — text, no constraint. Values used: `"info"`, `"warning"`, `"error"`.
- `jobs.match_score` — `int`, no range check, despite `types/index.ts:86` asserting 0-100. An LLM
  returning `matchScore: 150` is written unvalidated (see [§6.8](#68-unvalidated-matchscore-from-the-llm)).

Add:
```sql
ALTER TABLE jobs ADD CONSTRAINT match_score_range CHECK (match_score BETWEEN 0 AND 100);
ALTER TABLE agent_runs ADD CONSTRAINT status_enum CHECK (status IN ('running','completed','failed'));
ALTER TABLE agent_logs ADD CONSTRAINT level_enum CHECK (level IN ('info','warning','error'));
```

### 12.2 `agent_logs.run_id` FK is never exercised

`app/api/agent/research/route.ts:81` writes `run_id: null`, so the `agent_logs` → `agent_runs` foreign
key relationship is never actually used. Either populate it or drop the column.

### 12.3 Log writes are fire-and-forget

`research/route.ts:79-92` — `agent_logs` inserts are only `console.error`'d on failure. Acceptable for
non-critical logging, but note that log rows can be silently lost.

### 12.4 `profiles` bootstrap is untested

`20260603114532:63-74` creates `handle_new_user()` as an `AFTER INSERT ON auth.users` trigger. Since
InsForge creates auth users for OAuth logins, this should fire — but `actions/profile.ts:100-125` only
does an `UPDATE` and hard-errors at `:134` with *"Profile not found. Please sign out and sign in again."*
if no row matched. **Verify this trigger works for the OAuth path** on a fresh account; if it does not,
every new OAuth user is locked out of the profile flow.

### 12.5 RLS is correct

All four tables have RLS enabled with consistent 4-policy blocks (select/insert/update/delete scoped to
`auth.uid() = user_id`, or `= id` for `profiles`). Storage policies correctly scope to the first path
segment `= auth.uid()`. No missing policies, no gaps. The SDK is a plain PostgREST passthrough
(`ssr.mjs:1380-1464`) that sends the JWT as `Authorization: Bearer`, so `auth.uid()` policies apply as written.

---

## 13. Resource & Performance

### 13.1 Browserbase sessions are never explicitly closed — leak

`agent/research.ts:296` creates a session with `timeout: 120`. The `finally` block at `:410-418` calls
`stagehand.close()` but **never calls `bb.sessions.update(...)` or `bb.sessions.delete(...)`**. Every
research request leaks a remote browser session that must run until the 120s timeout.

Under any real usage this will exhaust the Browserbase concurrency quota.

**Fix:** capture the session id and explicitly end it in the `finally`:

```ts
let sessionId: string | null = null;
try {
  const session = await bb.sessions.create({ projectId, timeout: 120 });
  sessionId = session.id;
  // ...
} finally {
  if (stagehand) { try { await stagehand.close(); } catch { /* log */ } }
  if (sessionId) {
    try { await bb.sessions.update(sessionId, { status: "REQUEST_RELEASE" }); } catch { /* log */ }
  }
}
```

### 13.2 PostHog client is constructed and shut down per event

`lib/posthog-server.ts:83,98` — `createPostHogServer()` builds a new `PostHog` client and
`await posthog.shutdown()` runs in `finally` on **every single event**.

`find/route.ts:275-284` does this **inside a loop, once per saved job** — a 10-job result means 10
construct/flush/shutdown cycles.

`flushAt: 1, flushInterval: 0` (`:75-76`) mitigates the batching cost, but the client lifecycle churn
remains.

**Fix:** use a module-level singleton with a shared `flushAt`, or accumulate events and flush once at
the end of the route handler.

### 13.3 Unvalidated URL passed to a real browser

`agent/research.ts:135-141` `fallbackHomepageUrl` constructs `https://www.{cleanedCompanyName}.com` by
string manipulation and hands it to `page.goto()` at `:320` whenever redirect resolution fails. The
company name originates from the Adzuna response, so it is externally influenceable.

SSRF impact is limited because the navigation happens inside a hosted Browserbase browser, not the app
server — but it is still an arbitrary third-party navigation driven by attacker-influenceable input.
Validate the hostname against an allow-list of suffixes, or skip the fallback entirely.

### 13.4 `resolveHomepageUrl` fans out aggressively

`agent/research.ts:210-214` issues up to 5 `bb.fetchAPI.create` calls per research request. Serial
rather than parallel — this is on the critical path of a request that already has a 120s browser
session. Consider `Promise.any` for parallel resolution with a cap.

### 13.5 Hardcoded Adzuna parameters

`lib/adzuna.ts:19` — `country = "us"` and `:25` — `category: "it-jobs"`, both hardcoded with no env
override. All job search is restricted to US IT jobs with no way to change per-user or per-deployment.
`:26` — `results_per_page: "10"` with no pagination despite the signature accepting `country`.

### 13.6 No `fetch` timeout on the Adzuna call

`lib/adzuna.ts:34` issues `fetch` with no `signal` or timeout. A hung Adzuna endpoint blocks the request
indefinitely. Add `AbortSignal.timeout(10_000)`.

### 13.7 `revalidatePath()` after a long external operation

`app/api/agent/research/route.ts:192` calls `revalidatePath()` following a request that may have taken
120+ seconds. Correct placement, but worth noting the interaction with [§6.7](#67-no-runtime--maxduration-on-the-agent-routes).

---

## 14. What Works Well

Genuine strengths worth preserving:

- **TypeScript is completely clean.** `npx tsc --noEmit` exits 0.
- **ESLint: 0 errors**, only 4 unused-variable warnings.
- **Zero `any` types** in the entire codebase. The only occurrence of "any" is inside an English
  prompt string at `agent/research.ts:327`.
- **Zero `console.log`.** 39 `console.error` calls, all with `[path/function]` prefixes per
  `code-standards.md:214`.
- **Zero raw Tailwind palette classes.** A word-bounded regex across `app/` and `components/` returns
  nothing. The token system is genuinely adopted, not aspirational.
- **Zero schema drift.** Migrations, `types/index.ts`, and query code are perfectly in sync.
- **Sound component architecture.** All 6 pages are correctly Server Components. `"use client"` is on
  exactly the 13 components that need it. No hooks or event handlers leak into server components.
- **Clean server/client separation for PDF.** `@react-pdf/renderer` is imported only by
  `app/api/resume/generate/route.tsx:5` and `ResumePDF.tsx:2`. The client component `ResumeSection.tsx`
  reaches it exclusively via `fetch("/api/resume/generate")` at `:48` and
  `window.open("/api/resume/download")` at `:52`. No Node-only APIs leak into any client bundle.
- **Zero hardcoded secrets.** A repo-wide scan for `sk-`, `phx_`, `phc_`, `eyJ`, and inline
  `api_key=` patterns returns nothing. Everything reads from `process.env`.
- **PostHog init is correctly placed** in `instrumentation-client.ts` (runs pre-hydration, once, with
  the `try/catch` the Next.js docs recommend). No double-initialization — posthog-js 1.379 self-guards
  with `if (this.__loaded) return`.
- **OAuth provider allow-list** at `oauth/[provider]/route.ts:4,23`, and the PKCE verifier cookie
  round-trip is consistent between `:5,45-51` and `callback/route.ts:8,35,40`.
- **`requireUser()` is correctly called outside `try` blocks** in all three `actions/profile.ts`
  functions (`:57`, `:157`, `:228`), so `NEXT_REDIRECT` isn't swallowed by a generic catch. This is a
  subtle correctness detail that is easy to get wrong.
- **LLM output is validated before the DB write.** `agent/research.ts:529-535` assigns `JSON.parse`
  to `unknown` then `safeParse`s it, falling back cleanly on failure. Good hygiene.
- **Postgres is a sound source of truth for the dashboard** — better than the PostHog-query approach the
  build plan originally specified.
- **Recent bug fixes are correct and well-reasoned:** `ff82f9c` (prefetch on logout link) and
  `a518420` (middleware → proxy migration) both show the team understood the failure mode.

---

## 15. Fix Priority

### P0 — Blocks the project from running

| # | Fix | File | Effort |
|---|---|---|---|
| 1 | **Create `.env.local`** with all 8 values. Verify the correct InsForge URL ([§4.2](#42-insforge-backend-url-is-contradictory--one-source-is-wrong)). | — | 5 min |
| 2 | **Add `.env` to `.gitignore`**; change README to say `.env.local`. **Prevents credential leak.** | `.gitignore:24`, `README.md:117` | 2 min |
| 3 | **Lazy-init Browserbase** so the build works without the key and the existing guards become reachable. | `lib/browserbase.ts` | 15 min |
| 4 | **Create the `resumes` storage bucket** out-of-band; document it. | README setup | 5 min |

### P1 — Security & correctness

| # | Fix | File |
|---|---|---|
| 5 | Logout `GET` → `POST`, stop swallowing the error | `app/api/auth/logout/route.ts:4` |
| 6 | Validate `location` (currently 500s) | `app/api/agent/find/route.ts:148-180` |
| 7 | Validate `page` (currently 500s) | `app/api/jobs/route.ts:19` |
| 8 | Escape PostgREST metacharacters in `search` | `app/api/jobs/route.ts:33-35` |
| 9 | Add `zod` validation to the three server actions | `actions/profile.ts` |
| 10 | Guard `proxy.ts` against `updateSession()` throwing | `proxy.ts:52-55` |
| 11 | Pass `baseUrl`/`anonKey` explicitly with a clear error | `lib/insforge-server.ts:4-8` |
| 12 | Verify `handle_new_user()` fires on the OAuth path | `migrations/20260603114532:63` |

### P2 — Missing UX states

| # | Fix | Files |
|---|---|---|
| 13 | Add `app/not-found.tsx` (currently raw Next 404) | new |
| 14 | Add `app/error.tsx` + `app/global-error.tsx` | new |
| 15 | Add `loading.tsx` skeletons for the 4 data pages | 4 new files |
| 16 | Honor the `next` param on login (currently write-only) | `app/(auth)/login/page.tsx:9-12` |
| 17 | Add `maxDuration`/`runtime` to the agent routes | `app/api/agent/{find,research}/route.ts` |

### P3 — Documentation correctness

| # | Fix | File |
|---|---|---|
| 18 | **Delete the Tailwind 3.4 rule** — it contradicts reality and is actively harmful | `AGENTS.md` |
| 19 | **Fix the InsForge URL** in docs (verify which is correct) | `.env.example:1`, `README.md:120` |
| 20 | Fix the `@insforge/ssr` API examples (wrong package, wrong signature) | `context/architecture.md:308`, `context/library-docs.md:40` |
| 21 | Mark dashboard charts done; document the Postgres approach | `context/build-plan.md:434`, `context/progress-tracker.md:47` |
| 22 | Reconcile the PostHog event contract across all 3 sources | `.posthog-events.json`, `lib/posthog-server.ts`, `code-standards.md:232` |
| 23 | Fix stale claims: CTAs, placeholder pages, lint count, event count, env attribution | `progress-tracker.md:56,63,75`, `code-standards.md:232,246,248` |
| 24 | Reconcile `ui-registry.md` self-contradictions and `StatsBar`/`Logo` drift | `context/ui-registry.md:141,245,332,460` |
| 25 | Update the architecture file tree to match reality | `context/architecture.md` |

### P4 — Cleanup

| # | Fix | File |
|---|---|---|
| 26 | Delete `ConnectedAccounts.tsx` (orphan, calls non-existent routes) | `components/profile/` |
| 27 | Delete `lib/insforge-client.ts` (zero importers) | `lib/` |
| 28 | Delete `formatSalary` (zero call sites) | `lib/utils.ts:15` |
| 29 | Delete ~13.5 MB of unused images | `public/thumbnails/`, `public/readme/` |
| 30 | Fix `shadow-[0px_1px_3px_rgba(...)]` → `shadow-card` (3 sites) | `JobsTable.tsx:47,59`, `SearchControls.tsx:23` |
| 31 | Use `var(--color-chart-axis)` | `AnalyticsCharts.tsx:18` |
| 32 | Fix footer dead links (`href="#"`) | `components/layout/Footer.tsx:7-8` |
| 33 | Add `serverExternalPackages` for `@react-pdf/renderer` | `next.config.ts` |

### P5 — Deeper improvements

| # | Fix | File |
|---|---|---|
| 34 | Close Browserbase sessions explicitly (leak) | `agent/research.ts:296,410-418` |
| 35 | PostHog client singleton instead of per-event construct/shutdown | `lib/posthog-server.ts:83,98` |
| 36 | Add `CHECK` constraints to `match_score`, `status`, `level` | new migration |
| 37 | Implement or remove the 9 unpopulated `jobs` columns | `find/route.ts:240-260` |
| 38 | Drop `linkedin_*` columns or implement the feature | `20260603114532:23-24` |
| 39 | Validate `matchScore` range before insert | `find/route.ts:92-125` |
| 40 | Add `fetch` timeout to Adzuna | `lib/adzuna.ts:34` |
| 41 | Add test infrastructure (start with `lib/profile-utils.ts`) | `package.json` |
| 42 | Prune or adopt the ~11 unused design tokens | `app/globals.css` |

---

## 16. Appendix — Full File Reference

### Application routes (from `next build`)

```
○ /                    (Static)
○ /_not-found          (Static)
ƒ /api/agent/find
ƒ /api/agent/research
ƒ /api/auth/logout
ƒ /api/auth/oauth/[provider]
ƒ /api/auth/refresh
ƒ /api/jobs
ƒ /api/resume/download
ƒ /api/resume/generate
ƒ /callback
ƒ /dashboard
ƒ /find-jobs
ƒ /find-jobs/[id]
ƒ /login
ƒ /profile

ƒ Proxy (Middleware)
```

### Source files by area (74 total)

**Config (7):** `package.json` · `next.config.ts` · `tsconfig.json` · `postcss.config.mjs` ·
`eslint.config.mjs` · `instrumentation-client.ts` · `proxy.ts`

**Lib (8):** `adzuna.ts` · `auth.ts` · `browserbase.ts` · `insforge-client.ts`† ·
`insforge-server.ts` · `posthog-client.ts` · `posthog-server.ts` · `profile-utils.ts` · `utils.ts`

**Actions / agent (2):** `actions/profile.ts` · `agent/research.ts`

**App (21):** `layout.tsx` · `globals.css` · `page.tsx` · `dashboard/page.tsx` · `profile/page.tsx` ·
`find-jobs/page.tsx` · `find-jobs/[id]/page.tsx` · `(auth)/login/page.tsx` · `(auth)/callback/route.ts` ·
7 route handlers · `ResumePDF.tsx`

**Components (26):** analytics (2) · auth (1) · dashboard (3) · find-jobs (5) · homepage (5) ·
job-details (5) · layout (3) · profile (5) — *including `ConnectedAccounts.tsx`†*

† = dead code

**Docs (9):** `AGENTS.md` · `CLAUDE.md` · `README.md` · `memory.md` · `context/*.md` (8 files)

**Migrations (6):** `20260603114532` · `20260603114534` · `20260603114535` · `20260603114536` ·
`20260603114724` · `20260605000000`

### Lint warnings (4, all real)

```
app/api/resume/download/route.ts:6:27   'request' is defined but never used
app/api/resume/generate/route.tsx:23:28 '_req' is defined but never used
components/profile/ConnectedAccounts.tsx:12:22  '_linkedinContextId' is defined but never used
components/profile/ProfileForm.tsx:3:31  'useRef' is imported but unused
```

Note: two are in dead files (`ConnectedAccounts.tsx`) and would disappear with the [§9](#9-dead-code) cleanup.
`ProfileForm.tsx:3` is a trivial fix. The underscore prefix does not suppress the rule.

### Git history

```
788baa5 Update
97332ef Update
eccd9d3 Update
fb56c05 Update readme
ff82f9c fix: disable prefetch on logout link to prevent auto-logout
a518420 fix: remove middleware.ts — project uses proxy.ts for session refresh
0f4f67c fix: add middleware to refresh auth session on every request
bf2d3b4 fix: remove versionless lightningcss platform stub from lockfile
6bb7624 Add imgs and readme
de902c3 finalize app
23734e9 implement features up to 08
038893b implement everything up to phase 1
```

**Untracked working-tree files:** `package-lock.json` (modified) + 8 untracked images in `public/images/`.

---

*End of audit. No files were modified in producing this document.*
