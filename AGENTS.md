---
description: Instructions building apps with MCP
globs: *
alwaysApply: true
---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Read Before Anything Else

Read in this exact order before any implementation:

1. context/project-overview.md
2. context/architecture.md
3. context/ui-tokens.md
4. context/ui-rules.md
5. context/ui-registry.md
6. context/code-standards.md
7. context/library-docs.md
8. context/build-plan.md
9. context/progress-tracker.md

## Rules That Never Change

- Never use hardcoded hex values or raw Tailwind color classes
- Update `progress-tracker.md` and `ui-registry.md` after every feature
- Before any third party library — load its installed skill first,
  then read `context/library-docs.md` for project-specific rules
- If the same problem persists after one corrective prompt —
  stop immediately and run /recover

## Available Skills

- `/architect` — before any complex feature. Think before building.
- `/imprint` — after any new UI component. Capture patterns.
- `/review` — before demo or when something feels off.
- `/recover` — when something breaks after one failed correction.
- `/remember save` — when a feature spans multiple sessions.
- `/remember restore` — when returning after a multi-session feature.

## Jobbers revamp rules (prompt pack)

Stack: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4
(design tokens live in the `@theme` block of `app/globals.css`), lucide-react,
MongoDB / Better Auth. Google Gemini (via `lib/llm.ts`) for AI.

### Design tokens

- Use ONLY the design tokens already in the repo (CSS variables / Tailwind theme,
  as used by the current sidebar).
- Never hardcode hex colors, radii, shadows, or font sizes. If a token you need
  does not exist, stop and ask.
- Reuse existing components (cards, buttons, badges, empty states, skeletons)
  before creating new ones.

### Backend (MongoDB & Better Auth)

- Access MongoDB via the official driver singleton (`lib/mongodb.ts`) using `getCollection<TSchema>("collection_name")`.
- Authentication is handled by Better Auth (`lib/betterAuth.ts`). For server components and actions, resolve the current user with `getCurrentUser()` or `requireUser()` from `lib/auth.ts`.
- Every user-owned document must store `userId` (or `user_id`) matching the signed-in user's ID, and all queries/mutations must be scoped to that user.
- Always serialize MongoDB `_id` to string (`_id.toString()`) and `Date` instances to ISO strings before passing to Client Components.
- Validate all API inputs using Zod.
- Transactional emails are dispatched via Resend (`lib/mail.ts`).

### Production safety

- The live app has real users and data. Work only on a feature branch and use preview deployments. Do not merge to `main` until instructed.
- Database changes must be additive. Never drop or rename collections in production.
- Existing live URLs (/dashboard, /find-jobs, /find-jobs/[id], /profile) must keep working through permanent redirects.

### Product rules

- No "coming soon" pages. Do not create a route unless it has real content.
- Never delete a working feature. Move it. Old routes must redirect permanently to their new home.
- Never render fake or mock data in the UI. Empty states must guide the user to the next action.
- Every page needs loading, empty, and error states using existing tokens.
- Mobile first. The sidebar becomes a drawer below the lg breakpoint.

### Workflow

- For any task touching more than 3 files, start in plan mode and wait for approval.
- After each task: run typecheck, lint, and build. List files changed. Give a short manual test checklist.
- Keep commits small. Do not refactor unrelated code.

---

## Important Architecture Notes

- AI integrations use **Google Gemini** through `@google/genai`, keyed by a server-side `GEMINI_API_KEY`, with the model in `GEMINI_MODEL` (default `gemini-3-flash-preview`). Call sites must go through `lib/llm.ts` (`generateJson`), never construct a client inline.
- **EXTRA IMPORTANT**: Use Tailwind CSS v4 (currently `tailwindcss@4.3.3` with `@tailwindcss/postcss@4.3.3`). Design tokens live in the `@theme` block at the top of `app/globals.css` and are consumed as Tailwind utilities (`bg-surface`, `text-text-primary`, `border-border`, …) or via `var(--color-*)`. Never hardcode hex or reach for Tailwind's built-in palette in feature code — this includes the neutral entries `bg-white`, `text-white` and `border-black`; use `bg-surface`, `text-accent-foreground`, `border-inverse-foreground` and `border-ink` instead. In inline SVG use `currentColor` or `style={{ fill: "var(--color-*)" }}`, never a literal in `fill=`/`stroke=`. The only sanctioned hex exceptions are `app/opengraph-image.tsx` and `app/api/resume/generate/ResumePDF.tsx` (both render in engines that cannot read CSS custom properties) and the third-party trademark colours in `components/homepage/Logos.tsx` and `components/homepage/TopCompanies.tsx`; each is commented where it is used. Lock these dependencies in `package.json`.
