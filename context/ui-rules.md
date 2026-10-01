# UI Rules

Concise rules for building Jobbers UI. These cover the patterns and constraints that keep
the UI consistent without over-specifying every detail.

> **Verified against the codebase on 2026-10-01** with **Tailwind CSS v4.3.3** and
> **Mona Sans**. An earlier revision of this file named hex values that do not exist in the
> palette, described a purple primary button, and banned `position: fixed` while both
> navbars depend on it for their drawers. All of that is corrected below.
>
> **This file contains no hex values by design.** Every color is named as a token or a
> `var(--color-*)` reference. Hex lives in exactly one place — the `@theme` block in
> `app/globals.css`, mirrored verbatim into `ui-tokens.md`. If you need a value, read
> it there; do not paste it into rules, components or this file.

---

## Font

**Mona Sans** — never Inter, never a system-font primary. Loaded exactly once, in the root
layout:

```tsx
// app/layout.tsx
import { Mona_Sans } from "next/font/google";

const monaSans = Mona_Sans({ variable: "--font-sans", subsets: ["latin"] });
// applied to <html className={monaSans.variable}>
```

`--font-sans` is declared in `@theme` and applied via `font-family: var(--font-sans)` in
`globals.css`. Never load a second font family.

---

## Layout

- Page max-width: **1440px** (`max-w-[1440px] mx-auto`), used by every page
- Container gutters: `px-4 sm:px-6 lg:px-8` — identical in navbar, footer and page shell
- Gap between page sections: `gap-6` (24px) on in-app pages, `gap-8`+ on landing
- Header height: **64px** (`h-16`), full width, `sticky top-0`, `bg-surface/90 backdrop-blur-md`
- No sidebar. There **is** a mobile drawer (see Navbar) below `md`
- `rounded-2xl` (16px) is the default card radius, not `rounded-md`

---

## Navbar

Two distinct navbars, deliberately separate files:

| | File | Used by |
| --- | --- | --- |
| Marketing | `components/homepage/LandingNavbar.tsx` | `/` |
| In-app | `components/layout/Navbar.tsx` | `/dashboard`, `/profile`, `/find-jobs`, `/login` |

Both share `h-16`, `sticky top-0 z-50`, `bg-surface/90 backdrop-blur-md`,
`border-b border-border`, and the `max-w-[1440px] px-4 sm:px-6 lg:px-8` container.

The in-app navbar is **auth-aware** via the `isAuthenticated` prop:

- **Signed in** — three nav items (Dashboard, Find Jobs, Profile); active item is
  `text-accent`; right side shows `UserCircle` + Sign out
- **Signed out** (the auth page) — **no nav items at all**, because `/dashboard`,
  `/profile` and `/find-jobs` all bounce anonymous visitors back to `/login`. Right side
  is `ArrowLeft` "Back to home" + a `.btn .btn-primary .btn-sm` "Get started" CTA

Rules:

- Nav links are `text-sm font-medium`, `rounded-md`, no underline — active state is color
  only (`text-accent` vs `text-text-dark hover:text-text-primary`)
- Below `md` both navbars collapse to a left drawer: `fixed inset-0 z-[60] md:hidden`
  panel with an `bg-ink/40` scrim, body scroll lock, and Escape-to-close
- The drawer is rendered **outside** `<header>`, because a `backdrop-blur` ancestor becomes
  the containing block for `fixed` children
- Drawer state closes on link `onClick`, not via `setState` inside a `useEffect`
  (rejected by `react-hooks/set-state-in-effect`)
- Never render two competing CTAs on mobile: the top bar carries the hamburger only, the
  CTA lives in the drawer

---

## Cards

Every content section lives in a card.

```
background: var(--color-surface)
border: 1px solid var(--color-border)
border-radius: 16px                     /* rounded-2xl */
padding: 24px                           /* p-6 */
box-shadow: var(--shadow-card)
```

`shadow-card` is the only shadow in the app. Arbitrary `shadow-[...]` rgba stacks are
dead — they were all replaced. Never use a colored card background; color goes inside
cards via badges, bars and text.

---

## Typography Hierarchy

Use these utilities, not raw hex. Sizes actually in use: `text-xs` (76), `text-sm` (107),
`text-base` (23), `text-xl` (16), `text-3xl` (11), `text-4xl` (10), `text-5xl` (8).

**Section headings** — card titles, page section titles

```
text-base font-semibold
color: var(--color-text-primary)
```

**Body / primary content text**

```
text-sm font-medium
color: var(--color-text-primary)
```

**Secondary / muted text** — labels, timestamps, subtitles

```
text-xs font-normal
color: var(--color-text-muted)
```

**Stat numbers** on the dashboard use `text-3xl font-semibold text-text-primary`.

---

## Badges

Pill-shaped by default (`rounded-full`), `px-2 py-0.5 text-xs font-medium`.

Trend badges on stat cards are the exception: `rounded-sm` + `bg-success-lightest` +
`text-success-darker`. Note `rounded-sm` is **6px** here, not Tailwind's 4px — the
`@theme` radius keys override Tailwind's built-in scale.

---

## Buttons

Use the `.btn` system. There is no `bg-accent` button and no `.btn-ghost`.

```
primary   : class="btn btn-primary"        /* near-black bg-ink pill, white text */
secondary : class="btn btn-secondary"      /* white pill + border-border */
small     : add "btn-sm"                    /* min-height 2.5rem */
```

| Token | Value |
| --- | --- |
| Primary surface | `bg-ink`, hover `bg-ink-hover` |
| Primary text | `text-accent-foreground` |
| Border radius | `var(--radius-full)` — pills, never `rounded-md` |
| Base sizing | `min-height: 3.25rem`, `padding: 0.875rem 1.75rem`, `font-size: 1rem`, `font-weight: 700` |
| Active | `transform: scale(0.98)` |
| Focus | `outline: 2px solid var(--color-accent)`, `outline-offset: 3px` |

**Primary buttons are near-black, not purple.** `--color-accent` is reserved for AI/emphasis
moments, active nav state, tags and focus rings. The single surviving
`bg-accent text-accent-foreground` pair is the active page number in `JobsPagination`,
which is a state indicator, not an action.

---

## Form Inputs

```
background: var(--color-surface)
border: 1px solid var(--color-border)
border-radius: var(--radius-md)          /* rounded-md = 10px */
padding: px-3 py-2
font-size: text-sm
color: var(--color-text-primary)
placeholder: var(--color-text-muted)
focus: focus:ring-1 focus:ring-accent    /* + focus:border-accent on selects */
```

---

## Table (Jobs List)

- No alternating row colors — white rows only, separated by `border-b border-border`
- Column headers: `text-xs font-medium uppercase tracking-wide text-text-secondary`
- Row text: `text-sm text-text-primary`
- Row hover: `hover:bg-surface-secondary`
- Cell padding: `px-6 py-4`; header padding: `px-6 py-3`

---

## Match Score Bar

Thresholds come from `getMatchScoreColor()` / `getMatchScoreTextColor()` in
`lib/utils.ts`. Never re-derive them in a component.

```
track: h-1 w-24 rounded-full bg-border-light
fill:  h-full rounded-full, width driven by style={{ width: `${score}%` }}
```

| Score | Fill | Score text |
| --- | --- | --- |
| >= 80 | `bg-success` | `text-success` |
| 60–79 | `bg-info` | `text-info-medium` |
| < 60 | `bg-warning` | `text-warning` |

---

## Empty States

Every section that can be empty must have one. Keep it minimal:

- Short descriptive text in `text-text-muted`
- Optional icon above the text, typically in a `bg-surface-secondary` rounded shell
- A `.btn .btn-primary` CTA when there is a logical next action

---

## Tailwind v4

This project uses **Tailwind CSS 4.3.3** (`tailwindcss` + `@tailwindcss/postcss`). Tokens
are defined with `@theme` in `app/globals.css`. **There is no `tailwind.config.ts`** — v4
is configured from CSS. Never define colors in a JS config. To add a token, add a
`--color-*` entry to `@theme` and mirror it in `ui-tokens.md`.

Two consequences worth remembering: `@theme` keys **override** Tailwind's built-in scales
(`--radius-sm: 6px` changes what `rounded-sm` means), and the project utility classes
(`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-sm`, `.landing-hero-glow`) are defined in
`globals.css`, not by Tailwind.

Content detection is explicitly scoped: `globals.css` uses
`@import "tailwindcss" source(none)` plus three `@source` directives for `app`,
`components` and `lib`. Without this, Tailwind v4 auto-detects sources and scans **every**
file in the repo — including the markdown in `context/`. Since these docs quote banned
classes like `bg-white` and `text-gray-600` as counter-examples, the default scan was
compiling them into the shipped stylesheet: the banned palette was being served as real CSS
merely because it was documented. Keep the `@source` list accurate — a component directory
added outside those three paths will silently lose all of its styling.

---

## Do Nots

- Never use Tailwind's built-in color classes (`bg-purple-500`, `text-gray-600`) — project
  tokens only. This includes `bg-white` / `text-white` / `border-black`, which are palette
  entries even though they look neutral. Use `bg-surface`, `text-accent-foreground`,
  `border-inverse-foreground`, `border-ink` instead.
- Never hardcode hex in a component
- Never use arbitrary color utilities (`bg-[#f9fafb]`, `text-[#6e56cf]`) — the value already
  exists as a token, so reach for the token
- For inline SVG, never leave a literal in `fill=`/`stroke=`. Use `currentColor` when the
  shape should inherit the text colour, or `style={{ fill: "var(--color-*)" }}` — a bare
  `fill="var(--color-*)"` presentation attribute is not portable and will not render
- Never define colors in a `tailwind.config.ts` — use `@theme` in `app/globals.css`
- Never add gradients to card backgrounds
- Never use more than one font weight in a single UI element
- Never show raw error messages to users — always show human readable text
- Never stack more than 2 levels of border radius inside each other
- Never link to a session-gated route from pre-auth chrome (navbar or footer on `/login`)
- Never render a second font family

### The only three sanctioned hex exceptions

Each is commented at the point of use, so a grep for hex returns these and nothing else:

| File | Why |
| --- | --- |
| `app/opengraph-image.tsx` | `next/og` renders in a sandbox that cannot read CSS custom properties |
| `app/api/resume/generate/ResumePDF.tsx` | `@react-pdf/renderer` has its own layout engine with no access to the theme |
| `components/homepage/Logos.tsx`, `components/homepage/TopCompanies.tsx` | Third-party trademark colours — recolouring them misrepresents the brand |

`position: fixed` **is** allowed for mobile drawer overlays and scrims — an earlier
revision of this file banned it outright while the two navbars both depend on it.
