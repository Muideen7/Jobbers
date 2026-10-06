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
The research card preserves the Feature 12 card shell and header, then swaps between an empty state with a client action and a dense read-only dossier. The client action lives in its own component, uses plain `fetch` plus `useTransition`, and calls `router.refresh()` after the API saves research. Dossier sections should stay compact, token-driven, and source-linked; do not add a refresh action unless Feature 13 scope changes.

---

### StatsBar

File: components/dashboard/StatsBar.tsx
Last updated: 2026-06-05

| Property         | Class                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Background       | `bg-surface`                                                                          |
| Border           | `border border-border`                                                                |
| Border radius    | `rounded-2xl`                                                                         |
| Text — primary   | `text-3xl font-semibold leading-9 text-text-primary` stat value                       |
| Text — secondary | `text-sm font-medium text-text-secondary` label; `text-xs text-text-muted` sub-label  |
| Spacing          | `p-6` card, `mt-2` between value and trend row, `gap-2` trend row                    |
| Trend badge      | `rounded-sm bg-success-lightest px-2 py-0.5 text-xs font-medium text-success-darker` |
| Shadow           | `shadow-card`                                                                         |

**Pattern notes:**
Four cards in a responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`). Trend badge only renders when a `trend` string is present. Badge uses `TrendingUp` lucide icon at `h-3 w-3`.

---

### RecentActivity

File: components/dashboard/RecentActivity.tsx
Last updated: 2026-06-05

| Property         | Class                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Background       | `bg-surface`                                                                          |
| Border           | `border border-border`                                                                |
| Border radius    | `rounded-2xl`                                                                         |
| Text — primary   | `text-sm font-medium leading-5 text-text-primary` activity text                       |
| Text — secondary | `text-xs text-text-muted` timestamp                                                   |
| Spacing          | `p-6` card, `mt-5 space-y-5` list, `gap-3` item row                                  |
| Shadow           | `shadow-card`                                                                         |
| Dot — job_found  | outer `h-4 w-4 rounded-full bg-success-light`, inner `h-2 w-2 rounded-full bg-success-alt` |
| Dot — researched | outer `h-4 w-4 rounded-full bg-info-light`, inner `h-2 w-2 rounded-full bg-info`     |

**Pattern notes:**
Activity dots use inline `style` with CSS variables for the exact token colors (success-light/success-alt, info-light/info) since Tailwind v4 generates classes from these tokens but the dot outer ring needs the `background` shorthand. `mt-0.5` on the dot aligns it with the first line of multi-line activity text.

---

### Analytics Charts

File: components/dashboard/AnalyticsCharts.tsx
Last updated: 2026-06-05

| Property      | Value                                                                           |
| ------------- | ------------------------------------------------------------------------------- |
| Library       | `recharts` — `BarChart`, `AreaChart`, `ResponsiveContainer`                     |
| Chart height  | `h-55` (220px) container, `ResponsiveContainer width="100%" height="100%"`      |
| Grid lines    | `vertical={false}`, `stroke="var(--color-border)"`, `strokeDasharray="4 4"`    |
| Axis labels   | `fill: "var(--color-chart-axis)"`, `fontSize: 12`, `axisLine={false}`, `tickLine={false}` |
| Tooltip       | `borderRadius: 8`, `border: "1px solid var(--color-border)"`, `fontSize: 12`   |
| Research bars | `fill="var(--color-info)"`, `radius={[4,4,0,0]}`, `maxBarSize={40}`             |
| Jobs area     | `stroke="var(--color-accent)"`, `strokeWidth={3}`, gradient fill id `jobsGradient` (opacity 0.2→0) |
| Match bars    | `fill="var(--color-success)"`, `radius={[4,4,0,0]}`, `maxBarSize={60}`          |
| Card shell    | `rounded-2xl border border-border bg-surface p-6 shadow-card`                  |

**Pattern notes:**
Three named exports from one file — `CompanyResearchChart`, `JobsOverTimeChart`, `MatchDistributionChart`. All are `"use client"` (recharts needs browser). Colors use CSS variable references (`var(--color-*)`) so they stay token-driven inside recharts props. Left margin is `left: -20` on all charts to trim excess YAxis whitespace. Area gradient defined in `<defs>` with id `jobsGradient`.

## Jobbers Marketing Shell

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
Nine landing sections compose in `app/page.tsx`; all are Server Components except `LandingNavbar`. The marketing navbar and footer are deliberately separate from `components/layout/Navbar.tsx` and `components/layout/Footer.tsx`, which stay auth-aware for dashboard/profile/jobs pages. Section cards use `rounded-[28px]` with a `bg-gradient-to-t from-scrim/85 via-scrim/35 to-transparent` scrim over `next/image` portraits via a `z-0` absolute wrapper plus `z-10` figcaption. Social icons are inline brand SVGs using `fill="currentColor"` inheriting `text-accent-foreground` on `h-11 w-11 bg-ink` — lucide-react provides no brand glyphs. Every colour here is a token; see the sanctioned hex exceptions in `ui-rules.md` for the four files that are allowed literals.

## Landing Job Search (public)

| Property      | Value                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Section id    | `live-opportunities`                                                  |
| Client        | `LiveOpportunities` is `"use client"` (only section needing state)    |
| Endpoint      | `GET /api/public/jobs?q=&filter=` — public, no auth, 5 min in-memory cache, multi-source via `searchAll` (JSearch → feeds → Adzuna fallback) |
| Filters       | `all` / `remote` (JSearch `work_from_home` + remote flag/title/location post-filter) / `fulltime` (unknown type counts as full-time) / `salary150` (verified numeric min ≥ $150k, sorted by salary desc) |
| Debounce      | 350 ms on the search input; filter chips fire immediately            |
| Race guard    | monotonic `requestId` ref discards out-of-order responses            |
| Card pastels  | `PASTEL_BACKGROUNDS` 6-colour array indexed by result position        |
| Company mark  | `CompanyLogo` when known, else a 2-letter initials badge              |
| Gating        | every "View" button targets `/login` so a role cannot be opened anonymously |

**Pattern notes:**
`proxy.ts` matches only `/dashboard`, `/profile`, `/find-jobs`, so the landing page and `/api/public/jobs` stay reachable while every detail view stays gated. The endpoint is intentionally separate from the auth-gated `/api/jobs`, which scopes to `user_id` and returns the signed-in user's saved matches. `PublicJob` lives in `types/index.ts` rather than the route file so client components can import it without pulling in route-module code. On mount the effect defers its fetch through `queueMicrotask` to satisfy `react-hooks/set-state-in-effect`. Since plan A7 the response also carries `data.sources[]` (sources of the rendered cards) and the section renders a `SourceCredits` line under the grid; cards default-sort by `postedAt` desc to mix sources, `PublicJob.id` is `source:externalId`, and an all-sources-failed run — not a missing Adzuna key — is what returns 502.
