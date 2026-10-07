import assert from "node:assert/strict";
import { test } from "node:test";

import { buildPostHogConfig } from "../lib/posthog-client.ts";

/**
 * These assert on the config object posthog.init actually receives, rather than
 * grepping the source. posthog-js is bundled and minified, so its internal flag
 * names can change between versions; what this app controls is the config, and
 * the mapping from config to "does it fetch a remote script" is posthog's
 * concern. See posthog-client.test.ts comments in lib/posthog-client.ts.
 */

test("exception autocapture is off, so no exception bundle is fetched", () => {
  // The reported bug: posthog.init with capture_exceptions: true makes the SDK
  // resolve loadExternalDependency("exception-autocapture"). When an ad blocker
  // blocks us-assets.i.posthog.com that rejects and logs
  // '[PostHog.js] [ExceptionAutocapture] "failed to load script"'.
  // posthog-js reads this exact key in tf()/isEnabled(); false short-circuits
  // startIfEnabledOrStop() to the stop path so the loader is never called.
  assert.equal(buildPostHogConfig().capture_exceptions, false);
});

test("every optional remote script is opted out of", () => {
  const config = buildPostHogConfig();

  // Each of these maps to a loadExternalDependency(...) call in posthog-js.
  assert.equal(config.disable_session_recording, true);
  assert.equal(config.capture_exceptions, false);
  assert.equal(config.capture_dead_clicks, false);
  assert.equal(config.capture_performance, false);
  assert.equal(config.autocapture, false);
});

test("heatmaps and surveys are off, so their bundles are never fetched", () => {
  const config = buildPostHogConfig();

  // Regression guard for two console errors seen on /home:
  //   [Dead Clicks] failed to load script
  //   [Surveys] Failed to fetch config
  // Measured against posthog-js 1.434.18 with the live remote config:
  //   capture_dead_clicks: false alone still requested
  //   us-assets.i.posthog.com/static/.../dead-clicks-autocapture.js,
  //   because dead-click autocapture ships inside the *heatmaps* bundle and
  //   the SDK resolves the bundle from its defaults before any narrower flag
  //   or the remote config has a say. `capture_heatmaps: false` is the flag
  //   that actually stops the request; `disable_surveys: true` is the one
  //   that stops surveys.js.
  // Verified: with both set, a page load makes zero requests to
  // us-assets.i.posthog.com other than remote config.
  assert.equal(config.capture_heatmaps, false);
  assert.equal(config.disable_surveys, true);
});

test("pageview capture stays on", () => {
  // The one feature the app does rely on. Guarded so a future edit cannot
  // disable analytics along with the unused scripts.
  assert.equal(buildPostHogConfig().capture_pageview, true);
});

test("api_host is omitted rather than set to undefined when unconfigured", () => {
  // Posthog treats an absent api_host as "use the default". Assigning
  // `undefined` explicitly would also trip exactOptionalPropertyTypes.
  assert.ok(!("api_host" in buildPostHogConfig()));
  assert.ok(!("api_host" in buildPostHogConfig(undefined)));
});

test("a configured host is passed through", () => {
  assert.equal(
    buildPostHogConfig("https://eu.i.posthog.com").api_host,
    "https://eu.i.posthog.com",
  );
});