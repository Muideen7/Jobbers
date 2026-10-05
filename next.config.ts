import type { NextConfig } from "next";

import {
  NON_PROXY_OWNED_SOURCE,
  PERMANENT_SECURITY_HEADERS,
  buildContentSecurityPolicy,
  buildStrictTransportSecurity,
} from "./lib/security-headers";

const staticCsp = buildContentSecurityPolicy();

const nextConfig: NextConfig = {
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