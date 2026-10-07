import type { NextConfig } from "next";

import {
  NON_PROXY_OWNED_SOURCE,
  PERMANENT_SECURITY_HEADERS,
  buildContentSecurityPolicy,
  buildStrictTransportSecurity,
} from "./lib/security-headers";

const staticCsp = buildContentSecurityPolicy();

/**
 * Permanent (308) redirects from the pre-revamp routes to their new homes.
 * These run before the filesystem router, so a stale page file can never shadow
 * the redirect. Keep in sync with the sidebar and `lib/auth.ts`.
 */
const LEGACY_REDIRECTS: { source: string; destination: string }[] = [
  { source: "/dashboard", destination: "/home" },
  { source: "/find-jobs", destination: "/jobs" },
  { source: "/find-jobs/:id", destination: "/jobs/:id" },
  { source: "/matches", destination: "/jobs?tab=for-you" },
  { source: "/inventory", destination: "/jobs?tab=saved" },
  { source: "/company-research", destination: "/jobs?tab=all" },
  { source: "/dossiers", destination: "/jobs?tab=all&researched=1" },
  { source: "/dossiers/:id", destination: "/jobs/:id?tab=company" },
  { source: "/ai-resume", destination: "/resumes" },
  { source: "/interview-prep", destination: "/applications?stage=interview" },
  { source: "/follow-ups", destination: "/home" },
  { source: "/analytics", destination: "/home" },
  { source: "/settings", destination: "/profile?tab=account" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return LEGACY_REDIRECTS.map((redirect) => ({
      ...redirect,
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: PERMANENT_SECURITY_HEADERS,
      },
      {
        // Asserted only when the connection actually arrived over TLS. Browsers
        // ignore HSTS on a plain-HTTP response anyway, so sending it there just
        // hides a proxy that is dropping x-forwarded-proto.
        source: "/:path*",
        has: [{ type: "header", key: "x-forwarded-proto", value: "https" }],
        headers: [
          {
            key: "Strict-Transport-Security",
            value: buildStrictTransportSecurity(),
          },
        ],
      },
      {
        // Deliberately excludes the session-gated routes. Those get a strict
        // per-request nonce policy from proxy.ts, and because duplicate headers
        // resolve last-wins, listing them here too would overwrite that nonce
        // with this static 'unsafe-inline' fallback.
        source: NON_PROXY_OWNED_SOURCE,
        headers: [{ key: "Content-Security-Policy", value: staticCsp }],
      },
    ];
  },
};

export default nextConfig;