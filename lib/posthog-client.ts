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
 *   [Surveys] Failed to fetch config
 *   [PostHog.js] [ExceptionAutocapture] "failed to load script"
 *
 * None of those features are used by this app, so nothing is lost by opting out.
 * `capture_exceptions: false` in particular is free: there is no error boundary
 * and no manual `posthog.captureException()` call anywhere in the codebase.
 *
 * Two of these flags are load-bearing and non-obvious, because the SDK decides
 * whether to fetch a bundle from its *defaults* before the remote config (or the
 * narrower local flag) has any say:
 *
 *   - `capture_heatmaps: false` is what actually stops `dead-clicks-autocapture.js`.
 *     Dead-click autocapture ships inside the heatmaps bundle, so
 *     `capture_dead_clicks: false` alone still fetched the script and only then
 *     found out it had nothing to do. Keep both.
 *   - `disable_surveys: true` is what stops `surveys.js`; a `surveys: false`
 *     remote config arrives too late to prevent the fetch.
 *
 * Do not add `disable_external_dependency_loading: true` here: it would also
 * stop the PostHog toolbar (`toolbar.js`), which is the one external dependency
 * this app may still want while tuning analytics.
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
    capture_heatmaps: false,
    disable_surveys: true,
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
