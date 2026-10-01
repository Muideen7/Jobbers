"use client";

import posthog from "posthog-js";

/**
 * Read the token via a single static property access. Next.js inlines
 * `process.env.NEXT_PUBLIC_FOO` at build time only when the access is
 * literal — wrapping it in an `a ?? b` chain leaves the first operand as a
 * runtime lookup on `process.env`, which is always undefined in the browser.
 */
function getPostHogToken(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
}

export function initPostHog(): void {
  const token = getPostHogToken();
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!token || typeof window === "undefined") {
    return;
  }

  posthog.init(token, {
    api_host: host,
    capture_pageview: true,
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
}

export function identifyPostHogUser(userId: string): void {
  if (!getPostHogToken()) {
    return;
  }

  posthog.identify(userId, { userId });
}

export function resetPostHogUser(): void {
  if (!getPostHogToken()) {
    return;
  }

  posthog.reset();
}
