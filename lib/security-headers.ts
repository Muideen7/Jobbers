/**
 * CSP and HSTS construction.
 *
 * Pure string work with no Node or DOM APIs, so the same builders run in the
 * proxy (edge bundle) and under `node --test`. Deliberately free of `@/`
 * imports so tests can load it by relative path.
 */

/**
 * Session-gated routes — exactly the routes that are dynamically rendered, and
 * therefore the only ones a per-request CSP nonce can reach.
 *
 * `next.config.ts` derives the complement it applies a static CSP to from this
 * list, so the two cannot overlap on the same path. Overlap matters because
 * duplicate response headers resolve last-wins: a static 'unsafe-inline' policy
 * landing on a nonce'd route would silently defeat the nonce.
 *
 * `proxy.ts` cannot derive its own matcher from this — Next.js parses `config`
 * at build time and rejects computed values — so its matcher is a hand-written
 * literal. tests/security-headers.test.ts asserts the two never drift.
 */
export const PROXY_OWNED_ROUTE_PREFIXES = [
  "/home",
  "/jobs",
  "/applications",
  "/resumes",
  "/profile",
] as const;

/** Matches everything `PROXY_OWNED_ROUTE_PREFIXES` does not claim. */
export const NON_PROXY_OWNED_SOURCE = `/:path((?!${PROXY_OWNED_ROUTE_PREFIXES.map(
  (prefix) => `${prefix.slice(1)}(?:/|$)`,
).join("|")}).*)`;

export const PERMANENT_SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

// The only external origins the browser talks to. Adzuna and Browserbase are
// called server-side and need no directive. next/font self-hosts Mona Sans, so
// there is no font CDN here.
const posthogHost = (
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"
).replace(/\/+$/, "");

/**
 * posthog-js talks to two hosts, not one. `api_host` handles capture and flags;
 * the assets host is derived from it (requestRouter.endpointFor("assets")) and
 * serves the remote config (`array/<token>/config.js` plus its JSON fallback)
 * and every lazily-loaded feature bundle:
 *
 *   https://us.i.posthog.com   -> https://us-assets.i.posthog.com
 *
 * Allowlisting only `api_host` left every remote-config request blocked by
 * CSP, which surfaced as `[PostHog.js] [Dead Clicks] failed to load script`
 * and `[PostHog.js] TypeError: Failed to fetch`, and stopped `$pageview`
 * reaching the project at all.
 *
 * A custom/self-hosted `api_host` serves assets from itself (posthog's own
 * region detection falls back to the configured host), so it maps to itself.
 */
export function posthogAssetsHost(apiHost: string): string {
  const match = /^(https:\/\/)([a-z0-9-]+)\.i\.posthog\.com$/i.exec(apiHost);
  if (!match) {
    return apiHost;
  }
  return `${match[1]}${match[2]}-assets.i.posthog.com`;
}

const posthogAssets = posthogAssetsHost(posthogHost);

type CspOptions = {
  /** Present for dynamically rendered routes; enables strict script-src. */
  nonce?: string;
  isDev?: boolean;
};

export function createNonce(): string {
  return btoa(crypto.randomUUID());
}

/**
 * `nonce` yields a strict policy: no `'unsafe-inline'` in script-src, and
 * `'strict-dynamic'` so the nonced Next.js runtime is trusted to pull in its
 * own chunks. Without it (build-time prerendered documents, where no nonce can
 * reach the HTML) the policy falls back to `'unsafe-inline'`.
 */
export function buildContentSecurityPolicy({
  nonce,
  isDev = process.env.NODE_ENV === "development",
}: CspOptions = {}): string {
  const scriptSrc = nonce
    ? ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"]
    : // The static policy has no nonce, so third-party scripts need an explicit
      // origin. Under a nonce, `'strict-dynamic'` already trusts scripts that
      // nonced code injects (posthog-js appends its own <script>), and it makes
      // host allowlists a no-op for script-src-elem — so the origin is only
      // added here, where it actually applies.
      ["'self'", "'unsafe-inline'", posthogAssets];

  // React reconstructs server error stacks with eval in development only.
  if (isDev) {
    scriptSrc.push("'unsafe-eval'");
  }

  const connectSrc = [...new Set(["'self'", posthogHost, posthogAssets])];
  if (isDev) {
    connectSrc.push("ws:", "wss:");
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    // Kept 'unsafe-inline' even under a nonce: a nonce suppresses
    // 'unsafe-inline' for the directive it appears in, so a nonced style-src
    // would silently drop Tailwind's runtime styles instead of failing loudly.
    // Inline CSS is not a script-execution vector, so it buys no real XSS
    // resistance here.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    // Sign-out posts to /api/auth/logout; anything else is a hijack vector.
    "form-action 'self'",
    "object-src 'none'",
  ];

  // Would rewrite http://localhost in development, so dev-only omission follows
  // the Next.js CSP guide.
  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

/**
 * Applied only to requests arriving over TLS (gated by `has` in next.config.ts).
 *
 * `includeSubDomains` and `preload` are opt-in because both are hard to
 * withdraw: an unreachable subdomain or a broken cert under a preloaded domain
 * bricks every HTTPS request. `max-age` defaults to one year rather than the
 * common two so a bad first deployment ages out sooner.
 */
export function buildStrictTransportSecurity(): string {
  const maxAge = process.env.HSTS_MAX_AGE ?? "31536000";
  const directives = [`max-age=${maxAge}`];

  if (process.env.HSTS_INCLUDE_SUBDOMAINS === "true") {
    directives.push("includeSubDomains");
  }

  if (process.env.HSTS_PRELOAD === "true") {
    directives.push("preload");
  }

  return directives.join("; ");
}