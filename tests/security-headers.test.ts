import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  NON_PROXY_OWNED_SOURCE,
  PROXY_OWNED_ROUTE_PREFIXES,
  buildContentSecurityPolicy,
  buildStrictTransportSecurity,
  createNonce,
} from "../lib/security-headers.ts";

function directive(policy: string, name: string): string {
  const found = policy
    .split(";")
    .map((part) => part.trim())
    .find((part) => part === name || part.startsWith(`${name} `));
  assert.ok(found, `expected a ${name} directive in: ${policy}`);
  return found;
}

test("nonce policy removes unsafe-inline from script-src", () => {
  const policy = buildContentSecurityPolicy({ nonce: "abc123" });

  assert.equal(directive(policy, "script-src"), "script-src 'self' 'nonce-abc123' 'strict-dynamic'");
  assert.ok(!policy.includes("script-src 'self' 'unsafe-inline'"));
});

test("static fallback policy is used only when no nonce is supplied", () => {
  const policy = buildContentSecurityPolicy();

  assert.equal(directive(policy, "script-src"), "script-src 'self' 'unsafe-inline'");
});

test("both policies agree on the directives that are not script-src", () => {
  const strict = buildContentSecurityPolicy({ nonce: "abc123" });
  const lax = buildContentSecurityPolicy();

  for (const name of [
    "default-src",
    "style-src",
    "img-src",
    "font-src",
    "connect-src",
    "frame-src",
    "frame-ancestors",
    "base-uri",
    "form-action",
    "object-src",
  ]) {
    assert.equal(directive(strict, name), directive(lax, name), `${name} drifted`);
  }
});

test("frame-ancestors and object-src stay locked down", () => {
  const policy = buildContentSecurityPolicy({ nonce: "abc123" });

  assert.equal(directive(policy, "frame-ancestors"), "frame-ancestors 'none'");
  assert.equal(directive(policy, "object-src"), "object-src 'none'");
  assert.equal(directive(policy, "form-action"), "form-action 'self'");
});

test("connect-src allowlists PostHog and nothing else", () => {
  const connect = directive(buildContentSecurityPolicy(), "connect-src");

  assert.match(connect, /'self'/);
  assert.match(connect, /posthog\.com/);
  // Adzuna and Browserbase are server-side only and must never be reachable
  // from the browser.
  assert.ok(!connect.includes("adzuna"), connect);
  assert.ok(!connect.includes("browserbase"), connect);
});

test("upgrade-insecure-requests is production-only", () => {
  const isDev = process.env.NODE_ENV === "development";

  assert.equal(
    buildContentSecurityPolicy().includes("upgrade-insecure-requests"),
    !isDev,
  );
  assert.equal(
    buildContentSecurityPolicy({ nonce: "n", isDev: true }).includes(
      "upgrade-insecure-requests",
    ),
    false,
    "a dev policy must not upgrade http://localhost to https",
  );
});

test("development adds unsafe-eval and websocket connect targets", () => {
  const policy = buildContentSecurityPolicy({ nonce: "n", isDev: true });

  assert.match(directive(policy, "script-src"), /'unsafe-eval'/);
  assert.match(directive(policy, "connect-src"), /wss?:/);
});

test("production policy carries no development relaxations", () => {
  const policy = buildContentSecurityPolicy({ nonce: "n", isDev: false });

  assert.ok(!policy.includes("unsafe-eval"), policy);
  assert.ok(!directive(policy, "connect-src").includes("ws:"), policy);
});

test("nonces are unpredictable and unique per call", () => {
  const nonces = new Set(Array.from({ length: 500 }, () => createNonce()));

  assert.equal(nonces.size, 500);
  for (const nonce of nonces) {
    assert.match(nonce, /^[A-Za-z0-9+/]+={0,2}$/, "must be a valid base64 CSP nonce");
  }
});

test("the non-proxy source excludes every session-gated route", () => {
  const pattern = new RegExp(`^${NON_PROXY_OWNED_SOURCE.replace(/^\/:path\(/, "").replace(/\)$/, "")}$`);

  for (const owned of ["/dashboard", "/dashboard/jobs", "/profile", "/find-jobs", "/find-jobs/abc"]) {
    const path = owned.slice(1);
    assert.ok(!pattern.test(path), `${owned} must not match the static-CSP source`);
  }

  for (const unowned of ["", "login", "api/jobs", "about", "find-jobsomething", "dashboards"]) {
    assert.ok(pattern.test(unowned), `${unowned || "/"} should match the static-CSP source`);
  }
});

test("proxy.ts's static matcher matches PROXY_OWNED_ROUTE_PREFIXES exactly", () => {
  // Next.js parses proxy `config` at build time, so its matcher cannot be
  // computed from the shared list. This guards the resulting duplication: if a
  // route is added to one side only, the static CSP and the nonce CSP would
  // overlap and the last-wins header would strip the nonce.
  const source = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
  const matcherLiteral = source.match(/matcher:\s*\[([^\]]*)\]/);

  assert.ok(matcherLiteral, "could not find the matcher array in proxy.ts");

  const [, matcherBody] = matcherLiteral;
  assert.ok(matcherBody, "the matcher array body was not captured");

  const declared = [...matcherBody.matchAll(/"([^"]+)"/g)]
    .map((match) => match[1]?.replace(/\/:path\*$/, ""))
    .filter((prefix): prefix is string => prefix !== undefined);

  assert.deepEqual(declared, [...PROXY_OWNED_ROUTE_PREFIXES]);
});

test("HSTS defaults to one year with no subdomain or preload commitment", () => {
  const hsts = buildStrictTransportSecurity();

  assert.equal(hsts, "max-age=31536000");
  assert.ok(!hsts.includes("includeSubDomains"));
  assert.ok(!hsts.includes("preload"));
});

test("HSTS subdomain and preload opt-ins are explicit", () => {
  process.env.HSTS_INCLUDE_SUBDOMAINS = "true";
  process.env.HSTS_PRELOAD = "true";
  process.env.HSTS_MAX_AGE = "600";
  try {
    assert.equal(buildStrictTransportSecurity(), "max-age=600; includeSubDomains; preload");
  } finally {
    delete process.env.HSTS_INCLUDE_SUBDOMAINS;
    delete process.env.HSTS_PRELOAD;
    delete process.env.HSTS_MAX_AGE;
  }
});