# JOBBERS — SILENT AI ASSISTANT DASHBOARD UI SPECIFICATION

> **DIRECTIVE FOR AI AGENT**: Implement the Jobbers Workspace Home dashboard (`app/(workspace)/home/page.tsx`) and corresponding MongoDB-backed actions strictly following the layout, Mona Sans typography, and color tokens defined below. Treat AI as a silent, helpful concierge rather than a chat widget or analytics dashboard.

---

## 1. LAYOUT & UI STRUCTURE (`app/(workspace)/home/page.tsx`)

Implement the 3-section dashboard layout matching this exact hierarchy:

1. **Greeting Header**:
   - Title: `Welcome back, [First Name]! 👋` (`text-3xl font-semibold text-text-primary`)
   - Subtitle: `Here are your high-signal matches based on your skills ([Skills List]).` (`text-sm font-medium text-text-secondary`)

2. **Top Matches Section**:
   - Container: `bg-surface border border-ink shadow-sm rounded-2xl p-6 space-y-4`
   - Heading: `✨ Top Matches for You` (`text-base font-semibold text-text-primary`) with an understated metadata right-alignment (`text-xs text-text-muted`).
   - Job Cards: Each card uses `rounded-2xl border border-border bg-surface-secondary/40 p-5 hover:border-ink transition-all`.
     - Title & Company: `text-base font-semibold text-text-primary`, company/location/salary subtitle `text-sm font-medium text-text-secondary`.
     - **Match Score Badge** (Top-right pill):
       - 90%–100%: `bg-success text-text-primary` (e.g., `Match: 94% 🔥`)
       - 80%–89%: `bg-info text-text-primary` (e.g., `Match: 88% 👍`)
     - **Skill Alignment Indicators** (Bullet list inside the card): `text-xs font-normal text-text-muted space-y-1`. Highlight missing skills or notes using `text-accent`.

3. **Bottom Split Grid (`grid grid-cols-1 gap-6 md:grid-cols-2`)**:
   - **Recent Applications Card**: Lists the user's latest tracked applications with their current stage badge (`bg-surface-secondary text-text-secondary`).
   - **Proactive Profile Prompt (Pastel Mint Card)**:
     - Surface: `bg-pastel-mint border border-ink shadow-sm rounded-2xl p-6 space-y-4 flex flex-col justify-between`
     - Progress bar representing profile completion (e.g., 85%) using `bg-accent` for the fill.
     - Actionable nudge copy: `Add "TypeScript" to unlock 12 more matches.`
     - Button: `.btn .btn-primary btn-sm w-full justify-center` with text like `+ Add TypeScript to Profile`.

---

## 2. BACKEND DATA FETCHING & MONGODB INTEGRATION

1. **Server Component Pattern**:
   - `app/(workspace)/home/page.tsx` must be a Server Component that authenticates via `requireUser()` from `auth.ts`.
   - Fetch the user's document from the `profiles` collection and their recent items from the `applications` collection in MongoDB Atlas using `getCollection()` from `lib/mongodb.ts`.
   - Scope all queries strictly by `userId: user.id`.

2. **Proactive Skill Nudge Action (`actions/profile.ts`)**:
   - Implement a Server Action `addSkillToProfileAction(skillName: string)` that pushes a new skill into `profiles.skills` in MongoDB and calls `revalidatePath("/home")`.
   - Clicking the prompt button triggers this action instantly without a page reload.

---

## 3. DESIGN SYSTEM & TOKEN COMPLIANCE

- **Zero Raw Tailwind**: Do not use `bg-white`, `text-white`, `bg-zinc-*`, `text-gray-*`, or `bg-purple-*`.
- **Allowed Tokens Only**: Use `bg-surface`, `bg-surface-secondary`, `border-border`, `border-ink`, `text-text-primary`, `text-text-secondary`, `text-text-muted`, `bg-accent`, `bg-pastel-mint`, `bg-success`, and `bg-info`.
- **Buttons**: All primary CTAs must use `.btn .btn-primary` (near-black pill). Never use purple buttons for primary actions.
