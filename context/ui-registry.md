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

### Shared StatCard

File: components/shared/StatCard.tsx
Last updated: 2026-10-08

| Property         | Class / Rule                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Background       | Rotating pastel palette (`bg-pastel-blue`, `bg-pastel-mint`, `bg-pastel-pink`, `bg-pastel-lilac`, `bg-pastel-cream`, `bg-pastel-aqua`) |
| Border           | `border border-ink/[0.04]`                                                                             |
| Border radius    | `rounded-[28px]`                                                                                       |
| Text — primary   | `text-2xl sm:text-3xl font-bold text-text-primary`                                                      |
| Text — secondary | `text-xs font-semibold uppercase tracking-wide text-text-secondary` label, `text-xs text-text-muted` subtitle |
| Spacing          | `p-5 sm:p-6`                                                                                           |
| Icon Squircle    | `flex h-7 w-7 items-center justify-center rounded-lg bg-surface/70` with `h-3.5 w-3.5` glyph           |

**Pattern notes:**
Standardized metric summary card reused across Dashboard overview (`DashboardClient.tsx`) and Application Pipeline tracker (`ApplicationsPageClient.tsx`). Accepts `title`, `value`, `subtitle`, `icon`, `iconClassName`, and optional `index` for automatic pastel background assignment.

### Applications Tracker Stage Colors

File: components/applications/ApplicationsPageClient.tsx
Last updated: 2026-10-08

| Stage | Top Card / Header Icon Pill | Badge / Label | Job Card Background & Border |
| --- | --- | --- | --- |
| **Saved** | `bg-pastel-blue` + `text-info-medium` | `bg-surface text-info-medium border-border` | `bg-pastel-blue border-info-light hover:border-info-medium/60` |
| **Applied** | `bg-pastel-mint` + `text-success-dark` | `bg-surface text-success-dark border-border` | `bg-pastel-mint border-success-light hover:border-success/60` |
| **Interview** | `bg-pastel-pink` + `text-rose-strong` | `bg-surface text-rose-strong border-border` | `bg-pastel-pink border-rose-soft hover:border-rose/60` |
| **Offer** | `bg-pastel-lilac` + `text-accent-dark` | `bg-surface text-accent-dark border-border` | `bg-pastel-lilac border-lavender hover:border-accent/60` |

**Pattern notes:**
Visual hierarchy and stage differentiation in `/applications` map directly to the 4 pastel tokens (`bg-pastel-blue`, `bg-pastel-mint`, `bg-pastel-pink`, `bg-pastel-lilac`), matching top stat cards with section header icons, and full background tint on each job card in the stage.

**Dark mode — shared pastel tokens (DRY):** these colour-coded surfaces use the same `bg-pastel-*` tokens as the shared `StatCard`, so dark mode is driven entirely by the `.dark` pastel overrides in `app/globals.css` — the hue share (blue 38 / mint 36 / pink 36 / lilac 40 / cream 30 / aqua 34% over `--color-inverse`) makes them noticeably more saturated than the light tint while staying clearly pastel, not standard colours. Do **not** special-case this page (e.g. a per-page "keep light" scope); any colour change must come from the shared token so the dashboard `StatCard`s and the tracker stay in lock-step.

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

File: app/find-jobs/[id]/page.tsx (shell) + components/job-details/*.tsx (cards)
Last updated: 2026-10-07

| Property         | Class                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Page shell       | `mx-auto w-full max-w-[1200px] px-4 pb-12 pt-6 sm:px-6 lg:px-8`                       |
| Layout           | `grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start` — description (`lg:col-span-2`, `lg:order-1`) beside the match/apply rail (`lg:col-span-1`, `lg:order-2`) |
| Cards            | `rounded-2xl border border-border bg-surface p-6 shadow-card` in `JobInfo`/`JobDescription`/`MatchReasonCard`/`SkillMatchCard`; the rail's "Ready to apply" `<section>` uses the same shell |
| Header icon      | `flex h-14 w-14 ... rounded-2xl border border-border bg-surface-secondary`; info icons use `h-10 w-10 rounded-xl` with token backgrounds |
| Text — primary   | Page title `text-2xl font-semibold leading-8 text-text-primary`; card headings `text-base font-semibold leading-6 text-text-primary` |
| Text — secondary | Section eyebrows `text-xs font-semibold uppercase leading-4 tracking-wide text-text-secondary`; labels `text-xs font-medium uppercase leading-4 tracking-wide text-text-muted` |
| Buttons          | Apply CTA `btn btn-primary w-full whitespace-nowrap`; dossier link `btn btn-secondary w-full whitespace-nowrap`; research `ResearchCompanyButton fullWidth` |
| Badges           | Match score `getMatchBadgeVariant(match_score)`; matched skills `bg-success-lightest text-success-foreground`; gap skills `bg-accent-muted text-accent` |

**Pattern notes:**
This page is **job-only** — JobActions, JobInfo, `MatchReasonCard`, `SkillMatchCard`, the "Ready to apply" card (Research Company + Apply Now, plus a "View company dossier" link once researched) and the description. It must **not** render company-research content; that lives on the dossier page. `MatchReasonCard` + `SkillMatchCard` replaced the old combined `MatchScore` export. The description renders scraped HTML as semantic blocks via `lib/job-description.ts` (`parseJobDescriptionHtml`) — never `dangerouslySetInnerHTML`. `proxy.ts` gates `/find-jobs`, so `requireUser()` is defence in depth.

---

### Dossiers (list + detail)

> ⚠️ **Legacy (Prompt 3).** The list no longer renders: `/dossiers` →
> 308 `/jobs?tab=all&researched=1` and `/dossiers/:id` → 308
> `/jobs/:id?tab=company`. The page files stay on disk until Prompt 10.
> `YourEdgeCard` / `GapsToAddressCard` are still consumed by Prompt 5 scope.

Files: app/(workspace)/dossiers/page.tsx, app/(workspace)/dossiers/[id]/page.tsx
Last updated: 2026-10-07

| Property         | Class                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| List grid        | `grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`; each dossier is a `rounded-2xl border border-border bg-surface p-5 shadow-card` card with `hover:-translate-y-0.5 hover:border-border-muted hover:shadow-md` |
| List header      | `text-2xl font-bold tracking-tight text-text-primary` + `text-sm leading-6 text-text-secondary` |
| Detail header    | `rounded-2xl border border-border bg-surface p-6 shadow-card`; company mark `h-14 w-14 rounded-2xl border border-border bg-accent-muted text-accent` |
| Detail layout    | `grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start` — rail (`lg:order-2`) = Ready to apply → `YourEdgeCard` → `GapsToAddressCard`; main (`lg:order-1`) = `CompanyResearch` |
| Buttons          | "View role" `btn btn-secondary`; "Apply Now" `btn btn-primary`; back link `inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary` |

**Pattern notes:**
The Dossiers list shows only jobs with `company_research !== null` (ordered by `match_score` desc) and links each card to `/dossiers/[id]`. The detail page owns everything that is *research + the candidate's own data* (edge, gaps, smart questions, interview prep) — so it is deliberately different from `/find-jobs/[id]`. `YourEdgeCard` and `GapsToAddressCard` are exported from `components/job-details/CompanyResearch.tsx` (and removed from that component's own grid) so the rail can sit them directly under "Ready to apply". The dossier detail renders the full `CompanyResearch` grid when research exists and an empty state with `ResearchCompanyButton` when it does not.

---

### Research queue

> ⚠️ **Legacy (Prompt 3).** `/company-research` → 308 `/jobs?tab=all`. The
> queue's "unresearched" concept is not carried over — `/jobs?tab=all` is the
> redirect target Prompt 1 chose. Page files stay on disk until Prompt 10.

File: app/(workspace)/company-research/page.tsx + components/company-research/ResearchQueue.tsx
Last updated: 2026-10-07

| Property         | Class                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Grid             | `grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`; card shell identical to the Dossiers card |
| Viewed chip      | `inline-flex items-center gap-1.5 self-start rounded-full bg-surface-secondary px-2.5 py-1 text-[11px] font-medium text-text-secondary` with `Eye` icon |
| Loading skeleton | `h-44 animate-pulse rounded-2xl border border-border bg-surface-secondary/40` × 3 |
| Empty state      | `rounded-2xl border border-border bg-surface p-6 text-center shadow-card` with `bg-accent-muted` `SearchX` badge linking to `/find-jobs` |

**Pattern notes:**
The server page fetches the user's jobs with `.is("company_research", null)` and hands them to the client `<ResearchQueue>`, which intersects them with `getRecentlyViewedIds()` (localStorage, max 20) so it lists only roles the user opened but has not researched. localStorage is read through `useSyncExternalStore` (cached snapshot keyed by serialized ids) to satisfy `react-hooks/set-state-in-effect`; the server snapshot is `null` so the skeleton shows until hydration. The sidebar exposes both **Research** (`/company-research`, `Building2`) and **Dossiers** (`/dossiers`, `NotebookText`).

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
The research card preserves the Feature 12 card shell and header, then swaps between an empty state with a client action and a dense read-only dossier. The client action lives in its own component, uses plain `fetch` plus `useTransition`, and calls `router.refresh()` after the API saves research. Dossier sections should stay compact, token-driven, and source-linked; do not add a refresh action unless Feature 13 scope changes. Since the dashboard rebuild the component accepts `showResearchButton?: boolean` (default `true`): the standalone find-jobs page keeps the in-card research action, but the dashboard's right-hand panel passes `showResearchButton={false}` so the panel's own Actions row owns it — never render two research buttons for the same job. The card grid deliberately excludes **Your Edge** and **Gaps to Address**; those are exported as standalone `YourEdgeCard` / `GapsToAddressCard` so the dossier page can place them in its rail under "Ready to apply".

---

### shadcn/ui Primitives (Jobbers-mapped)

Files: components/ui/{button,badge,card,slider,scroll-area,dialog,toast,confirm-dialog}.tsx
Last updated: 2026-10-07 (Prompt 3 added `toast` + `confirm-dialog`)

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
- **Toast** (`components/ui/toast.tsx`): `fixed inset-x-0 bottom-0 z-[60]
  flex justify-center px-4 pb-4 sm:justify-end sm:px-6 sm:pb-6` wrapper with
  `pointer-events-none`, inner `pointer-events-auto flex w-full max-w-sm
  items-start gap-3 rounded-2xl border border-ink bg-surface px-4 py-3
  shadow-card`; `role="alert"` for `tone="error"` (default) and `role="status"`
  for success; `AlertTriangle text-error` / `text-success-dark`; auto-dismiss
  after `durationMs` (6000 default, `0` = sticky) via a `setTimeout` **inside**
  the callback so `react-hooks/set-state-in-effect` stays happy. `onDismiss`
  must be a `useCallback` — the timer re-arms on every render otherwise.
  Currently the only consumer is `FindJobsClient`'s save/unsave rollback.
- **ConfirmDialog** (`components/ui/confirm-dialog.tsx`): `Dialog` + `DialogHeader`
  /`Footer` with `DialogClose asChild` on **Keep it** and a destructive
  `Button` for the confirm; `tone="destructive"` swaps `default`→`destructive`
  variants. It closes itself (`onOpenChange(false)`) *before* firing
  `onConfirm`, so the parent's `onConfirm` closure still sees the state from
  the render in which the dialog opened. Chosen over `window.confirm` because
  the native one renders outside the design system and cannot be styled for
  mobile. Used by the card's un-save-past-`saved` flow.
- These primitives are `"use client"`-free for pure presentational ones;
  components that need state or radix interactivity are marked client. They
  deliberately live alongside — not instead of — the `.btn` system: `.btn
  btn-primary` remains the primary button language everywhere else.

---

### AppShell (global workspace shell)

File: components/layout/AppShell.tsx
Last updated: 2026-10-08

| Property        | Class |
| --------------- | ----- |
| Shell           | `min-h-screen bg-surface` (matches the landing page's white canvas) |
| Sidebar         | fixed left rail from **`lg`** (`lg:flex` / `lg:w-[240px]`, collapsed `lg:w-[72px]`), `border-r border-border bg-surface`; below `lg` it becomes a slide-in drawer |
| Sidebar header  | `h-16 border-b border-border`; expanded shows `Logo` + `PanelLeftClose`; collapsed centres just the `PanelLeftOpen` toggle |
| Nav groups      | **Workspace** (Home, Jobs, Applications), **Tools** (Resumes, Analytics, Research), **Account** (Profile). Group labels `text-[10px] font-bold uppercase tracking-widest text-text-muted` |
| Nav item        | `rounded-lg px-3 py-2.5 text-sm font-medium`, active `bg-accent-light text-accent shadow-xs` + `aria-current="page"`, idle `text-text-secondary hover:bg-surface-secondary hover:text-text-primary`; icon `h-5 w-5` |
| Nav badge       | `ml-auto rounded-full bg-accent px-1.5 text-[10px] font-bold leading-4 text-accent-foreground`; hidden at 0, `99+` above 99, a `h-1.5 w-1.5 rounded-full bg-accent` dot when collapsed; skeletons `bg-muted` while loading |
| Applications sub-nav | indented `border-l border-border pl-3` list of Saved/Applied/Interview/Offer, shown only while `pathname === "/applications"`; count `text-xs font-semibold text-text-muted` |
| Pro upgrade CTA | gradient card `rounded-2xl border border-border bg-gradient-to-br from-accent-muted to-surface-secondary` with an `<Button size="sm">` |
| Settings action | `flex w-full items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold` anchored directly below Upgrade Pro at bottom |
| Sidebar footer  | Direct sign out link via `PostHogLogoutLink` with `LogOut` icon. Collapsed shows icon only |
| Top bar         | `sticky top-0 z-20 h-16 border-b border-border bg-surface/90 backdrop-blur`; hamburger + logo below `lg`, search `max-w-md` from `lg`, then **ThemeToggler → notification bell → account avatar** in that order. Search submits to `/jobs?q=<query>` |

**Pattern notes:**
- **Global shell**: every workspace page lives under `app/(workspace)/` whose
  `layout.tsx` renders `PostHogIdentify` + `<Suspense><AppShell><user>>`.
  `requireUser()` + the profile fetch for nav identity live in the layout only;
  pages render content and never their own nav. Pages must use a `<div>` content
  wrapper (AppShell already provides `<main>`).
- **Collapse is an external store**: `useSyncExternalStore` over a
  `jobbers.sidebarCollapsed` localStorage key + same-tab custom event — no
  mount-effect `setState` (which the React compiler lint rule forbids).
- **Sidebar data**: `useSidebarSummary()` fetches `/api/sidebar-summary`
  (badges, Coming up, onboarding) on mount, on window focus and every 60 s.
  Before it resolves, badges and Coming up render skeletons — never fake numbers.
  Since Prompt 2 the payload is **real**: stage counts and `dueCount` come from
  the `applications` table, `comingUp` is the next 3 interviews/follow-ups
  (overdue first, dates through `formatRelativeDay`), and `newMatches` counts
  jobs above `NEW_MATCH_SCORE_THRESHOLD` found after
  `profiles.last_jobs_visit_at` (cleared by `POST /api/sidebar-summary/visit`).
- **Search syncs with `?q=`**: top-bar search submits to `/jobs?q=<query>`
  (`/home` used to be the destination).
- **Route map (Prompt 1)**: `/home`, `/jobs`, `/applications`, `/resumes`,
  `/profile`. Legacy routes redirect 308 to these; the five former placeholder
  routes and `ComingSoonPage` were deleted.

---

### ThemeToggler

File: components/layout/ThemeToggler.tsx
Last updated: 2026-10-08

| Property        | Class |
| --------------- | ----- |
| Trigger         | `rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary`, icon `h-5 w-5` (Sun when light, Moon when dark) |
| Menu            | `absolute right-0 z-30 mt-2 w-48 rounded-xl border border-border bg-surface p-1 shadow-card` — identical shell to the bell/avatar menus |
| Menu label      | `px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-text-muted` ("Theme" + check-marked items) |
| Menu item       | `role="menuitemradio"`, `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm`, active `text-accent` + trailing `Check text-accent`, idle `text-text-secondary hover:bg-surface-secondary hover:text-text-primary`; icon `h-4 w-4 shrink-0` |
| Close           | backdrop `fixed inset-0 z-20` overlay, Escape key handler while open |
| Accessibility   | Trigger `aria-label="Theme" aria-haspopup="menu" aria-expanded`; items `aria-checked` |

**Pattern notes:**
- The three options are **Light / Dark / System default** (`Sun` / `Moon` /
  `Monitor`). "System default" follows the OS via `matchMedia("(prefers-color-scheme:
  dark)")` and re-renders live when the OS switches while it is selected.
- Rendered in `AppShell`'s top bar **directly before the notification bell**
  (search → ThemeToggler → bell → avatar), so it inherits the same `h-16`
  header and `rounded-lg p-2` icon-button language as the bell.
- **Same external-store pattern as the sidebar collapse**: `useSyncExternalStore`
  over the `jobbers.theme` localStorage key + `jobbers:theme` custom event,
  subscribed to `storage` (cross-tab) + the media query + the custom event.
  Preference is written in the click handler and the `<html>` class is mutated
  in an effect (`document.documentElement.classList.toggle("dark", resolved === "dark")`)
  — never a cascading render `setState`, so `react-hooks/set-state-in-effect`
  stays happy.
- The `.dark` class flips the whole token set via the unlayered `.dark { … }`
  block in `app/globals.css` — the component owns **no** colors of its own.
  See `context/ui-tokens.md` → "Dark mode" for the palette (cards are the
  footer's `--color-inverse` family).

---

### ResumeDropzone + ExtractedReviewDialog

Files: components/dashboard/ResumeDropzone.tsx, components/dashboard/ExtractedReviewDialog.tsx
Last updated: 2026-10-06

| Property | Class |
| -------- | ----- |
| Dropzone  | `group relative flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed p-3.5 text-center` — idle `border-border bg-surface-secondary/40`, dragging `border-accent bg-accent-muted ring-2 ring-accent/20` |
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
- Designed as a compact, horizontal card in the sidebar to avoid pushing down filters.

---

### Dashboard workspace page

File: app/(workspace)/dashboard/page.tsx
Last updated: 2026-10-07

| Property   | Class |
| ---------- | ----- |
| Shell      | `mx-auto w-full max-w-[1440px] flex flex-col gap-6 px-4 pb-12 pt-6 sm:px-6 lg:px-8` — chrome (sidebar/top bar) comes entirely from `app/(workspace)/layout.tsx` |

**Pattern notes:**
- Server component fetches top-100 jobs `match_score desc nullsFirst:false`
  and the profile (completion banner + greeting), then renders optional
  `ProfileAttentionBanner` + `DashboardClient`. Auth + PostHog identity + nav
  identity are handled by the `(workspace)` layout. No `searchParams` here —
  AppShell's search submits to `/find-jobs`.

### DashboardClient (executive workspace overview)

File: components/dashboard/DashboardClient.tsx
Last updated: 2026-10-07

| Property        | Class |
| --------------- | ----- |
| Shell           | `max-w-[1440px] flex flex-col gap-8` |
| Stats           | 4 metric cards (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5`) with `mb-6` breathing room above the showcase: Total Roles, Avg Match Score, Highest Match, Researched Companies |
| Stats cards     | **pastel** `rounded-[28px] border border-ink/[0.04] p-5 sm:p-6` rotating the Live Opportunities palette (`bg-pastel-{blue,mint,pink,lilac,cream,aqua}` by index); icon chip `bg-surface/70` frosted |
| Job Showcase    | Strictly **at most 6 cards** (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5`) with interactive tabs: Top AI Matches, Recently Viewed, Applied / Saved; job cards use the same rotating pastel treatment |
| Quick Tools     | none on the dashboard — Find Jobs / AI Resume / Research / Profile live only in the sidebar (`AppShell` nav) |
| Persistence     | `lib/recent-jobs.ts` tracks viewed and applied job IDs in localStorage with SSR safety |
| Greeting        | `Welcome back, {getSurname(profileName)}` — surname only |

**Pattern notes:**
- The pastel palette matches the landing page's Live Opportunities cards, and
  the whole workspace shell is `bg-surface` (white) so the effect is identical
  to the landing page.
- Direct card actions: "Mark Applied" toggle button, "View Details" linking to
  `/find-jobs/[id]`, and external apply link.
- Redirects deep searching and full workspace filtering to `/find-jobs`.

---

### FindJobsClient (the merged /jobs surface)

File: components/find-jobs/FindJobsClient.tsx
Last updated: 2026-10-07 (Prompt 3 revamp)

| Property        | Class |
| --------------- | ----- |
| Shell           | `flex flex-col gap-6` inside the page's `max-w-[1600px] px-4 sm:px-6 lg:px-8` |
| Header          | `relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-lavender/40 via-surface to-peach-soft/30 p-5 sm:p-6 shadow-card` — `Live Job Discovery` pill, `h1` **Jobs**, dual-input live search (`POST /api/agent/find`), then the `searchMessage` strip (`rounded-xl border border-border/80 bg-surface/90`) |
| Tab bar         | `<JobTabs>` sits **below** the header card and **above** the filters row |
| Filter Sidebar  | `FilterSidebar` in `hidden xl:block` + the existing `<xl` slide-over drawer |
| Layout          | `grid grid-cols-1 gap-6 xl:grid-cols-[264px_minmax(0,1fr)] items-start` — no third preview column (the role detail is its own page) |
| Split / Grid    | one `JobGrid` with `layout={viewMode === "split" ? "single" : "grid"}`; single = `flex flex-col gap-3.5 xl:max-w-[75%]`, grid = `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4` |
| Results bar     | `heading` reads `Top matches` / `Available Roles` / `Saved roles` / `Researched roles`; `showSort={tab !== "for-you"}` |
| Attribution     | `SourceCredits` renders only when `resolveSourceCredits(...)` is non-empty (Saved can be all-manual and credit nothing) |

**Pattern notes:**
- **State split.** `?tab=` and `?researched=1` are resolved *server-side*;
  filters, sort, view mode, pagination and the search inputs are client state.
  Nothing mirrors a server prop into `useState`, so a tab switch can never
  leave the list showing the previous tab's rows.
- **Optimistic save.** `overrides: Record<jobId, ApplicationRef | null>` always
  beats the server-supplied `applications` map. `saveJob` writes an optimistic
  `{id:"", status:"saved"}` entry, `POST`s, and either replaces it with the real
  row or rolls back to the previous value + `setToast`. `unsaveJob` mirrors it
  with `DELETE`. `savingIds: ReadonlySet<jobId>` disables just the card in
  flight (an `id:""` placeholder can never be `DELETE`d because the button is
  disabled while it is in flight).
- `handleToggleSave` only opens `ConfirmDialog` when `status !== "saved"`;
  un-saving a plain `saved` row is one click.
- **STEP 3 ordering.** the mount effect `GET`s `/api/sidebar-summary` *then*
  `POST`s `/api/sidebar-summary/visit`, once per session
  (`sessionStorage["jobbers:jobs-visit-recorded"]`, with an in-flight ref so a
  failed write retries on the next mount). Read-before-write is what keeps the
  badge visible for the visit.
- **Two different empties.** `jobs.length === 0` (the tab itself is empty) gets
  a `FeedEmpty` with a tab-specific CTA; `orderedJobs.length === 0` after
  filters keeps `JobGrid`'s "No roles match your filters" + Clear all.
- `handleLiveDiscovery` calls `router.refresh()` inside `startTransition`
  instead of patching local state — the server component owns the feed.

### JobTabs + `lib/workspace/jobs-tab.ts`

Files: components/find-jobs/JobTabs.tsx, lib/workspace/jobs-tab.ts
Last updated: 2026-10-07 (Prompt 3 revamp)

| Property   | Class / value |
| ---------- | ------------- |
| Wrapper    | `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between` |
| Tab row    | `<nav aria-label="Job views" class="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5">` — one line at 320px, scrolls rather than wraps |
| Tab pill   | `rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all`; active `bg-ink text-accent-foreground shadow-xs`, idle `border border-border bg-surface text-text-secondary hover:border-border-muted hover:text-text-primary`; `focus-visible:outline-2 outline-offset-[3px] outline-accent`; `disabled:opacity-70` while `isPending` |
| Chip pill  | `inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-xs font-semibold` + `FlaskConical h-3.5 w-3.5`; active `bg-accent-light text-accent shadow-xs`, idle `border border-border bg-surface` |
| Vocabulary | `JOBS_TABS = ["for-you","all","saved"]`, `DEFAULT_JOBS_TAB = "for-you"` |

**Pattern notes:**
- Deliberately **not** `role="tablist"`/`role="tab"`: there is no `tabpanel`
  element to pair with them, and a tab with no panel is announced as dead.
  `<nav>` + `aria-current="page"` says what is actually true.
- `jobsTabQueryString()` drops the default tab, so `/jobs?tab=for-you` normalises
  to `/jobs`.
- **The tab strings are a redirect contract.** `next.config.ts` sends
  `/matches`→`?tab=for-you`, `/inventory`→`?tab=saved`,
  `/company-research`→`?tab=all`, `/dossiers`→`?tab=all&researched=1`.
  `tests/jobs-tab.test.ts` reads `next.config.ts` and fails if any of those
  destinations names a tab that no longer exists.

### FilterSidebar + ResultsBar + JobGrid

Files: components/dashboard/{FilterSidebar,ResultsBar,JobGrid}.tsx
(`FeedHero.tsx` still exists on disk but is no longer imported — its gradient
header shell lives inline in `FindJobsClient`; removal is Prompt 10 scope.)
Last updated: 2026-10-07 (Prompt 3 revamp)

| Property      | Class |
| ------------- | ----- |
| Sidebar cards | `rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-card`, consolidated into 1 Resume card + 1 unified Filters card with "Reset all" header affordance |
| Threshold     | shadcn `Slider` `min 0 max 100 step 5`, default 0, pill badge `≥ {minScore}%` / `Any` |
| Location      | `w-full rounded-xl border border-border bg-surface-secondary/40 py-2 pl-9 pr-8 text-xs` with MapPin icon and clear button |
| Salary pills  | 3-col grid `Any / $100k+ / $150k+`, rounded segment buttons with `bg-ink text-accent-foreground` when active |
| Job-type pills| All / Full-Time / Remote / Contract, rounded pill buttons with `bg-ink text-accent-foreground` when active |
| FeedHero      | `relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-lavender/40 via-surface to-peach-soft/30 p-4 sm:p-5 shadow-card` — compact discovery header with single-line search and spinner |
| ResultsBar    | `heading` slot (defaults to `Available Roles`; `/jobs` passes Top matches / Available Roles / Saved roles / Researched roles) + active filter tag dismiss pills + quick toggle pills (`bg-ink` when active) + optional `showSort` (For You hides the Newest/Oldest pills — its ranking is fixed by the server) + the view-mode switcher |
| JobGrid       | `grid grid-cols-1 gap-3.5 xl:grid-cols-2`; empty state has `SearchX` icon + "Clear all filters" button, **unless** an `emptyState` node is passed (the /jobs tabs use this for their tab-specific copy). Both layouts render the same `JobCard`. Props: `applications: Record<jobId, ApplicationRef>`, `savingIds: ReadonlySet<jobId>`, `onToggleSave` |

**Pattern notes:**
- Match badges on cards live in a colored pill chosen by `getMatchBadgeVariant`
  (green ≥70 / info 60–69 / warning <60 / secondary on null).
- Center feed grid is responsive 1–2 columns to prevent cramped text and awkward button wrapping in the 3-column layout.

### JobCard (the one /jobs list card) + JobDetailPanel (orphaned)

Files: components/dashboard/JobCard.tsx. `JobDetailPanel.tsx` remains on disk
but is no longer imported — the preview panel went away when `/jobs/[id]`
became a real page; removal is Prompt 10 scope.
Last updated: 2026-10-07 (Prompt 3 revamp)

| Property       | Class |
| -------------- | ----- |
| Card shell     | `group relative flex flex-col justify-between rounded-2xl border p-4 text-left shadow-card cursor-pointer`; selected `border-accent bg-accent-muted/15 ring-2 ring-accent/20`, idle `border-border bg-surface hover:border-border-muted hover:shadow-md hover:-translate-y-0.5` — **no `role="button"`** (see pattern notes) |
| Card header    | company avatar `h-8 w-8 rounded-xl bg-surface-secondary border border-border/60 text-xs font-bold text-text-primary`, company name + `formatDate(found_at)`, match `Badge` right (`getMatchBadgeVariant`; `Not scored` on null) |
| Title          | `h3 mt-2.5 text-sm sm:text-base font-semibold leading-snug line-clamp-1` + `group-hover:text-accent`; the `<Link href="/jobs/{id}">` inside it is the accessible route to the detail page and `stopPropagation`s so it does not double-navigate |
| Card chips     | `inline-flex items-center gap-1 rounded-full bg-surface-secondary/80 px-2 py-0.5 text-[11px] font-medium text-text-secondary` with `MapPin`/`DollarSign` at `h-3 w-3`; **Remote** = `bg-info-light text-info-medium` + `Wifi`; **Researched** = `bg-accent-muted text-accent` + `FlaskConical` |
| Skill chips    | `Top match` label + up to 2 `matched_skills` as `rounded-full bg-accent-light px-2 py-0.5 text-[11px] font-medium text-accent` |
| Card footer    | `mt-3.5 flex items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-xs` — status `Badge` + `sourceLabel · job_type` on the left; bookmark **Save** toggle + external `Apply` link on the right |
| Save toggle    | `inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold`; saved `border-accent bg-accent-light text-accent` with a `fill-current` bookmark, idle `border-border bg-surface text-text-secondary`; `aria-pressed`, disabled while in flight |
| Status variants| `saved`→`secondary`, `applied`→`info`, `interview`→`warning`, `offer`→`success`, `closed`→`outline` (`STATUS_LABEL` / `STATUS_VARIANT` maps in the card) |
| Panel shell    | `overflow-hidden rounded-2xl border border-border bg-surface shadow-card xl:sticky xl:top-[5.5rem] xl:max-h-[calc(100vh-7rem)] flex flex-col`; content scrolls via `ScrollArea className="xl:h-[calc(100vh-7rem)]"` |
| Panel header   | company avatar `h-11 w-11 rounded-xl bg-surface-secondary border border-border/80 text-sm font-bold text-text-primary`, role title, company name, match `Badge` right |
| Actions        | Quick apply row with [Apply via Source] primary button, [Full Details] link, and [Research Company] action |
| Panel sections | Native unified sections inside the panel without nested bulky cards: About The Role snippet, Gemini Match Analysis callout + matched/gap skill pills, Company Dossier overview, tech stack tags, culture, and candidate edge |

**Pattern notes:**
- **Card click vs card role.** The div keeps `onClick` for mouse users but no
  `role="button"` / `tabIndex` / `onKeyDown`: a button role marks its
  descendants presentational, which would hide the Save toggle and the apply
  link from screen readers. The title `<Link>` is the keyboard route in, and
  every control inside (`Link`, Save, external `Apply`) calls
  `e.stopPropagation()` so acting on a card control never navigates.
- `sourceLabel()` returns `SOURCE_ATTRIBUTION[source].label` and falls back to
  `Saved by you` for `source:"url"` and for `source:"manual"` rows (written by
  `POST /api/applications` but absent from the `JobSourceId` union).
- `isRemoteListing(job)` from `lib/dashboard-filters.ts` drives the Remote chip
  — there is no `remote` column, it is derived from title/location/job type.
- One card, three tabs: `JobGrid` supplies `application`, `isSaving` and
  `onToggleSave`, so no tab renders its own list component.
- *(Orphaned panel)* The panel avoided nested card borders and formatted match
  and company research natively for the 380px width, and auto-selected the top
  scored job so it was never empty — carried here for the day the preview
  panel is reintroduced.

### shadcn/radix dependencies

Installed for the workspace (all pinned in `package.json`, locked in the
lockfile): `class-variance-authority`, `clsx`, `tailwind-merge`,
`@radix-ui/react-dialog`, `@radix-ui/react-slider`,
`@radix-ui/react-scroll-area`, `@radix-ui/react-slot`. `cn` + `getInitials`
live in `lib/utils.ts`. No other radix primitives were added (menus, dropdowns
etc. are hand-rolled in the workspace components to avoid dragging in more).

---

### Inventory page

> ⚠️ **Legacy (Prompt 3).** `/inventory` → 308 `/jobs?tab=saved`. The Saved
> tab replaces it: same "every tracked role" idea, but driven by the
> `applications` rows rather than by scanning all jobs. The page file and
> `InventoryClient` stay on disk until Prompt 10.

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

### Applications Page

File: `app/(workspace)/applications/page.tsx` (server) & `components/applications/ApplicationsPageClient.tsx` (client)
Last updated: 2026-10-07

| Property | Class / Token |
| --- | --- |
| Header | `text-2xl font-bold tracking-tight text-text-primary` |
| Pipeline summary | 4-column metric grid `grid grid-cols-2 gap-3 sm:grid-cols-4`, card `rounded-2xl border border-border bg-surface p-4 shadow-card` |
| Stage headers | `flex items-center gap-2 border-b border-border pb-3`, `text-lg font-semibold text-text-primary`, stage count badge `rounded-full border border-border bg-surface-secondary px-2.5 py-0.5 text-xs font-semibold text-text-secondary` |
| Application cards | `rounded-2xl border border-border bg-surface p-5 shadow-card transition-colors hover:border-accent/50` |
| Stage selector | `<select>` `rounded-lg border border-border bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-primary focus:border-accent focus:outline-none` |
| Match badge | `rounded-full bg-accent-muted px-2 py-0.5 text-xs font-bold text-accent` |

---

### Tour Modal Component

File: `components/layout/TourModal.tsx`
Last updated: 2026-10-07

| Property | Class / Token |
| --- | --- |
| Backdrop | `fixed inset-0 bg-ink/50 backdrop-blur-sm` |
| Container | `w-full max-w-[600px] rounded-[32px] bg-gradient-to-b from-surface via-surface-tertiary to-surface-secondary/40 border border-border/80 shadow-2xl p-8 sm:p-12` |
| Icon squircle | `bg-ink text-surface shadow-lg rounded-2xl h-16 w-16` |
| Indicator dots | Active: `w-6 h-1.5 bg-ink rounded-full`; Inactive: `w-1.5 h-1.5 bg-border rounded-full` |
| Action button | `bg-ink hover:bg-ink-hover text-accent-foreground rounded-full px-6 py-2.5 shadow-md` ("Next →") |

---

### Pricing / Upgrade Modal Component

File: `components/layout/PricingModal.tsx`
Last updated: 2026-10-07

| Property | Class / Token |
| --- | --- |
| Backdrop | `fixed inset-0 bg-ink/60 backdrop-blur-md` |
| Container | `w-full max-w-5xl rounded-[32px] border border-border bg-surface p-6 sm:p-10 shadow-2xl` |
| Icon badge | `bg-gradient-to-br from-peach via-amber/20 to-lavender p-3 text-amber` |
| Billing toggle | `rounded-full border border-border bg-surface-secondary p-1` |
| Pro / Ultra card | `rounded-3xl border border-border bg-surface-tertiary/60 p-6 shadow-card` |
| Max card (primary) | `rounded-3xl border-2 border-accent bg-accent text-accent-foreground p-6 shadow-xl` |

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
