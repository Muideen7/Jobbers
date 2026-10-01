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

export function initPostHog(): void {
  const token = getPostHogToken();
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!token || initialized || typeof window === "undefined") {
    return;
  }

  initialized = true;

  posthog.init(token, {
    api_host: host,
    capture_pageview: true,
    capture_exceptions: true,
    // Opt out of every optional remote script. These load bundles from
    // us-assets.i.posthog.com on demand and each failure logs
    // "[SessionRecording] could not load recorder" / "[Dead Clicks] failed to
    // load script". None of them are used by this app.
    disable_session_recording: true,
    capture_dead_clicks: false,
    capture_performance: false,
    autocapture: false,
    debug: process.env.NODE_ENV === "development",
  });
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
