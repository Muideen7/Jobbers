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

/**
 * `posthog.init` warns "You have already initialized PostHog! Re-initializing is a
 * no-op" and then throws away the new config. The guard makes init idempotent so
 * multiple entry points (root instrumentation-client, a mounted provider, a layout
 * re-render) cannot fight over it.
 */
let initialized = false;

/**
 * Build the object handed to `posthog.init`.
 *
 * Every option here that is not `capture_pageview` exists to stop the SDK from
 * lazily fetching a bundle from us-assets.i.posthog.com. Any ad blocker that
 * blocks that host turns each attempt into a console error:
 *
 *   [SessionRecording] could not load recorder
 *   [Dead Clicks] failed to load script
 *   [PostHog.js] [ExceptionAutocapture] "failed to load script"
 *
 * None of those features are used by this app, so nothing is lost by opting out.
 * `capture_exceptions: false` in particular is free: there is no error boundary
 * and no manual `posthog.captureException()` call anywhere in the codebase.
 *
 * Exported so tests can assert on the real config instead of grepping this file.
 */
export function buildPostHogConfig(host?: string) {
  return {
    // Omitted rather than passed as `undefined`: a missing api_host tells the SDK
    // to use its own default, and a conditional spread also keeps this free of an
    // explicit `undefined` (which exactOptionalPropertyTypes rejects). Callers
    // read process.env.NEXT_PUBLIC_POSTHOG_HOST as a single static access so
    // Next.js can inline it into the browser bundle.
    ...(host ? { api_host: host } : {}),
    capture_pageview: true,
    disable_session_recording: true,
    capture_exceptions: false as const,
    capture_dead_clicks: false,
    capture_performance: false,
    autocapture: false,
    debug: process.env.NODE_ENV === "development",
  };
}

export function initPostHog(): void {
  const token = getPostHogToken();
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!token || initialized || typeof window === "undefined") {
    return;
  }

  initialized = true;

  posthog.init(token, buildPostHogConfig(host));
}

export function identifyPostHogUser(userId: string): void {
  if (!getPostHogToken() || !initialized) {
    return;
  }

  posthog.identify(userId, { userId });
}

export function resetPostHogUser(): void {
  if (!getPostHogToken() || !initialized) {
    return;
  }

  posthog.reset();
}
