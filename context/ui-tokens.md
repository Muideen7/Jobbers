# UI Tokens

Design tokens for Jobbers. All colors, typography, spacing, and component values extracted from the delivered design. Use these exact values throughout the codebase — never hardcode colors or use raw Tailwind color classes in components.

---

## How to Use

> **Verified against the codebase on 2026-10-01** with Tailwind CSS **4.3.3**. The `@theme`
> block below is a verbatim copy of `app/globals.css`, and the two files are diffed in CI
> expectations — if you add a token there, add it here.

This project uses **Tailwind CSS v4.3.3** (`tailwindcss` + `@tailwindcss/postcss`). All design tokens are defined using the `@theme` directive in `app/globals.css`. There is no `tailwind.config.ts` — v4 is configured entirely from CSS.

Tailwind v4 automatically generates utility classes from `@theme` variables:

- `--color-accent` → `bg-accent`, `text-accent`, `border-accent`
- `--color-surface` → `bg-surface`, `text-surface`, `border-surface`

```tsx
// Correct — uses generated utility classes
className="bg-surface text-text-primary border-border"

// Also correct — references CSS variable directly
style={{ color: 'var(--color-text-primary)' }}

// Never — hardcoded hex values
className="bg-[#F6F7FB] text-[#101828]"

// Never — raw Tailwind color classes
className="bg-purple-500 text-gray-600"
```

---

## globals.css — Complete Token Definition

```css
@import "tailwindcss" source(none);

@source "../app";
@source "../components";
@source "../lib";

@theme {
  --font-sans: "Mona Sans", ui-sans-serif, system-ui, sans-serif;

  /* Neutrals follow the Jobbers zinc scale. */
  --color-background: #fafafa;
  --color-surface: #ffffff;
  --color-surface-secondary: #f4f4f5;
  --color-surface-tertiary: #fafafa;

  --color-border: #e4e4e7;
  --color-border-light: #f4f4f5;
  --color-border-muted: #d4d4d8;

  --color-text-primary: #18181b;
  --color-text-secondary: #71717a;
  --color-text-muted: #a1a1aa;
  --color-text-strong: #52525b;
  --color-text-faint: #d4d4d8;
  --color-text-dark: #3f3f46;
  --color-text-darkest: #27272a;
  --color-text-slate: #27272a;
  --color-text-slate-medium: #71717a;
  --color-chart-axis: #a1a1aa;

  /* Brand purple, used sparingly for AI and emphasis moments. */
  --color-accent: #6e56cf;
  --color-accent-dark: #5a45b8;
  --color-accent-light: #eeeafc;
  --color-accent-muted: #f5f3fd;
  /* Used for text on dark CTA backgrounds. */
  --color-accent-foreground: #ffffff;

  /* shadcn/ui semantic aliases (components/ui/*). Every value points at an
   * existing Jobbers token so the primitives cannot introduce a foreign
   * palette — mirrored verbatim into ui-tokens.md. */
  --color-foreground: #18181b;
  --color-card: #ffffff;
  --color-card-foreground: #18181b;
  --color-popover: #ffffff;
  --color-popover-foreground: #18181b;
  --color-primary: #18181b;
  --color-primary-foreground: #ffffff;
  --color-secondary: #f4f4f5;
  --color-secondary-foreground: #18181b;
  --color-muted: #f4f4f5;
  --color-muted-foreground: #a1a1aa;
  --color-destructive: #ef4444;
  --color-destructive-foreground: #ffffff;

  /* Dark panels (how-it-works, footer, chart surfaces). */
  --color-inverse: #2d2f33;
  --color-inverse-deep: #242629;
  --color-inverse-sunken: #1c1e22;
  --color-inverse-foreground: #ffffff;
  --color-inverse-muted: #a1a1aa;
  /* Primary action surface: near-black pills and buttons. */
  --color-ink: #18181b;
  --color-ink-hover: #000000;
  /* Warm secondary used in the AI matcher and bento cards. */
  --color-peach: #fff6ec;
  --color-rose-soft: #fdf2f4;
  --color-rose: #f43f5e;
  --color-rose-strong: #e11d48;

  /* Violet decorative set for the hero and AI matcher glows. */
  --color-violet-glow: #f3e8ff;
  --color-violet-border: #e9d5ff;
  --color-violet-panel: #ede9fe;

  /* Decorative accents: skill bars, star rating, peach card edge. */
  --color-skill-slate: #334155;
  --color-skill-lime: #84cc16;
  --color-skill-sky: #0284c7;
  --color-amber: #f59e0b;
  --color-amber-deep: #78350f;
  --color-orange: #ea580c;

  /* Peach gradient stops for the hero preview and stat cards. */
  --color-peach-soft: #f8e5d6;
  --color-peach-deep: #edd4c1;
  --color-peach-line: #fed7aa;

  /* Lavender gradient stops for the hero preview. */
  --color-lavender: #ece8fe;
  --color-lavender-soft: #f7f5ff;

  /* Cool grays used in the landing illustrations and skyline art. */
  --color-art-line: #f1f5f9;
  --color-art-fill: #e2e8f0;
  --color-art-fill-strong: #cbd5e1;
  --color-brand-navy: #1e3a8a;

  /* Pastel card backgrounds for live opportunity results. */
  --color-pastel-blue: #eef4ff;
  --color-pastel-mint: #eefbf3;
  --color-pastel-pink: #fdf2f8;
  --color-pastel-lilac: #f6f0ff;
  --color-pastel-cream: #fff7ed;
  --color-pastel-aqua: #f0fdfa;

  --color-success: #10b981;
  --color-success-alt: #00bc7d;
  --color-success-dark: #007a55;
  --color-success-darker: #009966;
  --color-success-light: #d0fae5;
  --color-success-lightest: #ecfdf5;
  --color-success-foreground: #007a55;

  --color-info: #1972f5;
  --color-info-medium: #2b7fff;
  --color-info-light: #dbeafe;
  --color-info-lightest: #eff6ff;
  --color-info-muted: #94a2c5;

  --color-warning: #ff8904;
  --color-warning-foreground: #ffffff;

  --color-error: #ef4444;

  /* Portrait/image scrim, layered over next/image in WallOfLove. */
  --color-scrim: #000000;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  --shadow-card: 0 1px 2px rgb(24 24 27 / 0.04), 0 8px 24px rgb(24 24 27 / 0.04);
}
```

### Dark mode — verbatim mirror of the `.dark` block

> Same "add it in globals.css, add it here" rule applies. `app/globals.css`
> carries two additions after `@theme`: a `:root` block with two **stable
> light-mode accent sources** (`.dark` lightens the accent by mixing these
> toward the white foreground; a self-referencing
> `color-mix(… var(--color-accent) …)` inside `.dark` would be circular and
> invalid at computed-value time), and an **unlayered `.dark`** selector that
> toggles the whole app's token set at runtime. `ThemeToggler` in
> `components/layout/ThemeToggler.tsx` flips `document.documentElement`
> between no class (light) and `.dark`. Dark mode's card surface **is the
> landing footer colour** (`--color-inverse` = `#2d2f33`) and the page shell
> sits one step darker (`--color-inverse-sunken` = `#1c1e22`), so the dark
> app reads as the footer's colour family.

```css
/* Stable light-mode sources. `.dark` lightens the accent by mixing these
 * toward the white foreground; a self-referencing color-mix(… var(--color-accent) …)
 * inside `.dark` would be circular and invalid at computed-value time. */
:root {
  --color-accent-source: #6e56cf;
  --color-accent-dark-source: #5a45b8;
}

/*
 * Dark mode — `.dark` is toggled on <html> by components/layout/ThemeToggler.
 * Every override is derived from existing tokens, never a new literal: the
 * card surface IS the landing footer background (--color-inverse) and the page
 * shell sits one step darker (--color-inverse-sunken), so dark mode reads as
 * the footer's colour family. Unlayered on purpose — it must beat the
 * @layer theme defaults above (utilities are var() references, so overriding
 * the custom properties at runtime recolours the whole app).
 */
.dark {
  color-scheme: dark;

  /* Surfaces — cards are the footer colour. */
  --color-background: var(--color-inverse-sunken);
  --color-surface: var(--color-inverse);
  --color-surface-secondary: color-mix(in srgb, var(--color-inverse-foreground) 10%, var(--color-inverse));
  --color-surface-tertiary: var(--color-inverse-deep);

  --color-border: color-mix(in srgb, var(--color-inverse-foreground) 16%, var(--color-inverse-deep));
  --color-border-light: color-mix(in srgb, var(--color-inverse-foreground) 9%, var(--color-inverse-deep));
  --color-border-muted: color-mix(in srgb, var(--color-inverse-foreground) 26%, var(--color-inverse-deep));

  --color-text-primary: var(--color-inverse-foreground);
  --color-text-secondary: color-mix(in srgb, var(--color-inverse-foreground) 72%, var(--color-inverse-sunken));
  --color-text-muted: color-mix(in srgb, var(--color-inverse-foreground) 56%, var(--color-inverse-sunken));
  --color-text-strong: color-mix(in srgb, var(--color-inverse-foreground) 64%, var(--color-inverse-sunken));
  --color-text-faint: color-mix(in srgb, var(--color-inverse-foreground) 36%, var(--color-inverse-sunken));
  --color-text-dark: color-mix(in srgb, var(--color-inverse-foreground) 82%, var(--color-inverse-sunken));
  --color-text-darkest: color-mix(in srgb, var(--color-inverse-foreground) 93%, var(--color-inverse-sunken));
  --color-text-slate: color-mix(in srgb, var(--color-inverse-foreground) 93%, var(--color-inverse-sunken));
  --color-text-slate-medium: color-mix(in srgb, var(--color-inverse-foreground) 72%, var(--color-inverse-sunken));
  --color-chart-axis: color-mix(in srgb, var(--color-inverse-foreground) 56%, var(--color-inverse-sunken));

  /* Accent lightens so purple text stays legible on dark surfaces; its light
   * fills flip to dark lavenders so pills keep an accent-on-lavender pairing.
   * --color-accent-foreground stays white — ink buttons and pills need it. */
  --color-accent: color-mix(in srgb, var(--color-accent-source) 70%, var(--color-accent-foreground));
  --color-accent-dark: color-mix(in srgb, var(--color-accent-dark-source) 70%, var(--color-accent-foreground));
  --color-accent-light: color-mix(in srgb, var(--color-accent) 30%, var(--color-inverse));
  --color-accent-muted: color-mix(in srgb, var(--color-accent) 20%, var(--color-inverse));

  /* Pastel surfaces darken with their hue so white primary text stays readable.
   * The hue share is deliberately between a washed-out tint and a full colour:
   * enough to read as an actual colour in dark mode, not a standard swatch. */
  --color-pastel-blue: color-mix(in srgb, var(--color-info) 38%, var(--color-inverse));
  --color-pastel-mint: color-mix(in srgb, var(--color-success) 36%, var(--color-inverse));
  --color-pastel-pink: color-mix(in srgb, var(--color-rose) 36%, var(--color-inverse));
  --color-pastel-lilac: color-mix(in srgb, var(--color-accent) 40%, var(--color-inverse));
  --color-pastel-cream: color-mix(in srgb, var(--color-amber) 30%, var(--color-inverse));
  --color-pastel-aqua: color-mix(in srgb, var(--color-success-alt) 34%, var(--color-inverse));

  /* Decorative fills (bento cards, hero gradients, skyline art) and the warm
   * secondary shades darken with their hue; success/info light pills keep
   * their dark text-on-light-fill pairing, which reads in both modes. */
  --color-peach: color-mix(in srgb, var(--color-amber) 14%, var(--color-inverse));
  --color-peach-soft: color-mix(in srgb, var(--color-amber) 10%, var(--color-inverse));
  --color-peach-deep: color-mix(in srgb, var(--color-amber) 18%, var(--color-inverse));
  --color-peach-line: color-mix(in srgb, var(--color-amber) 26%, var(--color-inverse));
  --color-rose-soft: color-mix(in srgb, var(--color-rose) 16%, var(--color-inverse));
  --color-violet-glow: color-mix(in srgb, var(--color-accent) 16%, var(--color-inverse));
  --color-violet-border: color-mix(in srgb, var(--color-accent) 34%, var(--color-inverse));
  --color-violet-panel: color-mix(in srgb, var(--color-accent) 20%, var(--color-inverse));
  --color-lavender: color-mix(in srgb, var(--color-accent) 18%, var(--color-inverse));
  --color-lavender-soft: color-mix(in srgb, var(--color-accent) 12%, var(--color-inverse));
  --color-art-line: color-mix(in srgb, var(--color-inverse-foreground) 9%, var(--color-inverse-deep));
  --color-art-fill: color-mix(in srgb, var(--color-inverse-foreground) 18%, var(--color-inverse-deep));
  --color-art-fill-strong: color-mix(in srgb, var(--color-inverse-foreground) 30%, var(--color-inverse-deep));

  /* shadcn/ui semantic aliases track the surfaces they stand for. */
  --color-foreground: var(--color-text-primary);
  --color-card: var(--color-inverse);
  --color-card-foreground: var(--color-text-primary);
  --color-popover: var(--color-inverse);
  --color-popover-foreground: var(--color-text-primary);
  --color-secondary: var(--color-surface-secondary);
  --color-secondary-foreground: var(--color-text-primary);
  --color-muted: var(--color-surface-secondary);
}
```

**Dark-mode decisions worth remembering:**

- The page shell is `--color-inverse-sunken` (`#1c1e22`), cards are the footer
  `--color-inverse` (`#2d2f33`), and `--color-surface-secondary` is 10% white
  over that footer colour. Borders/text tiers are white `color-mix` percentages
  (borders 16/9/26%, text 72/56/64/36/82/93% against the sunken shell).
- `--color-accent` lightens to 70% `--color-accent-source` + 30% white
  (≈ `#9a88dd`) so purple text on dark surfaces stays **≥ 4.5:1**;
  `--color-accent-foreground` stays white because ink buttons, pills and the
  sidebar's active-nav badge depend on it.
- `accent-light`/`accent-muted` flip to dark lavenders (30%/20% accent over the
  footer colour) so `bg-accent-light text-accent` pill pairings stay readable.
- Pastels darken **with their hue** in dark mode. The hue share is deliberately
  set between a washed-out tint and a full swatch (pastel-blue 38%, mint 36%,
  pink 36%, lilac 40%, cream 30%, aqua 34% over `--color-inverse`) so each reads
  as an actual colour — noticeably more saturated than the light tint — without
  becoming a standard/flat colour. These tokens are the **single source (DRY)**:
  the shared `StatCard` (dashboard *and* Applications tracker) and the tracker's
  stage cards all consume `bg-pastel-*`, so changing the token here recolours
  every pastel surface at once. Never special-case one page (e.g. a per-page
  "keep light" scope) — that breaks the shared contract.
- Decorative fills (peach, lavender, rose-soft, violet-*, art-*) darken with
  their hue; `--color-success-light` / `--color-info-light` and their
  `-foreground` partners are deliberately **not** overridden — dark-text-on-
  light-fill pills already read in both modes.

Tailwind v4 generates utility classes automatically from every `--color-*` token above:

- `bg-accent`, `text-accent`, `border-accent`
- `bg-surface`, `text-surface-secondary`
- `bg-success-light`, `text-text-muted`
- etc.

---

## Color Usage Guide

### Page Layout

| Element           | Token                  |
| ----------------- | ---------------------- |
| Page background   | `bg-background`        |
| Card / surface    | `bg-surface`           |
| Secondary surface | `bg-surface-secondary` |
| Default border    | `border-border`        |
| Light border      | `border-border-light`  |

### Typography

| Element                | Token                           |
| ---------------------- | ------------------------------- |
| Headings, primary text | `text-text-primary` (#18181b)   |
| Secondary text, labels | `text-text-secondary` (#71717a) |
| Placeholder, muted     | `text-text-muted` (#a1a1aa)     |
| Dark labels            | `text-text-dark` (#3f3f46)      |

### Accent (Brand Purple)

Used for: AI and emphasis moments, active nav items, match score bars, tailored badge, focus rings

Primary action buttons are **not** purple in this design — they are near-black pills using `bg-ink` / `text-ink`.

| Element                | Token                              |
| ---------------------- | ---------------------------------- |
| Active nav item        | `text-accent`                      |
| Focus ring             | `outline: 2px solid var(--color-accent)` |
| Badge / tag background | `bg-accent-light text-accent`      |
| Subtle background      | `bg-accent-muted`                  |
| Text on dark CTA       | `text-accent-foreground`           |

**There is no `bg-accent` button.** The only surviving `bg-accent text-accent-foreground`
pair in the app is the active page number in `JobsPagination` — a state indicator, not an
action button.

### Match Score Colors

Single source of truth is `getMatchScoreColor()` / `getMatchScoreTextColor()` in
`lib/utils.ts`, consumed by `JobsTable`. Do not re-derive thresholds in a component.

| Score Range | Bar fill     | Score text          |
| ----------- | ------------ | ------------------- |
| >= 80       | `bg-success` | `text-success`      |
| 60 - 79     | `bg-info`    | `text-info-medium`  |
| Below 60    | `bg-warning` | `text-warning`      |

Track is `h-1 w-24 rounded-full bg-border-light`; fill width is driven by
`style={{ width: `${score}%` }}`. `MatchScore` on the job detail page uses a
separate pill badge, `bg-success-lightest text-success-foreground`.

### Skills Badges

| Type          | Background            | Text                      |
| ------------- | --------------------- | ------------------------- |
| Matched skill | `bg-success-lightest` | `text-success-foreground` |
| Missing skill | `bg-accent-muted`     | `text-accent`             |

### Source Badges

| Source   | Background             | Text                  |
| -------- | ---------------------- | --------------------- |
| LinkedIn | `bg-linkedin-light`    | `text-linkedin`       |
| URL      | `bg-surface-secondary` | `text-text-secondary` |

### Status Badges

| Status     | Background             | Text                      |
| ---------- | ---------------------- | ------------------------- |
| Tailored   | `bg-accent-light`      | `text-accent`             |
| High Match | `bg-success-lightest`  | `text-success-foreground` |
| Low Match  | `bg-surface-secondary` | `text-text-secondary`     |

---

## Typography

| Element              | Size | Weight | Line height | Color token           |
| -------------------- | ---- | ------ | ----------- | --------------------- |
| Logo text            | 19px | 700    | 28px        | `text-text-darkest`   |
| Stat number          | 30px | 600    | 36px        | `text-text-primary`   |
| Section heading      | 16px | 600    | 24px        | `text-text-primary`   |
| Nav item (active)    | 14px | 500    | 20px        | `text-accent`         |
| Nav item (inactive)  | 14px | 500    | 20px        | `text-text-dark`      |
| Card label           | 14px | 500    | 20px        | `text-text-secondary` |
| Body / activity text | 14px | 500    | 20px        | `text-text-primary`   |
| Trend badge text     | 12px | 500    | 16px        | `text-success-darker` |
| Timestamp / muted    | 12px | 400    | 16px        | `text-text-muted`     |
| Chart axis labels    | 12px | 400    | 15px        | `text-chart-axis`     |
| Stat subtitle        | 12px | 400    | 16px        | `text-text-muted`     |

Font family: **Mona Sans** — loaded once in `app/layout.tsx` via `next/font/google` as the `--font-sans` variable. Never load a second font.

---

## Spacing

| Token       | Value      | Usage                 |
| ----------- | ---------- | --------------------- |
| `gap-1`     | 4px        | Tight inline gaps     |
| `gap-2`     | 8px        | Badge and tag gaps    |
| `gap-3`     | 12px       | Form field gaps       |
| `gap-4`     | 16px       | Section internal gaps |
| `gap-6`     | 24px       | Between sections      |
| `gap-8`     | 32px       | Page section gaps     |
| `p-4`       | 16px       | Card padding          |
| `p-6`       | 24px       | Large card padding    |
| `px-4 py-2` | 16px / 8px | Button padding        |
| `px-3 py-1` | 12px / 4px | Badge padding         |

---

## Component Tokens

### Cards

```
background: bg-surface
border: 1px solid var(--color-border)
border-radius: 16px (rounded-2xl)
padding: 24px (p-6)
box-shadow: var(--shadow-card)
```

`rounded-2xl` (16px) is the standard card radius and is what the app uses in 28 places.
`rounded-3xl` is the exception, used twice: the auth shell (`LoginCard`) and the
`HowItWorks` dark panel. A previous version of this doc claimed all cards were 24px.

### Buttons

Buttons come from the `.btn` system in `app/globals.css`, **not** from ad-hoc utility
stacks. There are exactly four classes: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-sm`.
There is **no `.btn-ghost`** — a previous version of this doc invented one.

```css
.btn            { min-height: 3.25rem; border-radius: var(--radius-full);
                  padding: 0.875rem 1.75rem; font-size: 1rem; font-weight: 700; }
.btn-sm         { min-height: 2.5rem;   padding: 0.5rem 1.125rem; font-size: 0.875rem; }
.btn-primary    { background: var(--color-ink); }        /* near-black, NOT purple */
.btn-secondary  { background: var(--color-surface); border: 1px solid var(--color-border); }
.btn:active     { transform: scale(0.98); }
.btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 3px; }
```

Note `.btn-secondary` is a **pill** like the primary — the `rounded-md` in the old
"Secondary" block above was wrong and contradicted the CSS.

### Input Fields

```
background: bg-surface
border: border border-border
border-radius: rounded-md
padding: px-3 py-2
text: text-text-primary
placeholder: text-text-muted
focus: focus:ring-1 focus:ring-accent (+ focus:border-accent on selects)
```

### Badges

```
border-radius: rounded-full
padding: px-2 py-0.5
font-size: text-xs
font-weight: font-medium
```

### Match Score Bar

```
background track: bg-border-light
fill: varies by score range (see Match Score Colors above)
height: 4px
border-radius: rounded-full
```

### Trend Badges (stat cards)

```
background: bg-success-lightest
text color: text-success-darker
border-radius: 6px (rounded-sm — overridden by --radius-sm, NOT Tailwind's 4px default)
padding: 2px 8px
font-size: 12px
font-weight: 500
```

### Activity Dots

`ActivityType` is a two-value union — `"job_found" | "researched"`. There is no
"resume tailored" or "cover letter" activity type; an earlier version of this doc listed them.

| Activity Type | Outer ring              | Inner dot              |
| ------------- | ----------------------- | ---------------------- |
| `job_found`   | `var(--color-success-light)` | `var(--color-success-alt)` |
| `researched`  | `var(--color-info-light)`    | `var(--color-info)`    |

Dot size: `h-2 w-2` inner, `h-4 w-4` outer, `mt-0.5` to align with the first line of
multi-line activity text. Colors are set through the `background` shorthand via inline
`style`, because Tailwind v4 emits `background-color` for these tokens but the ring needs
`background`.

### Dashboard Chart Colors

| Chart                            | Color                                                           |
| -------------------------------- | --------------------------------------------------------------- |
| `JobsOverTimeChart` (area)        | `var(--color-accent)` stroke, 3px width, gradient fill at 20%   |
| `CompanyResearchChart` (bars)    | `var(--color-info)`                                             |
| `MatchDistributionChart` (bars)  | `var(--color-success)`                                          |
| Chart grid lines                 | `1px dashed var(--color-border)`                               |
| Chart axis labels                | `var(--color-chart-axis)`, 12px                                |

### Logo

The Jobbers mark is an **8-spoke** sunburst drawn as an inline SVG in
`components/homepage/Logos.tsx` (`JobbersIcon`) and composed with the wordmark by
`components/layout/Logo.tsx`. An earlier version of this doc said 12 spokes.

```
mark: 8 <line> spokes, currentColor, strokeWidth 2.5, strokeLinecap round, viewBox 0 0 24 24
size: 24px (in-app navbar / footer) or 28px (marketing navbar)
```

`app/icon.svg`, `app/favicon.ico` and `app/apple-icon.png` are generated from this same
mark, as is the `ImageResponse` OG image in `app/opengraph-image.tsx`.

---

## Invariants

- `--radius-sm` is **6px**, not Tailwind's 4px default. The `@theme` radius keys *override*
  Tailwind's built-in `rounded-*` scale, so `rounded-sm`/`rounded-md`/`rounded-lg` resolve to
  6/10/16px here. `--radius-xl` (24px) has no `rounded-xl` consumer, and `rounded-2xl` is
  left at Tailwind's 1rem (16px) because the theme does not define `--radius-2xl`.
- `shadow-card` is the **only** shadow in use (19 call sites). Arbitrary
  `shadow-[...]` rgba stacks are dead — several were replaced by it.

- Never use hex values directly in components — always use CSS variables via Tailwind tokens
- Font is Mona Sans — always import via next/font/google, never use a fallback system font
- Never use raw Tailwind color classes like `bg-purple-500` or `text-gray-600` — use project tokens only
- `--color-accent` (#6e56cf) is the only purple — never use Tailwind's built-in purple scale. It is reserved for AI/emphasis moments and active nav state; **primary buttons are near-black `bg-ink`, not purple.**
- Dark mode is **not** a component layer — it is one unlayered `.dark { … }` block in `app/globals.css` that overrides the `--color-*` custom properties at runtime (utilities are `var()` references), toggled on `<html>` by `components/layout/ThemeToggler.tsx`. Every dark value derives from an existing token via `color-mix()`; the only new literals are the two `:root` accent sources above.
- Match score bars always use color tokens based on score range — never hardcoded colors
- LinkedIn badge always uses `--color-linkedin` (#0a66c2) / `bg-linkedin-light` — never a generic blue token
- All borders default to `--color-border` (#e4e4e7) — never use `border-gray-*` / `border-zinc-*`
