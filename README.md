<div align="center">
  <br />
  <br />

  <div>
<img src="https://img.shields.io/badge/-Next.js-black?style=for-the-badge&logo=Next.js&logoColor=white" />
<img src="https://img.shields.io/badge/-TypeScript-3178C6?style=for-the-badge&logo=TypeScript&logoColor=white" />
<img src="https://img.shields.io/badge/-Tailwind%20CSS-06B6D4?style=for-the-badge&logo=Tailwind%20CSS&logoColor=white" />
<img src="https://img.shields.io/badge/-shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white" />
<br />
<img src="https://img.shields.io/badge/-Gemini-8E75B2?style=for-the-badge&logo=Google%20Gemini&logoColor=white" />
<img src="https://img.shields.io/badge/-Stagehand-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/-Browserbase-000000?style=for-the-badge" />
<img src="https://img.shields.io/badge/-InsForge-darkgreen?style=for-the-badge" />

  </div>

  <h3 align="center">Jobbers — the AI job-matching agent</h3>

  <div align="center">
    Score every open role against your profile, research the company, and tailor your application.
  </div>
</div>

## 📋 <a name="table">Table of Contents</a>

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🤸 [Quick Start](#quick-start)

## <a name="introduction">✨ Introduction</a>

Jobbers is a full-stack AI agent for technical job seekers. It discovers roles through Adzuna, scores each one against your profile with Gemini, researches the target company by browsing its public pages through Browserbase/Stagehand, and generates a tailored resume — so you only read the roles worth your time.

Built with Next.js 16 (App Router), TypeScript, Tailwind v4, Gemini, Browserbase/Stagehand, InsForge (Postgres + auth + storage), and PostHog.

## <a name="tech-stack">⚙️ Tech Stack</a>

- **[Next.js](https://nextjs.org/)** is a full-stack React framework that powers Jobbers's user interface, utilizing the App Router, Server Actions, and API Routes to deliver server-rendered components and high-performance client-side navigation.
- **[TypeScript](https://www.typescriptlang.org/)** is a strongly typed programming language that builds on JavaScript, ensuring strict type safety across the entire codebase and providing a maintainable environment for complex agent orchestration.
- **[Tailwind v4](https://tailwindcss.com/)** is a utility-first CSS framework used for rapid UI development, providing a clean, responsive, and easily customized styling infrastructure.
- **[shadcn/ui](https://ui.shadcn.com/)** is a collection of re-usable UI components built using Radix Primitives and Tailwind CSS, serving as the design system for the app's dashboard, tables, and job inventory views.
- **[Google Gemini](https://ai.google.dev/)** (`gemini-3-flash-preview`) is the core intelligence engine, parsing job descriptions to compute match scores, tailoring resumes, and driving the form-filling automation logic.
- **[Stagehand](https://github.com/browserbase/stagehand)** is an AI-driven browser agent built on top of Playwright that uses LLMs to interpret page elements dynamically, allowing Jobbers to execute LinkedIn Easy Apply paths and handle external ATS form-filling.
- **[Browserbase](https://www.browserbase.com/)** is a headless cloud browser platform that manages infrastructure, session persistence, authentication states, and CAPTCHA solving so background jobs can run through realistic browser instances.
- **[InsForge](https://insforge.com/)** is a comprehensive backend-as-a-service provider that supplies the relational PostgreSQL database to manage the job inventory, handles user authentication, and provides secure file storage for assets.
- **[PostHog](https://posthog.com/)** is an all-in-one product analytics platform used to track user engagement, system performance metrics, and the success rates of automated application paths.


## <a name="features">🔋 Features</a>

👉 **Job Discovery**: Live Adzuna search filtered by role, location, contract type, and salary — reachable from the public landing page, with a debounced search and a 5-minute result cache so anonymous visitors cannot burn the API quota.

👉 **Match Scoring**: Advanced evaluation where each discovered job is parsed and scored against your professional profile by an LLM, then ranked by match percentage.

👉 **Job Inventory**: A central, filterable dashboard table that organizes matched jobs with quick access to source links, external apply links, application types, and real-time status.

👉 **Job Details**: A dedicated, per-job review view featuring a transparent match breakdown, full descriptions, direct resume controls, and manual apply triggers.

👉 **Resume Generation & Tailoring**: Dynamic engine that generates a foundational resume from your user profile, then instantly customizes it to target specific job descriptions.

👉 **Company Research**: A single Browserbase session browses the company's public pages and Gemini synthesises a nine-field dossier — overview, tech stack, culture, why the role exists, your edge, gaps to address, smart questions, interview prep, and sources. If the browser pass fails, synthesis still runs from the job description and your profile alone; the dossier is never empty.

👉 **Resume Extraction**: Upload a PDF once and Gemini parses it into structured profile fields — skills, industries, work history, and education — which fill the profile form automatically.

👉 **Public Landing Search**: Anonymous visitors can search live roles and filter by All roles / Remote / Full time / $150k+, then sign in to open a role.

And many more, including code architecture and reusability.

## <a name="quick-start">🤸 Quick Start</a>

Follow these steps to set up the project locally on your machine.

**Prerequisites**

Make sure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/) (Node Package Manager)

**Cloning the Repository**

```bash
git clone https://github.com/Muideen7/Jobbers.git
cd Jobbers
```

**Installation**

Install the project dependencies using npm:

```bash
npm install
```

**Set Up Environment Variables**

Create a new file named `.env.local` in the root of your project (copied from `.env.local.example`) and add your real credentials.

```env
NEXT_PUBLIC_INSFORGE_URL=https://y7fvq3ie.us-east.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=

NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

GEMINI_API_KEY=
GEMINI_MODEL=gemini-3-flash-preview

BROWSERBASE_API_KEY=
BROWSERBASE_PROJECT_ID=

ADZUNA_APP_ID=
ADZUNA_APP_KEY=
```

Replace the placeholder values with your real credentials. You can get these by signing up at: [**InsForge**](https://insforge.dev/), [**Browserbase**](https://www.browserbase.com/), [**Google AI Studio**](https://aistudio.google.com/apikey), [**PostHog**](https://posthog.com/), [**Adzuna**](https://www.adzuna.com/)
**Running the Project**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the project.

**How It Works**

1. **Set up your profile** — fill in your experience, skills, and target roles, or upload a resume PDF and let Gemini fill the form for you
2. **Find Jobs** — search by role and location; Gemini scores every result against your profile and saves them to your inventory
3. **Review matches** — filter by match score, open any role for the full description, score breakdown, and apply link
4. **Research the company** — trigger a Browserbase research pass and read the nine-field dossier before you apply
5. **Tailor and apply** — generate a tailored resume PDF for that specific role, then apply through the source link

**Browserbase Integration**

`agent/research.ts` opens one Browserbase session per company, drives Stagehand to extract structured content from the homepage and up to three sub-pages, then releases the session in a `finally` block. Every AI call goes through `lib/llm.ts`; every config value lives in `.env.local` (see `.env.local.example`).

**Deploy on Vercel**

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

