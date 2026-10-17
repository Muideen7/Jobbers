# JOBBERS — COMPLETE ARCHITECTURE, UI DESIGN SYSTEM & MONGODB MIGRATION MASTER SPEC

> **MIGRATION STATUS**: Fully migrated off `@insforge/sdk` onto **MongoDB Atlas (`mongodb`)**, **Better Auth (`better-auth` + `@better-auth/mongo-adapter`)**, and **Resend (`resend`)**, preserving 100% of the Jobbers UI Design System, Tailwind v4 `@theme` tokens, Mona Sans typography, and root-level directory boundaries.

---

## 1. ARCHITECTURAL & DIRECTORY BOUNDARIES

1. **NO `src/` Directory**: All folders (`app/`, `components/`, `lib/`, `actions/`, `types/`) live strictly at the repository root. Never create or import from `src/`.
2. **Strict Separation of Concerns**:
   - **`app/`**: Next.js 16 App Router pages, layouts, and API route handlers ONLY. Zero business logic or direct `mongodb` queries inside `page.tsx` or `layout.tsx` files (call functions from `lib/` instead).
   - **`components/`**: Pure presentation UI layer. Never invoke database SDKs or server auth helpers directly inside `components/`.
   - **`actions/`**: Next.js Server Actions (`"use server"`) for all user mutations. Every action MUST call `requireUser()` from `auth.ts`, scope queries by `userId`, and call `revalidatePath()`.
   - **`lib/`**: Database connection (`lib/mongodb.ts`), data-fetching/aggregation services (`lib/dashboard.ts`, `lib/jobs/*`), AI caller (`lib/llm.ts`), email service (`lib/mail.ts`), and utilities (`lib/utils.ts`).
3. **Serialization Rule**: Always serialize MongoDB `_id` (`ObjectId`) to string (`_id.toString()`) and `Date` objects to ISO strings inside `lib/` before passing data from Server Components to Client Components.
4. **Deterministic-First AI Guardrail**:
   - Never run blocking Gemini (`@google/genai`) calls on page load or across entire job feed arrays.
   - Calculate baseline 0–100 Fit Scores deterministically in `lib/utils.ts` by comparing job skills/keywords against `profile.skills`.
   - Call `lib/llm.ts` ONLY on explicit user triggers (e.g., clicking "Deep AI Fit Analysis", "Tailor Resume Bullets", or "Generate Company Dossier") and cache the result in MongoDB.

---

## 2. STRICT UI DESIGN SYSTEM & TOKENS (TAILWIND v4)

All design tokens are defined inside `@theme` in `app/globals.css`.

### 2.1 Typography ("Typo" Rules)

- **Primary Font**: **Mona Sans** (`--font-sans` in `app/layout.tsx`). Never load or reference secondary fonts (`Inter`, `Roboto`, `font-mono`).
- **Scale**:
  - **Logo**: `text-[19px] leading-7 font-bold text-text-darkest`
  - **Stat Numbers / Big KPIs**: `text-3xl font-semibold text-text-primary`
  - **Section / Card Headings**: `text-base font-semibold text-text-primary`
  - **Body / Primary Items**: `text-sm font-medium text-text-primary`
  - **Secondary / Labels**: `text-sm font-medium text-text-secondary`
  - **Muted / Timestamps / Hints**: `text-xs font-normal text-text-muted`
  - **Table Headers**: `text-xs font-medium uppercase tracking-wide text-text-secondary`
  - **Trend Badges**: `rounded-sm px-2 py-0.5 text-xs font-medium bg-success-lightest text-success-darker`

### 2.2 Strict Color & Token Invariants

1. **NO RAW TAILWIND COLORS**: Never use `bg-white`, `text-white`, `border-black`, `bg-zinc-*`, `text-gray-*`, `bg-purple-*`, `bg-emerald-*`, etc.
2. **NO HARDCODED HEX VALUES**: Allowed ONLY in `app/opengraph-image.tsx`, `ResumePDF.tsx`, and third-party SVG logos in `components/homepage/Logos.tsx`.
3. **BRAND ACCENT IS NOT FOR BUTTONS**: `--color-accent` (`bg-accent`, `text-accent`, `bg-accent-light`, `bg-accent-muted`) is strictly for AI indicators, active nav states, progress bars, and focus rings.
4. **BUTTON CONVENTIONS**:
   - Primary CTA: `className="btn btn-primary"` (`bg-ink text-accent-foreground rounded-full h-13 px-7 font-bold`)
   - Secondary CTA: `className="btn btn-secondary"` (`bg-surface border border-border rounded-full`)
   - Small modifier: `btn-sm` (`min-h-10 px-4.5 text-sm`)
   - Never use `.btn-ghost` or purple buttons.
5. **SEMANTIC TOKEN REFERENCE**:
   - **Surfaces**: `bg-background`, `bg-surface`, `bg-surface-secondary`
   - **Borders**: `border-border`, `border-border-light`, `border-border-muted`, `border-ink`
   - **Text**: `text-text-darkest`, `text-text-primary`, `text-text-secondary`, `text-text-muted`, `text-accent-foreground`
   - **Match Status**: `bg-success` (≥80%), `bg-info` (60–79%), `bg-warning` (<60%)
   - **Pastel KPI Cards**: `bg-pastel-blue`, `bg-pastel-mint`, `bg-pastel-pink`, `bg-pastel-lilac`, `bg-pastel-yellow`

### 2.3 Shell Layouts & Card Rules

- **Standard Container**: `max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8`
- **Dashboard 3-Column Grid**: `max-w-[1600px] mx-auto grid grid-cols-1 gap-5 xl:grid-cols-[264px_minmax(0,1fr)_380px]` (Left filters / Center feed / Right sticky detail panel at `xl:top-[5.5rem]`).
- **Cards**:
  - Standard: `bg-surface border border-border rounded-2xl p-6 shadow-card`
  - Dashboard Workspace Exception: `bg-surface border border-ink shadow-sm rounded-2xl p-6` (or `bg-pastel-* border border-ink shadow-sm rounded-2xl p-6`)
- **Empty States**: Never render fake or mock arrays. Render a `bg-surface-secondary` icon badge, `text-sm font-medium text-text-primary` title, `text-xs font-normal text-text-muted` description, and a `.btn .btn-primary` action button.

---

## 3. DEPENDENCY & ENVIRONMENT SPECIFICATION

### 3.1 Package Changes

- **Uninstall**: `@insforge/sdk`, `@browserbasehq/sdk`, `@browserbasehq/stagehand`, `playwright-core`, `pdf-parse`, `@openrouter/ai-sdk-provider`
- **Install**: `mongodb`, `@auth/mongodb-adapter`, `next-auth@beta`, `resend`
- **Keep**: `@google/genai`, `@react-pdf/renderer`, `zod`, `recharts`, `lucide-react`, `date-fns`, `@radix-ui/*`, `posthog-js`, `posthog-node`, `clsx`, `tailwind-merge`

### 3.2 Environment Variables (`.env.local`)

```env
MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/jobbers?retryWrites=true&w=majority"
AUTH_SECRET="generate-with-npx-auth-secret"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
RESEND_API_KEY=""
EMAIL_FROM="Jobbers <onboarding@resend.dev>"
GEMINI_API_KEY=""
```

---

## 4. CORE INFRASTRUCTURE CONTRACTS

### 4.1 `lib/mongodb.ts`

- Create a singleton `MongoClient` cached on `globalThis._mongoClient` in development.
- Export `default client` (for `MongoDBAdapter(client)`) and `export async function getCollection<TSchema extends Document>(name: string)` returning `connectedClient.db().collection<TSchema>(name)`.

### 4.2 `auth.config.ts`, `auth.ts` & `proxy.ts`

- **`auth.config.ts`**: Configure `Google` and `GitHub` providers from `next-auth/providers/*` with `pages: { signIn: "/login" }`.
- **`auth.ts`**: Initialize `NextAuth` with `adapter: MongoDBAdapter(client)`, `session: { strategy: "jwt" }`, and callbacks injecting `user.id` into `token.id` and `session.user.id`. Export `{ handlers, auth, signIn, signOut }` plus a helper `requireUser()` that returns `session.user` or throws/redirects if unauthenticated.
- **`app/api/auth/[...nextauth]/route.ts`**: Export `{ GET, POST } = handlers`.
- **`proxy.ts` (Root)**: Next.js 16 route guard protecting `/home`, `/jobs`, `/applications`, `/resumes`, `/company-research`, `/analytics`, `/profile`, and `/settings`. Unauthenticated requests redirect to `/login`.

### 4.3 `lib/mail.ts`

- Export `sendJobbersEmail({ to, subject, heading, bodyText, ctaLabel, ctaUrl })` using `new Resend(process.env.RESEND_API_KEY)`. If `RESEND_API_KEY` is missing in local dev, log a warning and return gracefully without throwing.

---

## 5. MONGODB COLLECTIONS & SCHEMAS (`types/database.ts`)

Enforce tenant isolation in every query using `{ userId: user.id }` across these **4 collections**:

1. **`profiles`** (1 document per user, indexed unique on `userId`):
   - Fields: `userId`, `fullName`, `headline`, `location`, `email`, `skills: string[]`, `experience: Array<{ id, role, company, startDate, endDate, bullets: string[] }>`, `projects: Array<{ id, name, url, bullets: string[] }>`, `education: Array<{ id, school, degree, year }>`, `emailNotifications: boolean`, `updatedAt: Date`.
2. **`applications`** (4-Stage Kanban Pipeline, indexed on `{ userId: 1, stage: 1, updatedAt: -1 }`):
   - Fields: `_id`, `userId`, `externalJobId`, `stage: "Saved" | "Applied" | "Interview" | "Offer"`, `role`, `company`, `location`, `remoteType`, `salaryLabel`, `applyUrl`, `descriptionSnippet`, `matchScore: number`, `matchedSkills: string[]`, `missingSkills: string[]`, `fitJustification?: string`, `resumeId?: string`, `notes?: string`, `appliedAt?: Date`, `updatedAt: Date`, `createdAt: Date`.
3. **`resumes`** (AI Resume Studio Documents, indexed on `{ userId: 1, createdAt: -1 }`):
   - Fields: `_id`, `userId`, `targetJobId?: string`, `title`, `targetCompany`, `targetRole`, `tailoredSummary`, `selectedSkills: string[]`, `tailoredExperience`, `tailoredProjects`, `createdAt: Date`, `updatedAt: Date`.
   - _Note_: Do NOT use external blob storage for PDFs. Store structured resume JSON in `resumes` and stream the vector PDF dynamically via `@react-pdf/renderer` in `app/api/resume/download/[id]/route.ts`.
4. **`dossiers`** (Global Shared Company Research Cache, indexed unique on `companySlug`):
   - Fields: `_id`, `companySlug`, `companyName`, `website`, `overview`, `cultureNotes: string[]`, `techStack: string[]`, `interviewProcess: string[]`, `talkingPoints: string[]`, `updatedAt: Date`.
   - _Rule_: Shared across users. If a dossier for `companySlug` exists and `updatedAt` is `< 30 days` old, return the cached MongoDB document (0 AI tokens). Otherwise call `callGeminiJson` in `lib/llm.ts` and upsert into `dossiers`.

---

## 6. FEATURE-BY-FEATURE MIGRATION & CLEANUP RULES

1. **Delete Obsolete Files & Routes**:
   - Delete `lib/insforge-server.ts` and `lib/insforge-client.ts`.
   - Delete `app/api/agent/*` (Browserbase/Stagehand routes), `app/api/auth/logout`, `app/api/auth/oauth`, `app/api/auth/refresh`, `app/(auth)/callback`, `app/api/sidebar-summary/*`.
   - Consolidate redundant workspace routes: merge `/dossiers` into `/company-research` and merge `/inventory` into `/profile` (and `/resumes`), keeping the 8 canonical workspace routes: `/home`, `/jobs`, `/applications`, `/resumes`, `/company-research`, `/analytics`, `/profile`, `/settings`.
2. **Workspace Shell (`app/(workspace)/layout.tsx` & `components/layout/AppShell.tsx`)**:
   - Fetch the current user and live sidebar badge counts (`applications` count + stale application count) directly via a `lib/` server function in `app/(workspace)/layout.tsx` instead of calling `/api/sidebar-summary`.
3. **Workspace Home (`app/(workspace)/home/page.tsx`)**:
   - Use `lib/dashboard.ts` to fetch KPI metrics (`Active Applications`, `Interview Stage`, `Avg AI Fit Score`, `Saved Roles Queue`), the **Stale Application Action Queue** (`stage === "Applied"` with `updatedAt > 14 days ago` or `stage === "Saved"`), the 4-stage pipeline distribution bars (`bg-accent`), and the AI-scored job feed inside the `max-w-[1600px]` 3-column grid (`xl:grid-cols-[264px_minmax(0,1fr)_380px]`).
4. **Multi-Source Job Feed (`app/(workspace)/jobs/page.tsx` & `lib/jobs/*`)**:
   - Keep the 6 providers (`adzuna.ts`, `arbeitnow.ts`, `remote-feeds.ts`, `jsearch.ts`).
   - Compute deterministic `matchScore`, `matchedSkills`, and `missingSkills` against the user's `profiles.skills` in `lib/utils.ts`.
   - Provide an on-demand action to run Gemini deep fit justification (`lib/llm.ts`) and 1-click saving to the `applications` collection (`stage: "Saved"`).
5. **4-Stage Kanban Pipeline (`app/(workspace)/applications/page.tsx` & `actions/applications.ts`)**:
   - Render the 4 columns (`Saved` → `Applied` → `Interview` → `Offer`) with optimistic stage transitions.
   - Include a **"Track External Job"** dialog (`@radix-ui/react-dialog`) so users can manually add roles from external boards into `applications`.
   - When a job moves to `"Interview"` or `"Offer"`, trigger `sendJobbersEmail` (`lib/mail.ts`) if `profile.emailNotifications` is enabled.
6. **AI Resume Studio (`app/(workspace)/resumes/page.tsx` & `app/api/resume/download/[id]/route.ts`)**:
   - Remove `pdf-parse`. If a user uploads an existing PDF resume to import into their profile, pass the PDF base64/buffer directly to Gemini in `lib/llm.ts` (`inlineData: { mimeType: "application/pdf", data }`) to extract structured `ProfileDoc` JSON.
   - Allow users to select a target job, tailor experience/project bullets via `lib/llm.ts`, save the `ResumeDoc` to MongoDB, and download the ATS-optimized PDF via `@react-pdf/renderer`.

---

## 7. PHASED EXECUTION PROTOCOL (FOLLOW IN ORDER)

Do NOT attempt to rewrite all files in one giant unverified dump. Execute in these 4 phases:

- **PHASE 1 (Infrastructure & Auth Swap)**:
  1. Update `package.json` dependencies.
  2. Delete `lib/insforge-*`, `app/api/agent/*`, `app/api/sidebar-summary/*`, and legacy auth endpoints.
  3. Create `types/database.ts`, `lib/mongodb.ts`, `auth.config.ts`, `auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `proxy.ts`, and `lib/mail.ts`.
  4. Refactor `app/(auth)/login/page.tsx` to use Auth.js Google & GitHub OAuth with Jobbers `.btn .btn-primary` / `.btn .btn-secondary` classes.
- **PHASE 2 (Data Layer & Server Actions)**:
  1. Refactor `lib/dashboard.ts`, `lib/jobs/*`, and `lib/llm.ts` to read/write via `getCollection()` from `lib/mongodb.ts`.
  2. Refactor all files in `actions/` (`applications.ts`, `profile.ts`, `resumes.ts`, `dossiers.ts`) to use MongoDB + `requireUser()` + `sendJobbersEmail()`.
  3. Refactor remaining `app/api/*` routes (`app/api/jobs/route.ts`, `app/api/resume/generate/route.ts`, `app/api/resume/download/[id]/route.ts`, `app/api/notifications/route.ts`).
- **PHASE 3 (Workspace Pages & Route Consolidation)**:
  1. Remove duplicate routes (`/dossiers`, `/inventory`, `/resumes/saved`) after merging their UI into `/company-research`, `/profile`, and `/resumes`.
  2. Wire `app/(workspace)/layout.tsx` and the 8 workspace pages (`/home`, `/jobs`, `/applications`, `/resumes`, `/company-research`, `/analytics`, `/profile`, `/settings`) to the new `lib/` and `actions/` functions.
- **PHASE 4 (Verification & Token Audit)**:
  1. Search the codebase for any leftover references to `insforge`, `browserbase`, `stagehand`, `playwright`, or `pdf-parse`.
  2. Audit all modified components against Section 2 to ensure zero raw Tailwind colors (`bg-white`, `bg-zinc-*`, etc.) or hardcoded hexes were introduced.
  3. Run `npm run build` and fix any TypeScript or Next.js 16 type errors.
