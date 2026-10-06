# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### Login Card

File: components/auth/LoginCard.tsx
Last updated: 2026-10-05

| Property         | Class                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Background       | `bg-surface` outer shell with `landing-hero-glow` on the left auth storytelling panel                    |
| Border           | `border border-border`, `border-b border-border` on mobile split, `lg:border-r` on desktop split        |
| Border radius    | `rounded-3xl` outer shell (24px token), `rounded-full` on the small OAuth security badge, `rounded-md` buttons |
| Text — primary   | Hero `text-[clamp(2.35rem,5vw,4.25rem)] font-semibold leading-[0.96] tracking-[-0.04em] text-text-slate`, form title `text-3xl font-semibold leading-9 text-text-primary` |
| Text — secondary | `text-base leading-7 text-text-secondary sm:text-lg` for supporting copy, `text-sm leading-6 text-text-secondary` for form guidance |
| Spacing          | Outer `mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1440px] items-center justify-center px-4 py-12 sm:px-6 lg:px-8`, panels `p-8 sm:p-10`, actions `mt-8 grid gap-3` |
| Hover state      | Provider form buttons use `hover:bg-surface-secondary`; focus uses `focus-visible:outline-accent`        |
| Shadow           | `shadow-card` on the outer auth shell                                                                   |
| Accent usage     | `text-accent` on the InsForge security badge icon only                                                     |

**Provider icons — use `CompanyLogo`, not lucide.** The Google and GitHub buttons render
`<CompanyLogo type="google" />` and `<CompanyLogo type="github" />` from
`components/homepage/Logos.tsx` at `h-5 w-5 shrink-0`. Do **not** substitute a lucide glyph
(`Globe`, `GitBranch`) or hand-roll an inline path: those are generic symbols, not the brands, and
Google's mark is genuinely four-colour so a monochrome path would be a different logo rather than a
tint of the real one. Google carries its own brand hex fills and ignores `currentColor`; GitHub is
`fill="currentColor"` and therefore inherits the button's `text-text-primary`, which is why neither
button needs a colour utility on the icon itself.

**Pattern notes:**
Auth screens use a two-panel shell: a left explanatory panel with the established landing glow treatment and a right focused action panel. Provider actions are token-driven bordered form buttons with lucide icons and no hardcoded provider colors.

### App Navbar

File: components/layout/Navbar.tsx
Last updated: 2026-10-01

| Property         | Class                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| Background       | `sticky top-0 z-50 bg-surface/90 backdrop-blur-md` (matches the landing navbar treatment)                 |
| Border           | `border-b border-border`                                                                                 |
| Border radius    | `rounded-md` on nav links, `rounded-lg` on the mobile menu trigger                                       |
| Text — primary   | `text-sm font-medium text-text-dark`, active `text-accent` (authed routes only)                            |
| Text — secondary | `text-sm font-medium text-text-secondary` on "Back to home"; `btn btn-primary btn-sm` on the CTA            |
| Spacing          | `mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8`             |
| Hover state      | `hover:text-text-primary` on nav links, `hover:bg-surface-secondary` on the mobile trigger                |
| Shadow           | `shadow-xl` on the mobile drawer                                                                          |
| Accent usage     | `text-accent` for the active route, `bg-accent-light text-accent` on the active mobile link               |

**Pattern notes:**
The in-app navbar deliberately mirrors the landing navbar: both are `sticky`, `backdrop-blur-md`, `bg-surface/90`, `h-16`, and share the `max-w-[1440px] px-4 sm:px-6 lg:px-8` container. Below `md` both swap to a full-screen left drawer with an `bg-ink/40` scrim, body scroll lock, Escape-to-close, and a close-on-navigate link handler. Drawer state closes via the link `onClick` rather than a `useEffect` + `setState` (rejected by `react-hooks/set-state-in-effect`).

**Signed-in vs. signed-out (auth-aware chrome):**
The navbar is driven by the `isAuthenticated` prop, and the **signed-out variant must not expose any session-gated route**. `/dashboard`, `/profile` and `/find-jobs` all 307 anonymous visitors back to `/login`, so advertising them pre-auth is a dead end.

| | Signed in | Signed out (auth page) |
| --- | --- | --- |
| Desktop nav links | Dashboard / Find Jobs / Profile, active item in `text-accent` | none |
| Desktop right | `UserCircle` + Sign out | `ArrowLeft` "Back to home" + `.btn .btn-primary .btn-sm` "Get started" |
| Mobile bar | hamburger only | hamburger only — **no duplicate CTA button in the bar** |
| Mobile drawer | 3 nav links + Sign out | one `ArrowLeft` "Home" link + "Get started" |

Two rules learned here: (1) the CTA label stays `"Get started"` to match `LandingNavbar` — an earlier variant rendered a `"Start"` button in the mobile bar *and* a `"Start for free"` one in the drawer, so mobile showed two competing CTAs; (2) the desktop `"Back to home"` `ArrowLeft` link exists because the wordmark alone reads as a brand, not as a way out of the auth page.

### App Footer

File: components/layout/Footer.tsx
Last updated: 2026-10-01

| Property         | Class                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| Background       | `bg-surface` with `border-x border-b border-border`                       |
| Layout           | `mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8` |
| Content          | `Logo` + a single `Back to home` link                                     |
| Typography       | `text-sm font-medium text-text-secondary`, `hover:text-text-primary`      |

**Pattern notes:**
This footer renders **only on the auth page**, so it follows the same rule as the signed-out navbar: it links only to `/`. An earlier version pointed at `/find-jobs`, `/profile` and `/dashboard`, which is both a dead end pre-auth and a dead `href="#"`-style link. Container padding must stay identical to the navbar (`px-4 sm:px-6 lg:px-8`) or the logo and links visibly misalign with the header above.


### Landing Hero

File: components/homepage/Hero.tsx
Last updated: 2026-10-01

| Property         | Class |
| ---------------- | ----- |
| Section          | `w-full pt-10 pb-16 md:pt-14 md:pb-24 overflow-hidden` with an inner `max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8` |
| Eyebrow pill     | `inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-accent-muted border border-accent-light text-xs sm:text-sm font-medium text-accent shadow-2xs` |
| Text — primary   | `text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-bold text-text-primary tracking-tight leading-[1.08]` |
| Text — secondary | `text-base sm:text-lg text-text-strong max-w-2xl mx-auto leading-relaxed pt-2` |
| CTAs             | `flex flex-wrap items-center justify-center gap-3 pt-4` with `.btn btn-primary` and `.btn btn-secondary` |
| Panel grid       | `mt-14 lg:mt-18 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch` |
| Panel radius     | `rounded-[32px] sm:rounded-[36px]`, gradients `from-lavender via-lavender-soft to-peach` |
| Hover state      | Shared hover from `.btn-primary` / `.btn-secondary` |
| Accent usage     | Eyebrow pill plus the single `.btn btn-primary` primary CTA |

**Pattern notes:**
Centred headline copy, paired CTA buttons, then a 12-column panel grid. The panel
gradients are token-driven (`from-lavender via-lavender-soft to-peach`). This hero does
**not** use the `landing-hero-glow` utility — `LoginCard` is its only consumer.

### Buttons (.btn system)

File: app/globals.css
Last updated: 2026-10-01

| Property         | Class / rule                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Classes          | `.btn` base, `.btn-primary` (near-black `bg-ink`), `.btn-secondary` (white + border), `.btn-sm`      |
| Border radius    | `var(--radius-full)` — all buttons are pills                                                        |
| Base sizing      | `min-height: 3.25rem`, `padding: 0.875rem 1.75rem`, `font-size: 1rem`, `font-weight: 700`           |
| `.btn-sm`        | `min-height: 2.5rem`, `padding: 0.5rem 1.125rem`, `font-size: 0.875rem`                            |
| Active state     | `transform: scale(0.98)`                                                                            |
| Hover state      | Primary lifts `-2px` and deepens to `bg-ink-hover`; secondary lightens to `bg-surface-secondary`     |
| Focus            | `outline: 2px solid var(--color-accent)` with `outline-offset: 3px`                                  |
| Accent usage     | Focus ring only — the fill itself is deliberately **not** purple                                    |

**Pattern notes:**
`.btn` is the single button system for the whole app, landing and in-app pages alike. Primary actions are **near-black pills**, not purple — `context/ui-tokens.md` states this explicitly and it is the single most visible consistency rule. The in-app pages (`JobActions`, `ResearchCompanyButton`, `SearchControls`, `ResumeSection`, `ProfileForm`, `Navbar`) were all converted from hand-rolled `bg-accent` rectangles to `.btn btn-primary`. Never hand-roll a primary button.


### Analytics Logout Link

File: components/analytics/PostHogLogoutLink.tsx
Last updated: 2026-06-03

| Property         | Class                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Background       | Inherited through `className`; Navbar callers pass `hover:bg-surface-secondary`         |
| Border           | Inherited through `className`; current usage passes `border border-border`            |
| Border radius    | Inherited through `className`; Navbar callers pass `rounded-lg`                        |
| Text — primary   | Inherited through `className`; current usage passes `text-sm font-medium text-text-primary` |
| Text — secondary | `none`                                                                                |
| Spacing          | Inherited through `className`; current usage passes `min-h-10 px-4 py-2`              |
| Hover state      | Inherited through `className`; current usage passes `hover:bg-surface-secondary`      |
| Shadow           | `none`                                                                                |
| Accent usage     | `none`                                                                                |

**Pattern notes:**
Analytics wrapper links should preserve the exact visual classes of the link or button they replace. The component owns only the PostHog reset behavior and must not introduce standalone styling.

---

### Profile Attention Banner

File: components/profile/ProfileAttentionBanner.tsx
Last updated: 2026-06-03

| Property         | Class                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Background       | `bg-surface`                                                                          |
| Border           | `border border-border`                                                                |
| Border radius    | `rounded-2xl`                                                                         |
| Text — primary   | `text-sm font-semibold text-text-primary`                                             |
| Text — secondary | `text-sm text-text-secondary`                                                         |
| Spacing          | `p-6`, banner layout `flex items-start justify-between gap-6`                         |
| Hover state      | `none`                                                                                |
| Shadow           | `shadow-card`                                                                         |
| Accent usage     | SVG ring stroke uses `var(--color-accent)`; warning badges use `bg-warning text-warning-foreground` |

**Pattern notes:**
Completion ring is a pure SVG circle with the `strokeDashoffset` SVG attribute driven by the `completionPercent` prop. Missing field badges use `rounded-sm` (not pill) with warning color. Ring is 88×88px, radius 34, stroke-width 8. Since D1 this banner renders **only on /dashboard** — the profile page uses `ProfileOverview` below.

---

### Profile Overview

File: components/profile/ProfileOverview.tsx
Last updated: 2026-10-06

| Property         | Class                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Background       | `bg-surface`                                                                          |
| Border           | `border border-border`                                                                |
| Border radius    | `rounded-2xl`                                                                         |
| Text — primary   | `text-base font-semibold text-text-primary` heading; `text-3xl font-semibold` stat values |
| Text — secondary | `text-sm text-text-secondary` status line — `text-success` when 100%                    |
| Spacing          | `p-6`, banner layout `flex items-start justify-between gap-6`; stats `mt-5 flex flex-wrap gap-x-8 gap-y-4` |
| Hover state      | `none`                                                                                |
| Shadow           | `shadow-card`                                                                         |
| Accent usage     | Ring identical to ProfileAttentionBanner; missing chips `bg-warning text-warning-foreground` |

**Pattern notes:**
Always renders (unlike the attention banner, which hides at 100%) — it is the profile home's top card (plan D1, "overview + sections"). The `dl` stats row shows Skills / Roles / Experience / Years: `text-xs font-medium text-text-muted` labels above `text-3xl font-semibold` values, `Years` renders an em dash when `years_experience` is null. Server component taking `profile` plus the `calculateCompletion` outputs; ring geometry shared with the banner (88×88, radius 34, stroke-width 8).

---


### Resume Section

File: components/profile/ResumeSection.tsx
Last updated: 2026-06-04

| Property         | Class                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Background       | `bg-surface` card, `bg-surface-secondary` drop zone default                           |
| Border           | `border border-border` card; `border-2 border-dashed border-border` drop zone         |
| Border radius    | `rounded-2xl` card, `rounded-xl` drop zone, `rounded-full` upload icon ring           |
| Text — primary   | `text-sm font-medium text-text-primary`                                               |
| Text — secondary | `text-xs text-text-muted`                                                              |
| Spacing          | `p-6` card, `py-10` drop zone, `mt-4 flex flex-col gap-3` footer area                 |
| Hover state      | `hover:bg-surface-secondary` Select Resume + Generate buttons; `hover:opacity-90` Extract button |
| Shadow           | `shadow-card` card, `shadow-card` upload icon ring                                    |
| Accent usage     | `border-accent bg-accent-muted` when dragging; Extract button `bg-accent text-accent-foreground` |

**Pattern notes:**
Drop zone switches from `border-border bg-surface-secondary` to `border-accent bg-accent-muted` on `isDragging`. Hidden `<input type="file">` triggered by the Select Resume button via a `ref`. Only PDF files accepted. `Extract Profile` button only renders when a resume exists (`existingResumeUrl || fileName`). Accepts `onExtracted` callback prop. Uses separate `useTransition` instances: `isExtracting` for the extract flow, `isGenerating` for the generate flow. Generate button calls `POST /api/resume/generate`, then opens `/api/resume/download` in a new tab on success. Both action rows show error/success feedback below the button using `text-sm text-error` / `text-sm text-success`.

### Profile Page Client

File: components/profile/ProfilePageClient.tsx
Last updated: 2026-06-04

Thin client wrapper that owns the `useRef<ProfileFormHandle>` connecting `ResumeSection.onExtracted` to `ProfileForm.applyExtracted`. Has no visible UI of its own — renders `<ResumeSection>` then `<ProfileForm>` with the ref wired between them.

---

### Profile Form

File: components/profile/ProfileForm.tsx
Last updated: 2026-10-06

| Property         | Class                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Background       | `bg-surface`                                                                          |
| Border           | `border border-border` card; `divide-y divide-border` section dividers; `border border-border` work entry cards |
| Border radius    | `rounded-2xl` outer card, `rounded-xl` work entry cards, `rounded-lg` inputs/selects/buttons |
| Text — primary   | `text-sm font-semibold text-text-primary` section headings; `text-sm text-text-primary` body |
| Text — secondary | `text-xs font-medium uppercase tracking-wide text-text-secondary` form labels         |
| Spacing          | `px-6` body (`divide-y` sections), `px-6 py-5` header, `px-6 py-4` footer, section rows `py-4` toggle + `pb-6` content |
| Hover state      | `hover:bg-surface-secondary` secondary buttons; `hover:opacity-90` primary/Save button |
| Shadow           | `shadow-card`                                                                         |
| Accent usage     | `focus:ring-1 focus:ring-accent` on all inputs and section toggles; `bg-accent-light text-accent` skill tags; `bg-accent text-accent-foreground` Save button |

**Pattern notes:**
Form labels use `text-xs font-medium uppercase tracking-wide` — all caps with letter-spacing, not sentence case. Tag inputs render removable pill chips with `bg-accent-light text-accent`. Work Experience entries are individually bordered sub-cards inside the main form card. Month/Year pickers use two adjacent `<select>` elements. Save Profile button is full-width at the bottom of the card.

Since D1 the five sections (Personal / Professional / Work Experience / Education / Job Preferences) render as `FormSection` accordion rows: a full-width `button py-4` header carrying the `text-sm font-semibold` title over a `text-xs text-text-muted truncate` summary computed from live state (e.g. `3 roles added`, first seeking title + `+2`), with `ChevronDown size={16}` rotating `rotate-180` when open; content sits in `pb-6`. **All sections start collapsed** — resume extraction is the primary path — and `applyExtracted()` calls `openAllSections()` so extracted fields can be reviewed. The old `<SectionHeading>` component and `space-y-8`/spacer-divider layout are gone; `divide-y divide-border` on the body wrapper draws the dividers. `+ Add role` stays inside the Work Experience content, right-aligned (`justify-end`) since the section title moved to the toggle row.

---

### SearchControls

File: components/find-jobs/SearchControls.tsx
Last updated: 2026-06-05

| Property         | Class                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Background       | `bg-surface`                                                                          |
| Border           | `border border-border`                                                                |
| Border radius    | `rounded-2xl` card, `rounded-lg` inputs and button                                   |
| Text — primary   | `text-sm text-text-primary`                                                           |
| Text — secondary | `text-xs font-medium uppercase tracking-wide text-text-secondary` labels              |
| Spacing          | `p-6` card, `gap-4` grid                                                              |
| Hover state      | `hover:opacity-90` Find Jobs button                                                   |
| Shadow           | `shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]`             |
| Accent usage     | `bg-accent text-accent-foreground` button; `focus:ring-accent` inputs; `bg-success-lightest border-success-light text-success-foreground` success banner |

**Pattern notes:**
Three-column grid at `sm:` breakpoint — job title (with search icon), location, Find Jobs button aligned to bottom. Success banner uses `✨` emoji + green pill. Button disabled when job title empty or search in progress.

---

### JobFilters

File: components/find-jobs/JobFilters.tsx
Last updated: 2026-06-05

| Property         | Class                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Background       | `bg-surface`                                                                          |
| Border           | `border border-border` on inputs and selects                                          |
| Border radius    | `rounded-lg`                                                                          |
| Text — primary   | `text-sm font-medium text-text-primary`                                               |
| Text — secondary | `text-text-muted` placeholder and chevron icons                                       |
| Spacing          | `gap-3` layout, `gap-2` dropdown row                                                  |
| Hover state      | `none`                                                                                |
| Shadow           | `none`                                                                                |
| Accent usage     | `focus:ring-accent focus:border-accent`                                               |

**Pattern notes:**
`appearance-none` on `<select>` with absolute `ChevronDown` icon overlay. Filter/sort dropdowns sit in a flex row on the right; text search stretches to fill the left. All filter/sort changes reset pagination to page 1 (handled by parent).

---

### JobsTable

File: components/find-jobs/JobsTable.tsx
Last updated: 2026-10-06

| Property         | Class                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Background       | `bg-surface`, `hover:bg-surface-secondary` rows                                       |
| Border           | `border border-border` card, `border-b border-border` row separators                 |
| Border radius    | `rounded-2xl` card, `rounded-full` score bar, `rounded-lg` company icon box          |
| Text — primary   | `text-sm font-medium text-text-primary` company; `text-sm text-text-primary` role    |
| Text — secondary | `text-xs font-medium uppercase tracking-wide text-text-secondary` column headers; `text-sm text-text-muted` date |
| Spacing          | `px-6 py-3` headers, `px-6 py-4` cells                                               |
| Hover state      | `hover:bg-surface-secondary` on `<tr>`                                                |
| Shadow           | `shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]`             |
| Accent usage     | Score bar fill: `bg-success` (≥80), `bg-info` (60-79), `bg-warning` (<60); source badge `bg-accent-light text-accent` for search-derived rows, `bg-surface-secondary text-text-secondary` for `URL` |

**Pattern notes:**
Each cell wraps its content in `<Link href="/find-jobs/{id}">` for full-row clickability. Score bar is `h-1 w-24 bg-border-light` track with colored fill div driven by `style={{ width: \`${score}%\` }}`. Company icon uses `Building2` from lucide as a placeholder. Source badge is pill-shaped: it maps `SEARCH_SOURCE_LABELS` — `Search` (legacy rows) plus the provider names `JSearch`/`Adzuna`/`Arbeitnow`/`RemoteOK`/`Remotive`/`Jobicy` (the provider id stored in `jobs.source` since plan A7) — and anything else renders `URL`. Accepts optional `isLoading` prop — dims table with `opacity-60 transition-opacity` during server fetch and skips empty-state when loading.

---

### JobsPagination

File: components/find-jobs/JobsPagination.tsx
Last updated: 2026-06-05

| Property         | Class                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Background       | `bg-surface` on page number and Previous/Next buttons                                 |
| Border           | `border border-border`                                                                |
| Border radius    | `rounded-lg`                                                                          |
| Text — primary   | `text-sm font-medium text-text-primary`                                               |
| Text — secondary | `text-sm text-text-muted` "Showing X to Y of Z" label                                |
| Spacing          | `gap-1` between page buttons, `h-8 w-8` page number buttons                          |
| Hover state      | `hover:bg-surface-secondary` on Previous/Next and inactive page numbers               |
| Shadow           | `none`                                                                                |
| Accent usage     | `bg-accent text-accent-foreground` active page button                                 |

**Pattern notes:**
`getPageNumbers()` returns ellipsis items as `"..."` strings alongside page numbers. Always shows first/last page; ellipsis collapses middle range. `disabled:opacity-40` on Previous/Next at boundaries. Returns `null` when `totalCount === 0`.

---

### SourceCredits

File: components/shared/SourceCredits.tsx
Last updated: 2026-10-06

| Property         | Class                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| Text — primary   | `text-center text-xs text-text-muted` base line                           |
| Links            | `underline underline-offset-2 hover:text-text-secondary` on each source   |
| Spacing          | none — inline `·` separators and a closing `and`                          |
| Shadow           | `none`                                                                    |
| Accent usage     | none — deliberately quieter than content                                 |

**Pattern notes:**
Shared attribution line ("Jobs via JSearch · RemoteOK …") required by the job-source APIs' terms (plan A7). Props: `{ credits: SourceCredit[]; className?: string }` — build credits with `resolveSourceCredits(...)` from `lib/source-attribution.ts` (dedupes by label, legacy `"search"` → Adzuna, skips `url`/unknown). Renders `null` when `credits` is empty, so it is safe to mount unconditionally. Every link opens with `target="_blank" rel="noopener noreferrer"`. Two callers today: `FindJobsClient` (credits from the jobs on screen, rendered when `totalCount > 0` in place of the old static "Jobs by Adzuna" line) and `LiveOpportunities` (credits from the API's `data.sources[]`, rendered under the results grid). Any new surface rendering job data must render this component too.

---

### Job Details Page

File: app/find-jobs/[id]/page.tsx (shell) + components/job-details/*.tsx (cards) and components/job-details/*
Last updated: 2026-06-05

| Property         | Class                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Page shell       | `mx-auto flex min-h-[calc(100vh-4rem)] max-w-[820px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-0` |
| Cards            | `rounded-2xl border border-border bg-surface p-6 shadow-card` in `JobInfo`/`JobDescription`/`CompanyResearch`; `overflow-hidden` wraps the research header inside `CompanyResearch` |
| Header icon      | `flex h-14 w-14 ... rounded-2xl border border-border bg-surface-secondary`; info icons use `h-10 w-10 rounded-xl` with token backgrounds |
| Text — primary   | Page title `text-2xl font-semibold leading-8 text-text-primary`; card headings `text-base font-semibold leading-6 text-text-primary`; body `whitespace-pre-line text-sm font-medium leading-6 text-text-primary` |
| Text — secondary | Section eyebrows `text-xs font-semibold uppercase leading-4 tracking-wide text-text-secondary`; labels `text-xs font-medium uppercase leading-4 tracking-wide text-text-muted` |
| Buttons          | Primary CTA `min-h-12 w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-foreground`; secondary external link `min-h-10 rounded-lg border border-border bg-surface px-4 py-2` |
| Badges           | Match score `rounded-full bg-success-lightest px-3 py-1 text-xs font-medium text-success-foreground`; matched skills `bg-success-lightest text-success-foreground`; gap skills `bg-accent-muted text-accent` |
| Empty state      | `flex min-h-64 flex-col items-center justify-center px-6 py-14 text-center` with `h-12 w-12 rounded-2xl bg-surface-secondary` icon shell and `bg-accent-muted text-accent` helper badge |

**Pattern notes:**
Job detail pages use a narrow centered column rather than the full dashboard width. Job descriptions render the complete stored text with `whitespace-pre-line`, append any populated structured bullet sections, and show a bordered `View Full Job Post` notice when the saved Adzuna preview ends with `…` or `...`. Company research now renders a saved 9-field dossier read-only; once research exists, the generate action is hidden. Authenticated app pages pass `isAuthenticated` to `Navbar` so the top-right user icon and sign-out action match the signed-in designs.

### Company Research Dossier

File: components/job-details/CompanyResearch.tsx and components/job-details/ResearchCompanyButton.tsx
Last updated: 2026-06-05

| Property         | Class                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Background       | `bg-surface` outer card; `bg-surface-secondary` inner dossier panels                  |
| Border           | `border border-border` outer card and inner panels; `border-b border-border` header; `border-t border-border` sources footer |
| Border radius    | `rounded-2xl` outer card, `rounded-xl` panels, `rounded-lg` section icons and button, `rounded-full` tags |
| Text — primary   | `text-base font-semibold leading-6 text-text-primary` card heading; `text-sm font-semibold leading-5 text-text-primary` section headings; `text-sm font-medium leading-6 text-text-primary` body |
| Text — secondary | `text-xs font-medium uppercase tracking-wide text-text-muted` source label; `text-xs text-error` and `text-xs text-success` button feedback |
| Spacing          | Header `p-6`, body `p-6` with `gap-6`, inner panels `p-4`, list items `space-y-2`     |
| Hover state      | Research button `hover:opacity-90`; source links `hover:text-text-primary`            |
| Shadow           | `shadow-card` on outer card only                                                      |
| Accent usage     | Button `bg-accent text-accent-foreground`; tech tags `bg-accent-muted text-accent`; section icon shells rotate between `bg-accent-muted`, `bg-success-lightest`, and `bg-info-lightest` token backgrounds |

**Pattern notes:**
The research card preserves the Feature 12 card shell and header, then swaps between an empty state with a client action and a dense read-only dossier. The client action lives in its own component, uses plain `fetch` plus `useTransition`, and calls `router.refresh()` after the API saves research. Dossier sections should stay compact, token-driven, and source-linked; do not add a refresh action unless Feature 13 scope changes. Since the dashboard rebuild the component accepts `showResearchButton?: boolean` (default `true`): the standalone find-jobs page keeps the in-card research action, but the dashboard's right-hand panel passes `showResearchButton={false}` so the panel's own Actions row owns it — never render two research buttons for the same job.

---

### shadcn/ui Primitives (Jobbers-mapped)

Files: components/ui/{button,badge,card,slider,scroll-area,dialog}.tsx
Last updated: 2026-10-06

Hand-written `shadcn/ui`-style primitives (the CLI/`init` **never ran** — it would
have rewritten `app/globals.css`). They mirror the classic shadcn API
(`cn`, `asChild` via `@radix-ui/react-slot`, `cva` variants, radix dialog /
slider / scroll-area roots) but every slot class is mapped onto the Jobbers
token set, so they read as the app's design language:

| Token pair (shadcn name) | Jobbers class |
| --- | --- |
| `primary` | `bg-ink text-accent-foreground hover:bg-ink-hover` |
| `primary-foreground` | `text-accent-foreground` |
| `card` | `bg-surface` |
| `muted` | `bg-surface-secondary text-text-muted` |
| `accent` | `bg-accent-muted text-accent` |
| `border` | `border-border` |
| `input` | `border-border bg-surface` |
| `ring` | `ring-accent` |
| `destructive` | `bg-error text-accent-foreground` |
| `foreground` | `text-text-primary` |

**Pattern notes:**
- **Button**: pill radius (`rounded-full`), `h-10 px-5` default / `h-9 px-4` sm /
  `h-11 px-7` lg, font-weight 700, `outline-2 outline-offset-[3px]
  focus-visible:outline-accent` focus, variants `default` (ink), `secondary`
  (surface-secondary), `destructive`, `outline`, `ghost`, `link`.
- **Badge**: pill (`rounded-full`), variants `default` (ink), `secondary`
  (surface-secondary), `destructive`, `outline`, plus the match-scoring set
  `success` / `info` / `warning` (green/blue/orange light fills driven by
  `--color-success-lightest` etc.). Icons inside use `[&_svg]` (underscore!)
  variants — `[&svg]` without the underscore generates an invalid
  `:is(...)svg` selector in Tailwind v4. Match badge variant is chosen by the
  centralized `getMatchBadgeVariant` in `lib/utils.ts` (green ≥70 via
  `MATCH_THRESHOLD`, info 60–69, warning <60, `secondary` on null).
- **Card**: `rounded-2xl border border-border bg-surface` with a
  `#card-header`/`#card-content` column layout; the dashboard passes
  `gap-0 py-0 border-ink shadow-sm` overrides.
- **Slider**: radix root styled with token tracks (`bg-border`), accent thumb
  (`bg-accent`), `divide-border` ticks.
- **ScrollArea**: radix root/bar with `bg-border` thumb — used for the sticky
  dashboard side columns.
- **Dialog**: radix overlay `bg-ink/40 backdrop-blur-sm`, content
  `rounded-2xl border border-border bg-surface`, header/footer slots.
- These primitives are `"use client"`-free for pure presentational ones;
  components that need state or radix interactivity are marked client. They
  deliberately live alongside — not instead of — the `.btn` system: `.btn
  btn-primary` remains the primary button language everywhere else.

---

### DashboardNav

File: components/dashboard/DashboardNav.tsx
Last updated: 2026-10-06

| Property       | Class |
| -------------- | ----- |
| Background     | `sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-md` (mirrors App Navbar) |
| Container      | `mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8` |
| Nav links      | `whitespace-nowrap rounded-md text-sm font-medium`, active `text-accent`, idle `text-text-dark hover:text-text-primary`; horizontal at `xl`, mobile drawer below |
| Search input   | `w-full rounded-full border border-ink bg-surface py-2 pl-10 pr-4 text-sm` `focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface` |
| Bell badge     | `absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground`, count = notifications from the last 24h |
| Menus          | popover panels `absolute right-0 top-full z-50 mt-2 rounded-2xl border border-border bg-surface p-4 shadow-xl`, closed by a transparent `fixed inset-0 z-40` backdrop button |
| Avatar         | `flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-accent-foreground` with `getInitials`; hover `scale-105` |
| InsForge chip  | `hidden lg:inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary` with a `h-2 w-2 rounded-full bg-success` dot |
| Drawer         | `fixed inset-0 z-[60] lg:hidden` — `bg-ink/40` scrim + `w-[min(20rem,85vw)] bg-surface p-6 shadow-xl` slide-in, rendered **outside** the header so `backdrop-blur` never becomes a containing block |

**Pattern notes:**
- **Six links**: Find Jobs, Inventory, AI Resume, Company Research,
  Applications, Profile. `/find-jobs` is active via `startsWith` (it has
  dynamic children); the rest are exact matches. Profile also lives in the
  avatar menu.
- **Navbar search = instant feed filter**: submit pushes
  `/dashboard?q=<query>`; `DashboardClient` adopts the new `initialQuery` via
  the sanctioned adjust-state-during-render pattern (no
  set-state-in-effect). On the dashboard this re-filters the already-loaded
  feed; from any other page it lands on the filtered feed.
- **Bell data**: fetched client-side from `/api/notifications` (last 5
  completed `agent_runs` + last 5 researched jobs, merged by `completed_at` /
  `found_at`, top 6). Identical bell on every workspace page.
- **Hooks hygiene**: `Date.now()` is computed inside the fetch callback (not
  render — `react-hooks/purity`), and `query` follows `initialQuery` with the
  render-adjustment pattern rather than an effect.

---

### ResumeDropzone + ExtractedReviewDialog

Files: components/dashboard/ResumeDropzone.tsx, components/dashboard/ExtractedReviewDialog.tsx
Last updated: 2026-10-06

| Property | Class |
| -------- | ----- |
| Dropzone  | `cursor-pointer rounded-xl border-2 border-dashed p-4 text-center` — idle `border-ink/30 bg-surface-secondary`, dragging `border-accent bg-accent-muted` |
| States    | uploading/extracting show `Loader2 animate-spin text-accent`; parsed shows a `bg-success-lightest` ring + `FileText text-success` |
| Dialog    | shadcn `Dialog` — header "Resume extracted", body summary card `rounded-xl border border-border bg-surface-secondary p-4`, skill `Badge variant="secondary"`, footer `DialogClose` "Discard" + "Apply to profile" |
| Feedback  | applied state `rounded-xl border border-border bg-success-lightest p-4` with `Check` + "Profile updated"; errors `text-error` |

**Pattern notes:**
- Non-destructive merge: `applyExtractedProfile` in `actions/profile.ts` only
  lets a non-empty extracted value win over the saved row, then delegates the
  write to `saveProfile`. `requireUser()` and the final write stay **outside**
  the action's own `try/catch` so a `NEXT_REDIRECT` can escape (same invariant
  as every other profile action).
- Dropzone rejects non-PDF (`file.type !== "application/pdf"`) and >2MB.
- `onApplied` is optional and only wired when a callback is actually passed
  (spread `{...(onApplied ? { onApplied } : {})}` — `exactOptionalPropertyTypes`
  forbids passing explicit `undefined`).

---

### Dashboard workspace page

File: app/dashboard/page.tsx
Last updated: 2026-10-06

| Property   | Class |
| ---------- | ----- |
| Shell      | `main.mx-auto max-w-[1600px] px-4 pb-10 pt-6 sm:px-6 lg:px-8` + `flex flex-col gap-5` |
| Workspace  | `grid grid-cols-1 gap-5 xl:grid-cols-[264px_minmax(0,1fr)_380px]` — left filters / center feed / right detail panel |
| Sidebars   | `xl:sticky xl:top-[5.5rem] xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:self-start` (left, via FilterSidebar) and `xl:sticky xl:top-[5.5rem] xl:max-h-[calc(100vh-7rem)]` (right, via JobDetailPanel's ScrollArea) |

**Pattern notes:**
- **Dashboard spec overrides the app language** (user decision): workspace
  cards use `rounded-2xl` (16px), `shadow-sm`, charcoal `border-ink` borders
  and ink buttons. New/placeholder pages keep the current app language
  (`border-border`, `shadow-card`, `.btn` pills). `twMerge` keeps `border-ink`
  over `border-border` when both are passed.
- Server component fetches top-100 jobs `match_score desc
  nullsFirst:false`, the profile (completion banner + nav identity), renders
  `PostHogIdentify` + `DashboardNav` + optional `ProfileAttentionBanner` +
  `DashboardClient`. `searchParams` is awaited (Next 16 async params).
- The old `StatsBar` / `RecentActivity` / `AnalyticsCharts` dashboard widgets
  were **deleted** (unused elsewhere); `recharts` remains only if other pages
  use it — none currently do.

### DashboardClient (workspace orchestrator)

File: components/dashboard/DashboardClient.tsx
Last updated: 2026-10-06

| Property        | Class |
| --------------- | ----- |
| State           | `jobs`, `selectedId`, `filters` (`DashboardFilters` from `lib/dashboard-filters.ts`), `isSearching`, `searchMessage` |
| Sync            | adopts `initialJobs` / `initialQuery` prop changes via **adjust-state-during-render** (`prevInitial*` refs) — fires after `router.refresh()` (research completed) or a `?q=` navigation |
| Auto-select     | one-shot render adjustment: when `selectedId === null && filtered.length > 0` set the first filtered job's id (converges, no effect) |
| Live search     | `POST /api/agent/find { jobTitle, location: "" }` → shows `successMessage` → `refetchJobs()` from `/api/jobs?limit=100` |
| Applied resume  | `onAppliedResume` → `router.refresh()` so the attention banner + initial jobs re-render server-side |

**Pattern notes:**
- One shared `filters` object powers both the left sidebar and the results-bar
  pills — `FilterSidebar` and `ResultsBar` both receive it plus an
  `onChange(patch)`.
- Selection is independent of filters: the panel keeps showing the selected
  job even if it is filtered out of the grid.
- Three `setState`-in-effect lint violations (jobs sync, query sync,
  auto-select) were all converted to the sanctioned render-adjustment pattern.

### FilterSidebar + FeedHero + ResultsBar + JobGrid

Files: components/dashboard/{FilterSidebar,FeedHero,ResultsBar,JobGrid}.tsx
Last updated: 2026-10-06

| Property      | Class |
| ------------- | ----- |
| Sidebar cards | `rounded-2xl border border-ink bg-surface p-5 shadow-sm`, section headers `text-xs font-semibold uppercase tracking-wide text-text-secondary` |
| Threshold     | shadcn `Slider` `min 0 max 100 step 5`, default 0 (keyword scores average ~33 — a 70 floor would hide everything), "Min match: {n}%" + Ghost "Reset" |
| Location      | `w-full rounded-lg border border-ink bg-surface px-3 py-2 text-sm` `focus:ring-2 focus:ring-accent focus:ring-offset-2` |
| Salary pills  | 3-col grid `Any / $100k+ / $150k+`, `Button size sm` `rounded-full`, active `default` variant |
| Job-type pills| All / Full-Time / Remote / Contract, clicking the active pill toggles back to `all` |
| FeedHero      | `overflow-hidden rounded-2xl border border-ink bg-gradient-to-br from-lavender via-lavender-soft to-peach p-6 shadow-sm sm:p-8` — `h1` "Find your match", pill search input, ink submit `Button rounded-full px-6` |
| ResultsBar    | `h2 text-sm font-semibold text-text-darkest` "Available Positions ({count})" + quick pills All / Remote / Full Time / $150k+; toggling an active pill off resets the dimension (job type → `all`, salary → `0`) |
| JobGrid       | `grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3`; empty state has `SearchX` icon + "Clear filters" button |

**Pattern notes:**
- Match badges on cards live in a colored pill chosen by `getMatchBadgeVariant`
  (green ≥70 / info 60–69 / warning <60 / secondary on null) — the wireframe's
  "green 88% Match" is the ≥70 case, not the default.
- The hero search is a *live discovery run* (`/api/agent/find`); the navbar
  search is the *instant filter*. Both are documented here so they are not
  conflated later.

### JobCard + JobDetailPanel

Files: components/dashboard/{JobCard,JobDetailPanel}.tsx
Last updated: 2026-10-06

| Property       | Class |
| -------------- | ----- |
| Card shell     | `Card` `gap-0 overflow-hidden rounded-2xl border-ink py-0 shadow-sm`; selected `ring-2 ring-accent ring-offset-2 ring-offset-surface`, idle `hover:-translate-y-0.5 hover:shadow-md` |
| Card header    | company-initials square `h-8 w-8 rounded-lg bg-accent-muted text-xs font-bold text-accent`, company name + `formatDate(found_at)` |
| Card chips     | `inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary` with `MapPin`/`DollarSign` at `h-3 w-3` |
| Card footer    | `flex items-center gap-2 border-t border-ink/10 pt-3` — "View details" → `/find-jobs/{id}` and "Apply" (external, `target="_blank"`) as `Button size sm variant outline flex-1` |
| Panel shell    | `overflow-hidden rounded-2xl border border-ink bg-surface shadow-sm xl:sticky xl:top-[5.5rem] xl:max-h-[calc(100vh-7rem)]`; content scrolls via `ScrollArea className="xl:h-[calc(100vh-7rem)]"` |
| Panel header   | company box `h-10 w-10 rounded-xl bg-accent-muted text-sm font-bold text-accent`, company + title, match `Badge` right |
| Actions        | [Tailor Resume PDF] = `Button disabled justify-between` with "Coming soon"; [Research Company] = `ResearchCompanyButton` wrapped in `[&_button]:w-full`; [Apply via Source] = external link button, falling back to a Jobbers detail link when `external_apply_url` is missing |

**Pattern notes:**
- The card is **not** wrapped in a `<button>` (the nested links would be
  invalid HTML); only the header/title/chips region is the interactive select
  region, and the footer links sit outside it.
- The panel reuses `MatchScore` (match reasoning + matched/missing skill
  pills) and `CompanyResearch` with `showResearchButton={false}` — the
  Actions row owns the research action in the dashboard, avoiding a duplicate.
- Auto-selects the top scored job on first load so the panel never renders the
  "No job selected" empty state unless the feed is genuinely empty.

### shadcn/radix dependencies

Installed for the workspace (all pinned in `package.json`, locked in the
lockfile): `class-variance-authority`, `clsx`, `tailwind-merge`,
`@radix-ui/react-dialog`, `@radix-ui/react-slider`,
`@radix-ui/react-scroll-area`, `@radix-ui/react-slot`. `cn` + `getInitials`
live in `lib/utils.ts`. No other radix primitives were added (menus, dropdowns
etc. are hand-rolled in the workspace components to avoid dragging in more).

---

### Inventory page

File: app/inventory/page.tsx (server) + components/inventory/InventoryClient.tsx (client)
Last updated: 2026-10-06

| Property | Class |
| -------- | ----- |
| Cards    | current app language — `rounded-2xl border border-border bg-surface p-5 shadow-card` |
| Card header | company-initials `h-9 w-9 rounded-full bg-accent-muted text-xs font-bold text-accent` + name + `formatDate`, match `Badge` |
| Title    | `text-base font-semibold leading-6 text-text-primary hover:text-accent` link to `/find-jobs/{id}` |
| Status   | `Badge variant="success"` "Researched" / `variant="secondary"` "Not researched", `variant="info"` "Tailored" |
| Footer   | `mt-auto flex items-center gap-2 border-t border-border pt-3` — View details + Apply (external) `Button size sm variant outline flex-1` |
| Controls | search input (`rounded-lg border border-border bg-surface` + `Search` icon) + status pills (All / Researched / Not researched / High match (70%+)) |
| Empty    | `SearchX` icon shell + copy; no-jobs variant shows a "Search for jobs" → `/dashboard` button |

**Pattern notes:**
Server fetches up to 500 jobs (`found_at desc`) and lets the client filter
with the shared `matchesQuery` from `lib/dashboard-filters.ts` plus a local
status predicate. High match uses `MATCH_THRESHOLD` from `lib/utils.ts`.

---

### AI Resume page

File: app/ai-resume/page.tsx (server) + components/ai-resume/AiResumeClient.tsx (client)
Last updated: 2026-10-06

`AiResumeClient` composes the existing `ResumeSection` (upload → Gemini
extract, `existingResumeUrl={profile.resume_pdf_url}`) with the shared
`ExtractedReviewDialog`, wiring `ResumeSection.onExtracted` → open the review
dialog → `router.refresh()` after apply. A second card promotes the coming-soon
Tailor-a-resume-for-a-role flow with `.btn btn-primary`-style "Find a role"
→ `/dashboard`. Uses the current app language throughout.

---

### Company Research page

File: app/company-research/page.tsx (server)
Last updated: 2026-10-06

| Property      | Class |
| ------------- | ----- |
| Dossier cards | `rounded-2xl border border-border bg-surface p-5 shadow-card`; `Badge variant="success"` "Researched"; overview excerpt `line-clamp-3 text-sm leading-6 text-text-secondary`; "Open dossier" `text-accent hover:text-accent-dark` link |
| Run lane      | per-job row `rounded-2xl border border-border bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between` with `FileText` icon + `ResearchCompanyButton` (shrinks on `sm`) |

**Pattern notes:**
Two server-side partitions of the same jobs query: saved dossiers
(`company_research IS NOT NULL`) vs. a run-a-pass lane (`IS NULL`). The page is
server-rendered; `ResearchCompanyButton` handles its own client state +
`router.refresh()`. Fully researched shows "Every saved company has been
researched. 🎉".

---

### Applications page

File: app/applications/page.tsx (server)
Last updated: 2026-10-06

Honest placeholder — tracking ships with the Phase E auto-apply scope. A card
explains the plan and links to `/inventory` ("Ready to apply") and
`/find-jobs` ("Find more roles") as `group` hoverable cards
(`rounded-2xl border border-border bg-surface p-5 hover:border-accent` with an
`ArrowRight` that nudges `group-hover:translate-x-0.5`).

---

| Property        | Value                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| Font            | Mona Sans via `next/font/google` in `app/layout.tsx` (variable `--font-sans`) |
| Logo            | `JobbersIcon` sunburst in `components/homepage/Logos.tsx` (inline SVG)  |
| Brand purple    | `var(--color-accent)`; ink `var(--color-ink)`; dark surface `var(--color-inverse)` |
| Container       | `max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8`                          |
| Buttons         | `.btn` + `.btn-primary` / `.btn-secondary` / `.btn-sm` (min-height 3rem) |
| Scroll          | `html { scroll-behavior: smooth }` + `prefers-reduced-motion` fallback    |
| Anchor offset   | `[id] { scroll-margin-top: 5.5rem }` for the sticky navbar              |

**Pattern notes:**
Nine landing sections compose in `app/page.tsx`; all are Server Components except `LandingNavbar` and `LiveOpportunities`. The marketing navbar and footer are deliberately separate from `components/layout/Navbar.tsx` and `components/layout/Footer.tsx`, which stay auth-aware for dashboard/profile/jobs pages. Section cards use `rounded-[28px]` with a `bg-gradient-to-t from-scrim/85 via-scrim/35 to-transparent` scrim over `next/image` portraits via a `z-0` absolute wrapper plus `z-10` figcaption. Social icons are inline brand SVGs using `fill="currentColor"` inheriting `text-accent-foreground` on `h-11 w-11 bg-ink` — lucide-react provides no brand glyphs. Every colour here is a token; see the sanctioned hex exceptions in `ui-rules.md` for the four files that are allowed literals.

## Landing Job Search (public)

| Property      | Value                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Section id    | `live-opportunities`                                                  |
| Client        | `LiveOpportunities` is `"use client"` (only section needing state)    |
| Hero copy     | pill badge **"Live Opportunities"** (Sparkles icon) → `h2` **"Find your next opportunity."** → subtitle "Browse thousands of roles matched to your profile – updated every 60 seconds from top companies worldwide." |
| Search bar    | full-width input row on top of the filter bar, same `rounded-[28px]` form card; placeholder "Search by title, skill or company" |
| Filter pills  | five local `FilterPill` dropdowns in spec order — **Job Categories** (options from `data.facets.categories`), **Countries** (static market list; scopes the search via the `country` param), **Salary Range** (`any`/`50k`/`100k`/`150k`), **Skills** (static terms, word-matched in title+description), **Employment Type** (`any`/`fulltime`/`parttime`/`contract`/`internship`) — plus the dark **Clear Filter** `.btn-primary` pinned far right (`ml-auto`, disabled while nothing is selected) |
| Pill behaviour | resting label = spec text; a selection turns the pill `bg-ink text-accent-foreground` and shows `label: value`; the menu is a `role="listbox"` with a check-marked option, closes on select / outside click / Escape, and right-aligns when it would overflow the viewport edge (224 px guard) |
| Result header | `h3` **"Available Positions (Search Result: {count})"** (`totalCount.toLocaleString()`) with the spinner "Searching live roles…" or the rose error on the right |
| Grid size     | `PUBLIC_RESULTS_PER_PAGE` (`lib/public-jobs.ts`) = **9** cards per fetch → a clean 3×3 at `lg`; the rest of the matched set (48-result cap) is one click away behind "Browse all matched roles" → `/find-jobs`, which `proxy.ts` redirects to `/login?next=…` for anonymous visitors, so seeing more always means signing in first |
| Endpoint      | `GET /api/public/jobs?q=&filter=&category=&country=&salary=&skills=&employment=` — public, no auth, 5 min in-memory cache (key includes every facet param), multi-source via `searchAll` (JSearch → feeds → Adzuna fallback); response adds `data.facets.categories` |
| Legacy filter | `filter` = `all` / `remote` (JSearch `work_from_home` + remote flag/title/location post-filter) / `fulltime` (unknown type counts as full-time) / `salary150` (verified numeric min ≥ $150k, sorted by salary desc) still accepted server-side — the UI no longer sends it; the chips were replaced by the dropdowns |
| Debounce      | 350 ms on the search input; dropdown changes and Clear Filter fire immediately |
| Race guard    | monotonic `requestId` ref discards out-of-order responses            |
| Card pastels  | `PASTEL_BACKGROUNDS` 6-colour array indexed by result position        |
| Company mark  | `CompanyLogo` when known, else a 2-letter initials badge              |
| Gating        | every "View" button targets `/login` so a role cannot be opened anonymously |

**Pattern notes:**
`proxy.ts` matches only `/dashboard`, `/profile`, `/find-jobs`, so the landing page and `/api/public/jobs` stay reachable while every detail view stays gated. The endpoint is intentionally separate from the auth-gated `/api/jobs`, which scopes to `user_id` and returns the signed-in user's saved matches. `PublicJob` lives in `types/index.ts` rather than the route file so client components can import it without pulling in route-module code. On mount the effect defers its fetch through `queueMicrotask` to satisfy `react-hooks/set-state-in-effect`; `fetchJobs` keeps a stable identity via a `filtersRef` so the seed effect never refires when a dropdown changes. Since plan A7 the response also carries `data.sources[]` (sources of the rendered cards) and the section renders a `SourceCredits` line under the grid; cards default-sort by `postedAt` desc to mix sources, `PublicJob.id` is `source:externalId`, and an all-sources-failed run — not a missing Adzuna key — is what returns 502. The five dropdowns post-filter server-side, so `totalCount` always matches what the grid could show; `data.facets.categories` is computed *before* the category filter so the Job Categories dropdown never collapses to its own selection, and `country` both scopes `searchAll` (JSearch embeds the location in its query, Adzuna gets its market country, feeds ignore it) and post-filters via `matchesPublicCountry` — remote/unresolvable locations pass, clear other-country locations drop. Skill/category param sanitisation lives in `lib/public-jobs.ts` (`sanitizePublic*`, 5 terms × 40 chars / 80 chars) so an unauthenticated param never flows raw into a filter or cache key.
