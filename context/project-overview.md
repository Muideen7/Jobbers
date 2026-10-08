# Project Overview

## About the Project

Jobbers is a full-stack, AI-powered job hunting assistant built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and InsForge. Candidates set up their profile once, upload their resume, and the agent automatically discovers relevant jobs across multi-source networks (JSearch, Arbeitnow, RemoteOK, Remotive, Jobicy, Adzuna) — scoring each role against the user's profile using Google Gemini. 

Applications are managed across a 4-stage pipeline (Saved → Applied → Interview → Offer), while detailed company research dossiers prepare candidates for interviews.

---

## 9 Core Navigation Features

The application is structured around **9 clean, primary features** organized into 3 sidebar navigation groups:

### 1. Workspace
- **Home (`/home`)**: High-level metrics, candidate stats bar, and top recommended job cards.
- **Jobs (`/jobs`)**: Multi-source live job discovery feed with Gemini scoring, filters, and automatic initial search for new users with profile target roles.
- **Applications (`/applications`)**: Pipeline tracking board with 4 stage columns (Saved, Applied, Interview, Offer) and inline status migration.

### 2. Tools
- **Resumes (`/resumes`)**: AI resume parsing from PDF upload and instant tailored PDF resume rendering using Gemini + `@react-pdf/renderer`.
- **Analytics (`/analytics`)**: Dedicated analytics workspace featuring data-driven charts (Jobs Over Time, Match Score Distribution, Research Activity).
- **Research (`/company-research`)**: Company dossiers & research queue for viewed roles awaiting background investigation.

### 3. Account
- **Profile (`/profile`)**: Candidate profile setup (personal info, target roles, work history, skills) & profile completion progress.
- **Settings (`/settings`)**: User account management, email preferences, notification toggles, and account actions.

*(Plus `/jobs/[id]` job detail view).*

---

## Sidebar Navigation Layout

Responsive left sidebar navigation with collapsible desktop state (`lg:w-[240px]` collapsed to `72px`) and drawer on mobile screens:

```
[Logo]
├── Workspace
│   ├── Home (/home)
│   ├── Jobs (/jobs)
│   └── Applications (/applications)
├── Tools
│   ├── Resumes (/resumes)
│   ├── Analytics (/analytics)
│   └── Research (/company-research)
└── Account
    ├── Profile (/profile)
    └── Settings (/settings)

[Unlock Jobbers Pro Card]
[Take the Tour Button]
[Sign Out Button]
```

---

## Core User Flows

### 1. New Candidate Onboarding & Auto-Search
- User signs up / logs in via InsForge auth (Email/Password or OAuth).
- Navigates to `/jobs` or finishes setting target roles in `/profile`.
- If a candidate has 0 saved jobs, `/jobs` automatically triggers a server-side initial search using their primary target role — presenting live scored opportunities on first render.

### 2. Interactive Tour Guide
- Clicking **Take the tour** in the sidebar opens `TourModal` (a 2/4 screen footprint modal using exact `@theme` design tokens).
- Guides candidates step-by-step through Job Discovery, Applications Pipeline, AI Resumes, and Company Research.

### 3. Application Pipeline & Stage Transitions
- Candidate bookmarks roles or logs applications.
- On `/applications`, jobs are grouped by pipeline status (**Saved**, **Applied**, **Interview**, **Offer**).
- Changing status in the card dropdown instantly updates the record via `PATCH /api/applications/[id]`.

### 4. AI Resume PDF Generation
- Candidate uploads existing resume PDF to populate profile data via Gemini.
- Clicking "Generate AI Resume PDF" calls `POST /api/resume/generate`, invoking Gemini to write achievement bullet points and rendering a download-ready PDF via `@react-pdf/renderer`.

---

## Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **Styling**: Tailwind CSS v4 (`@theme` variables in `app/globals.css`), lucide-react
- **Backend & Auth**: InsForge (Postgres database, RLS, Storage, Auth)
- **AI Gateway**: Google Gemini via `@google/genai` (centralized in `lib/llm.ts`)
- **Analytics**: PostHog server & client tracking
- **PDF Rendering**: `@react-pdf/renderer`
