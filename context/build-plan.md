# Build Plan & Architecture Scope

## Core Principle

Jobbers follows a clean 9-feature scope with zero "coming soon" placeholders, strict design token adherence (`@theme` in `app/globals.css`), and authentic real data integration through InsForge, Gemini LLM, and PostHog analytics.

---

## The 9 Feature Routes & Scope

```
Workspace
├── Home (/home)            → Candidate overview, quick actions & top match cards
├── Jobs (/jobs)            → Multi-source live discovery, search, auto-search for new profiles
└── Applications (/applications) → Stage-grouped pipeline (Saved, Applied, Interview, Offer)

Tools
├── Resumes (/resumes)      → Resume upload parsing + Gemini PDF generator
├── Analytics (/analytics)  → Data-driven charts (Jobs Over Time, Score Distribution, Research)
└── Research (/company-research) → Viewed role queue & company intelligence dossiers

Account
├── Profile (/profile)      → Personal details, target roles, experience, skills
└── Settings (/settings)    → Account preferences, notifications & actions
```

*(Plus `/jobs/[id]` detail view).*

---

## App Shell & Interactive Components

### 1. AppShell (`components/layout/AppShell.tsx`)
- Left sidebar with 3 distinct groups (Workspace, Tools, Account)
- Collapsible desktop layout (`240px` ↔ `72px`) and responsive mobile drawer
- Positioned "Unlock Jobbers Pro" card
- "Take the tour" button opening `TourModal`
- Direct "Sign out" action in footer

### 2. TourModal (`components/layout/TourModal.tsx`)
- 2/4 screen footprint (`max-w-3xl`)
- 4 interactive steps covering Job Discovery, Applications Pipeline, AI Resumes, and Company Research
- Strictly styled with Jobbers design tokens (`bg-surface`, `bg-surface-secondary`, `text-text-primary`, `text-accent`, `border-border`)

---

## Verification & Quality Rules

- **Zero TypeScript Errors**: Every edit must pass `npx tsc --noEmit`.
- **No Hardcoded Hex Values**: All UI styling must consume `@theme` design tokens.
- **Additive Database Changes**: Use InsForge CLI for DB operations.
- **No Dead End Routes**: Every route in the sidebar points to a working, content-rich page.
