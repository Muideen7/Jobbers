# Jobbers — AI-Powered Technical Job Search Agent

Jobbers is an autonomous job search and career copilot built for technical professionals. Rather than manually juggling spreadsheets, job boards, and resume versions, Jobbers aggregates live tech roles, analyzes fit scores using Google Gemini, generates ATS-tailored PDF resumes, and streamlines your entire hiring pipeline from application to interview scheduling.

---

## Key Capabilities

- **🎯 Intelligent Match Scoring & Gap Analysis**  
  Calculates transparent 0–100% fit scores comparing job descriptions against your verified profile, skills, experience level, and preferred stack.
  
- **🔍 Multi-Platform Discovery Feed**  
  Aggregates live engineering roles with real-time filtering across remote arrangements, seniority, location, and compensation brackets.

- **📄 Tailored Resume Studio**  
  - Target specific applications or live roles to generate customized summaries, tailored bullet points, and keyword-aligned skill highlights.
  - Interactive split-pane editor with live PDF preview and 1-click ATS-ready PDF export via `@react-pdf/renderer`.

- **📊 Application Pipeline**  
  Organized stage-grouped pipeline (**Saved** &rarr; **Applied** &rarr; **Interviewing** &rarr; **Offered** &rarr; **Archived**) to track all active job opportunities in one central workspace.

- **📅 Interview Hub & Live iCal Sync**  
  Schedule interview rounds, log interviewer details, and subscribe via secure live iCal/webcal feed to synchronize directly with Apple Calendar, Google Calendar, or Outlook.

- **✉️ Follow-Up & Communication Studio**  
  AI-crafted post-interview thank you notes, application status inquiries, and offer negotiation messages with one-click email client dispatch.

- **🏢 Company Intelligence Dossiers**  
  Synthesizes company background, engineering culture, tech stacks, and role-specific interview preparation strategies.

- **🔐 Robust Authentication**  
  Built on Better Auth supporting secure credentials (email/password with strength validation) as well as GitHub and Google OAuth.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router & Turbopack), [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (strict mode) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with semantic design tokens |
| **Database** | [MongoDB Atlas](https://cloud.mongodb.com/) via the official `mongodb` driver |
| **Authentication** | [Better Auth](https://better-auth.com/) with MongoDB adapter |
| **AI Engine** | [Google Gemini](https://ai.google.dev/) (`gemini-3-flash-preview` via `@google/genai`) |
| **PDF Generation** | [@react-pdf/renderer](https://react-pdf.org/) |
| **Email Service** | [Resend](https://resend.com/) |
| **Icons** | [lucide-react](https://lucide.dev/) |

---

## Getting Started

### Prerequisites

- Node.js 20+ installed
- [pnpm](https://pnpm.io/) package manager (`corepack enable pnpm` or `npm i -g pnpm`)
- MongoDB Atlas cluster or local MongoDB instance
- Google Gemini API key ([Google AI Studio](https://aistudio.google.com/))

### 1. Clone the repository

```bash
git clone https://github.com/Muideen7/Jobbers.git
cd Jobbers
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create your local environment file:

```bash
cp .env.local.example .env.local
```

Configure your `.env.local`:

```env
# Site URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000

# Better Auth Secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-secure-random-secret

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/Jobbers?retryWrites=true&w=majority
MONGODB_DB=Jobbers

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3-flash-preview

# GitHub OAuth (Optional for local dev, required for GitHub login)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Resend Email (Optional for transactional emails)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=Jobbers <onboarding@resend.dev>

# Job Search APIs (Optional live aggregators)
JSEARCH_API_KEY=your-jsearch-api-key
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_APP_KEY=your-adzuna-app-key
```

### 4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
├── actions/                  # Server actions (mutations, profile persistence)
├── app/
│   ├── (auth)/               # Auth routes (login, signup, callback)
│   ├── (workspace)/          # Core workspace routes
│   │   ├── applications/     # Pipeline management & tracker
│   │   ├── dossiers/         # Company intelligence reports
│   │   ├── follow-ups/       # Follow-up email drafter
│   │   ├── integrations/     # Calendar feeds & external hooks
│   │   ├── interviews/       # Interview schedule & prep studio
│   │   ├── profile/          # Profile & skills identity manager
│   │   └── resumes/          # Tailored resume studio & saved library
│   ├── api/                  # API endpoints (auth, calendar feed, resumes, AI)
│   └── globals.css           # Tailwind v4 theme variables & styles
├── components/
│   ├── ai-resume/            # Interactive resume editor & PDF preview
│   ├── applications/         # Applications pipeline client
│   ├── follow-ups/           # Follow-up generator & outreach client
│   ├── integrations/         # Webcal/iCal subscription manager
│   ├── interviews/           # Interview calendar & prep questions
│   ├── layout/               # AppShell, responsive sidebar, navigation
│   └── ui/                   # Shared UI primitives
├── context/                  # Architectural guidelines & build specs
├── lib/                      # Core utilities (Better Auth, MongoDB singleton, Gemini LLM, mailer)
└── types/                    # Shared TypeScript interfaces
```

---

## Quality Checks

Run TypeScript validation:

```bash
pnpm run build
```

Run test suite:

```bash
pnpm test
```

---

## Production Deployment Checklist (Vercel)

1. **MongoDB Atlas Network Access**: In MongoDB Atlas &rarr; **Network Access**, ensure `0.0.0.0/0` ("Allow Access from Anywhere") is enabled so Vercel's serverless functions can connect.
2. **GitHub OAuth Configuration**:
   - Homepage URL: `https://<YOUR-PROJECT>.vercel.app`
   - Authorization callback URL: `https://<YOUR-PROJECT>.vercel.app/api/auth/callback/github`
3. **Vercel Environment Variables**: Ensure `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `MONGODB_URI`, `GEMINI_API_KEY`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET` are populated under Project Settings.

---

## License

This project is licensed under the MIT License.
