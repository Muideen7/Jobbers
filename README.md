# Jobbers — AI-Powered Technical Job Search Agent

<p align="center">
  <strong>Find open roles, score match quality against your profile, generate ATS-tailored resumes, and track applications in real time.</strong>
</p>

<p align="center">
  <a href="https://jobbers-match.vercel.app"><strong>Live Demo »</strong></a>
</p>

---

## Overview

**Jobbers** is an autonomous job search assistant built for technical professionals. Instead of manually sifting through hundreds of postings, Jobbers aggregates live jobs from multiple platforms, evaluates each role against your exact profile using Google Gemini, generates tailored resumes, and organizes your hiring pipeline in a unified dashboard.

---

## Key Features

- **🎯 Intelligent Match Scoring**: Calculates 0–100% fit scores comparing job requirements against your profile skills, experience, and preferred stack.
- **🔍 Multi-Source Discovery Feed**: Search live tech roles with deep filtering across remote preferences, seniority, location, and salary ranges.
- **📄 ATS-Optimized Resume Engine**:
  - One-click resume parsing: upload your existing PDF to auto-populate your profile.
  - Tailored resume export: generate job-targeted PDF resumes with matching keywords.
- **📊 Application Pipeline**: Clean stage-grouped tracker (**Saved** → **Applied** → **Interview** → **Offer**) to manage all your active applications in one place.
- **🏢 Company Research Dossiers**: Synthesizes company insights, culture signals, tech stacks, and interview preparation questions for any role.
- **🔐 Modern Authentication**: Built on Better Auth supporting secure Email/Password (minimum 8 characters with live format validation) and GitHub / Google OAuth.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack) + [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with semantic design tokens
- **Database**: [MongoDB Atlas](https://cloud.mongodb.com/) via official `mongodb` driver
- **Authentication**: [Better Auth](https://better-auth.com/) (MongoDB adapter + OAuth)
- **AI Engine**: [Google Gemini](https://ai.google.dev/) (`gemini-3-flash-preview` via `@google/genai`)
- **Email Service**: [Resend](https://resend.com/)
- **PDF Generation**: [@react-pdf/renderer](https://react-pdf.org/)

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Muideen7/Jobbers.git
cd Jobbers
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in your configuration:

```env
# Site URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/Jobbers?retryWrites=true&w=majority
MONGODB_DB=Jobbers

# Better Auth Secret (generate with: openssl rand -hex 32)
BETTER_AUTH_SECRET=your-32-byte-hex-secret

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3-flash-preview

# Resend Email (optional)
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=Jobbers <onboarding@resend.dev>

# OAuth Providers (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Job Search APIs (optional)
JSEARCH_API_KEY=your-jsearch-api-key
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_APP_KEY=your-adzuna-app-key
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
├── actions/              # Next.js Server Actions (profile, mutations)
├── app/
│   ├── (auth)/           # Authentication routes (login, signup, callback)
│   ├── (workspace)/      # Core dashboard pages (home, jobs, applications, resumes, profile)
│   ├── api/              # API endpoints (auth, applications, search, emails)
│   └── globals.css       # Tailwind v4 @theme design tokens
├── components/
│   ├── auth/             # Login/Signup cards and auth buttons
│   ├── homepage/         # Landing page hero, features, FAQs, and footer
│   ├── layout/           # AppShell, Navbar, Sidebar
│   ├── profile/          # Profile form tabs and resume uploaders
│   └── ui/               # Reusable primitives (buttons, modals, badges)
├── lib/
│   ├── betterAuth.ts     # Better Auth configuration
│   ├── mongodb.ts        # MongoDB client singleton
│   ├── profile.ts        # Profile data access layer
│   ├── llm.ts            # Gemini AI orchestration
│   └── mail.ts           # Resend notification delivery
└── types/                # TypeScript interface definitions
```

---

## Testing & Quality

Run the test suite:

```bash
npm test
```

Run TypeScript verification:

```bash
npx tsc --noEmit
```

---

## License

This project is licensed under the MIT License.
