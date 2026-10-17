# Jobbers — AI Agent Briefing & Architecture Specification

> **Handover Notice**: This document is a complete briefing designed to be copied directly into another AI assistant (e.g., Claude, ChatGPT, Gemini, Cursor) to provide immediate context on what Jobbers does, its design system, typography, colors, layout rules, and codebase structure.

---

## 1. What Jobbers Does (Product Overview & Workflows)

**Jobbers** is a full-stack, AI-driven job hunting and career automation platform built for tech professionals.

### Core Capabilities & Workflows:
1. **Multi-Source Job Aggregation**:
   - Searches and aggregates live tech roles across 6+ providers: [Adzuna](file:///home/frontendgeek/Downloads/Project/Jobbers/lib/jobs/adzuna.ts), [Arbeitnow](file:///home/frontendgeek/Downloads/Project/Jobbers/lib/jobs/arbeitnow.ts), [RemoteOK](file:///home/frontendgeek/Downloads/Project/Jobbers/lib/jobs/remote-feeds.ts), [Remotive](file:///home/frontendgeek/Downloads/Project/Jobbers/lib/jobs/remote-feeds.ts), [Jobicy](file:///home/frontendgeek/Downloads/Project/Jobbers/lib/jobs/remote-feeds.ts), and [JSearch](file:///home/frontendgeek/Downloads/Project/Jobbers/lib/jobs/jsearch.ts).
   - Automatically handles provider outages gracefully with unified schema mapping.
2. **AI Fit Scoring & Matching**:
   - Google Gemini (via [`lib/llm.ts`](file:///home/frontendgeek/Downloads/Project/Jobbers/lib/llm.ts)) calculates a 0–100 match score against the user's profile.
   - Extracts matched vs. missing skills, role fit analysis, and an objective justification.
3. **Application Pipeline (Kanban)**:
   - 4-stage pipeline tracker on `/applications` (`Saved` → `Applied` → `Interview` → `Offer`).
   - Drag-or-select status updates with immediate database persistence.
4. **AI Resume Studio**:
   - Upload existing resumes (PDF) to parse experience, skills, and education into profile data.
   - Generates ATS-optimized vector PDFs using [`@react-pdf/renderer`](file:///home/frontendgeek/Downloads/Project/Jobbers/app/api/resume/download/[id]/route.ts) with bullet points written by Gemini.
5. **Company Research Dossiers**:
   - Automated deep-dive company research combining Browserbase, Stagehand, and Gemini to produce interview prep dossiers.
6. **Analytics Workspace**:
   - Tracks application velocities, match score distributions, and search activity via MongoDB aggregation.

### Tech Stack:
- **Framework**: Next.js 16 (App Router, Turbopack), React 19, TypeScript strict mode.
- **Styling**: Tailwind CSS v4 (`@theme` in [`app/globals.css`](file:///home/frontendgeek/Downloads/Project/Jobbers/app/globals.css)), Lucide React.
- **Database**: [MongoDB Atlas](https://cloud.mongodb.com) via official `mongodb` driver.
- **Authentication**: Better Auth with MongoDB adapter.
- **Email Service**: Resend (`lib/mail.ts`).
- **AI Gateway**: Google Gemini via `@google/genai` (all calls routed through `lib/llm.ts`).

---

## 2. Typography Rules ("Typo")

- **Primary Font**: **Mona Sans** (loaded in [`app/layout.tsx`](file:///home/frontendgeek/Downloads/Project/Jobbers/app/layout.tsx) via `next/font/google` as `--font-sans`).
- **Strict Rule**: **Never load or specify a secondary font** (no Inter, Roboto, or generic sans-serif fallbacks).
- **Typography Scale**:
  - **Logo**: 19px (`font-bold`, leading 28px, `text-text-darkest`)
  - **Stat Numbers / Big KPIs**: 30px (`text-3xl font-semibold text-text-primary`)
  - **Section / Card Headings**: 16px (`text-base font-semibold text-text-primary`)
  - **Body / Primary Items**: 14px (`text-sm font-medium text-text-primary`)
  - **Secondary / Labels**: 14px (`text-sm font-medium text-text-secondary`)
  - **Muted / Timestamps / Hints**: 12px (`text-xs font-normal text-text-muted`)
  - **Table Headers**: 12px (`text-xs font-medium uppercase tracking-wide text-text-secondary`)
  - **Trend Badges**: 12px (`text-xs font-medium text-success-darker`)

---

## 3. Color System & Design Tokens

Tailwind CSS v4 is configured entirely without a `tailwind.config.ts`. All tokens live in the `@theme` directive in [`app/globals.css`](file:///home/frontendgeek/Downloads/Project/Jobbers/app/globals.css).

### Strict Palette Invariants:
1. **NO RAW TAILWIND COLORS**: Never use `bg-purple-500`, `text-gray-600`, or `border-zinc-200`. Even built-in neutral utilities like `bg-white`, `text-white`, and `border-black` are prohibited.
   - Use `bg-surface` (instead of `bg-white`)
   - Use `text-accent-foreground` (instead of `text-white`)
   - Use `border-border` (instead of `border-gray-200`)
   - Use `border-ink` or `bg-ink` (instead of black)
2. **NO HARDCODED HEX VALUES**: Only three sanctioned exceptions exist in the codebase:
   - [`app/opengraph-image.tsx`](file:///home/frontendgeek/Downloads/Project/Jobbers/app/opengraph-image.tsx) (runs in `next/og` sandbox without CSS variables)
   - `ResumePDF.tsx` (`@react-pdf/renderer` has its own isolated layout engine)
   - Third-party logos in [`components/homepage/Logos.tsx`](file:///home/frontendgeek/Downloads/Project/Jobbers/components/homepage/Logos.tsx)
3. **BRAND ACCENT IS NOT FOR BUTTONS**:
   - `--color-accent: #6e56cf` (Brand purple) is reserved strictly for AI indicators, active navigation states, progress bars, and focus rings.
   - **Primary action buttons are near-black pills (`bg-ink`), NEVER purple.**
4. **DARK MODE**:
   - Defined via an unlayered `.dark` block in [`app/globals.css`](file:///home/frontendgeek/Downloads/Project/Jobbers/app/globals.css) using `color-mix()`.
   - Card surfaces resolve to `--color-inverse` (`#2d2f33`), page background resolves to `--color-inverse-sunken` (`#1c1e22`).
   - Toggled on `<html>` by [`components/layout/ThemeToggler.tsx`](file:///home/frontendgeek/Downloads/Project/Jobbers/components/layout/ThemeToggler.tsx).

### Semantic Token Reference:
| Category | Token Utility | Description |
| :--- | :--- | :--- |
| **Surfaces** | `bg-background`, `bg-surface`, `bg-surface-secondary` | `#fafafa`, `#ffffff`, `#f4f4f5` |
| **Borders** | `border-border`, `border-border-light`, `border-border-muted` | `#e4e4e7`, `#f4f4f5`, `#d4d4d8` |
| **Typography** | `text-text-primary`, `text-text-secondary`, `text-text-muted` | `#18181b`, `#71717a`, `#a1a1aa` |
| **Action / Ink** | `bg-ink`, `hover:bg-ink-hover`, `border-ink` | Near-black primary button & dark border tokens |
| **Brand Accent**| `bg-accent`, `text-accent`, `bg-accent-light`, `bg-accent-muted` | Purple AI/state highlights (`#6e56cf`, `#eeeafc`, `#f5f3fd`) |
| **Status (Match)**| `bg-success` (≥80%), `bg-info` (60–79%), `bg-warning` (<60%) | Centralized in [`lib/utils.ts`](file:///home/frontendgeek/Downloads/Project/Jobbers/lib/utils.ts) |
| **Pastels** | `bg-pastel-blue`, `bg-pastel-mint`, `bg-pastel-pink`, `bg-pastel-lilac`, `bg-pastel-yellow` | Card backgrounds (dynamically darkened in dark mode) |

---

## 4. Layouts, Navigation & Components

### Shell Layouts & Breakpoints:
- **Default Container**: `max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8`.
- **Dashboard Workspace Grid**: `max-w-[1600px] mx-auto` with a 3-column layout:
  `grid grid-cols-1 gap-5 xl:grid-cols-[264px_minmax(0,1fr)_380px]` (Left filters / Center feed / Right details panel sticky at `xl:top-[5.5rem]`).
- **Global Header**: `h-16 sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border`.
- **Workspace Navigation ([`AppShell.tsx`](file:///home/frontendgeek/Downloads/Project/Jobbers/components/layout/AppShell.tsx))**:
  - Collapsible desktop sidebar: `lg:w-[240px]` collapsed to `72px` icon rail.
  - Mobile drawer: `fixed inset-0 z-[60] lg:hidden` with dark scrim and Escape-to-close.
  - *Rule*: Drawers must be rendered **outside** the sticky `<header>` to avoid backdrop-blur containing-block clipping.

### Component Styling Conventions:
- **Buttons**: Use the predefined `.btn` classes:
  - Primary: `className="btn btn-primary"` (`bg-ink text-accent-foreground rounded-full h-13 px-7 font-bold`)
  - Secondary: `className="btn btn-secondary"` (`bg-surface border border-border rounded-full`)
  - Small variation: add `btn-sm` (`min-h-10 px-4.5 text-sm`)
  - *No `.btn-ghost` and no purple action buttons.*
- **Cards**:
  - Standard: `bg-surface border border-border rounded-2xl p-6 shadow-card`
  - Dashboard workspace exception: uses `border-ink shadow-sm rounded-2xl`
  - *Radii scale*: `--radius-sm: 6px`, `--radius-md: 10px`, card default is **16px** (`rounded-2xl`).
- **Badges**:
  - Standard badges: `rounded-full px-2 py-0.5 text-xs font-medium`.
  - Trend badges on stat cards: `rounded-sm px-2 py-0.5 text-xs font-medium bg-success-lightest text-success-darker`.
- **Empty States**:
  - Muted description text (`text-text-muted`), icon enclosed in a `bg-surface-secondary` rounded container, and a `.btn btn-primary` call-to-action. Never render fake or mock records.

---

## 5. File Structure & Architectural Boundaries

```
Jobbers/
├── AGENTS.md                              # Core rules & constraints for AI agents
├── context/                               # Project documentation & single sources of truth
│   ├── ai-briefing.md                     # This handover document
│   ├── project-overview.md                # 9 core navigation features and user journeys
│   ├── architecture.md                    # Data flow, schemas, and system boundaries
│   ├── ui-tokens.md                       # Comprehensive design token definitions
│   ├── ui-rules.md                        # Component and layout styling rules
│   ├── ui-registry.md                     # Component audit and inventory
│   └── progress-tracker.md                # Feature completion and roadmap state
├── app/                                   # Next.js App Router (Pages, Layouts, API Routes only)
│   ├── layout.tsx                         # Root layout (Mona Sans font + PostHog provider)
│   ├── globals.css                        # Tailwind v4 @theme, .dark overrides, .btn classes
│   ├── page.tsx                           # Marketing homepage
│   ├── (auth)/login/page.tsx              # Auth & login flows
│   ├── (workspace)/                       # Authenticated workspace pages inside AppShell
│   │   ├── layout.tsx                     # AppShell wrapper (sidebar, search bar, notifications)
│   │   ├── home/page.tsx                  # Workspace overview & recommended jobs
│   │   ├── jobs/page.tsx                  # Live job discovery & scoring feed
│   │   ├── applications/page.tsx          # 4-stage Kanban pipeline tracker
│   │   ├── resumes/page.tsx               # AI resume studio & PDF generation
│   │   ├── company-research/page.tsx      # Company research dossiers
│   │   ├── analytics/page.tsx             # PostHog-powered job search analytics
│   │   ├── profile/page.tsx               # Candidate identity, skills & work history
│   │   └── settings/page.tsx              # Notification & account preferences
│   └── api/                               # Backend REST endpoints (Agent, Jobs, Resumes, Auth)
├── components/                            # UI Layer (NO direct DB calls, presentation only)
│   ├── layout/                            # AppShell, Navbar, Footer, ThemeToggler, TourModal
│   ├── dashboard/                         # FeedHero, JobCard, JobDetailPanel, FilterSidebar
│   ├── find-jobs/                         # SearchControls, JobsTable, JobFilters, Pagination
│   ├── applications/                      # ApplicationsPageClient, StageColumns
│   ├── homepage/                          # Hero, AiMatcher, HowItWorks, LiveOpportunities
│   ├── profile/                           # IdentityProfileClient, ProfileForm, Skills
│   └── ui/                                # Primitives (button, card, dialog, popover, badge)
├── lib/                                   # Server & client utilities, external SDK wrappers
│   ├── llm.ts                             # Centralized Google Gemini caller (generateJson)
│   ├── mongodb.ts                         # MongoDB Atlas client singleton
│   ├── betterAuth.ts                      # Better Auth configuration
│   ├── profile.ts                         # MongoDB profile service
│   ├── resumes.ts                         # MongoDB resumes service
│   ├── jobs/                              # Multi-board job search engine & providers
│   └── utils.ts                           # Match scoring thresholds, formatting, class merging
├── actions/                               # Server Actions (Mutations triggered by UI)
└── types/                                 # TypeScript schemas & global contracts
```

### Architectural Separation of Concerns:
- **`app/`**: Routes, layouts, and API handlers. No business logic.
- **`components/`**: Pure UI layer. Never invoke database clients directly.
- **`actions/`**: Next.js Server Actions for user-initiated mutations (e.g. updating profile, moving a job stage).
- **`lib/` & `agent/`**: Data fetching, AI orchestration, and third-party API integration.
- **Database Safety**: All MongoDB queries must scope by user ID (`user.id` / `user_id`). Database operations must be additive.

---

## 6. Pre-Flight Checklist for AI Implementations

Before delivering code changes, ensure:
- [ ] Colors use defined design tokens (`bg-surface`, `text-text-primary`, `border-border`, `bg-ink`).
- [ ] No raw Tailwind colors (`bg-purple-*`, `text-gray-*`) or hardcoded hex values exist.
- [ ] Primary buttons use `.btn .btn-primary` (near-black pill) rather than purple.
- [ ] Only Mona Sans typography is used.
- [ ] The layout is responsive, collapsing to a mobile drawer below `lg`.
- [ ] Empty, loading, and error states are included for all data-driven views.
