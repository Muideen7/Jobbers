import assert from "node:assert/strict";
import { test } from "node:test";

import {
  accessTokenCookieOptions,
  setAuthCookies,
  type CookieOptions,
} from "@insforge/sdk/ssr";

import { AUTH_COOKIE_SETTINGS } from "../lib/auth-cookies.ts";

function fakeJwt(claims: Record<string, unknown>): string {
  const segment = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${segment({ alg: "HS256", typ: "JWT" })}.${segment(claims)}.signature`;
}

// Typed as the SDK's own CookieOptions rather than Record<string, unknown>.
// The loose version type-checked `assert.equal(call.options.httpOnly, true)`
// while actually comparing `unknown`, so a typo'd or renamed cookie flag could
// never have failed this test.
type Recorded = { name: string; value: string; options: CookieOptions };

function recordingWriter() {
  const calls: Recorded[] = [];
  return {
    calls,
    set(name: string, value: string, options: CookieOptions) {
      calls.push({ name, value, options });
    },
  };
}

const ACCESS_TOKEN = fakeJwt({ sub: "user-1", exp: Math.floor(Date.now() / 1000) + 900 });
const REFRESH_TOKEN = fakeJwt({ sub: "user-1", exp: Math.floor(Date.now() / 1000) + 604800 });

test("the access token is HttpOnly once our settings are applied", () => {
  const writer = recordingWriter();

  setAuthCookies(
    writer,
    { accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN },
    AUTH_COOKIE_SETTINGS,
  );

  const access = writer.calls.find((call) => call.name.includes("access"));
  assert.ok(access, "access-token cookie was not written");
  assert.equal(access.options.httpOnly, true);
});

test("the SDK default leaves the access token script-readable, so the override is load-bearing", () => {
  // Guards against someone deleting AUTH_COOKIE_SETTINGS from a call site: with
  // the bare SDK default this flips back to false and the test above fails.
  const bare = accessTokenCookieOptions(ACCESS_TOKEN);

  assert.equal(bare.httpOnly, false);
});

test("the refresh token stays HttpOnly", () => {
  const writer = recordingWriter();

  setAuthCookies(
    writer,
    { accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN },
    AUTH_COOKIE_SETTINGS,
  );

  const refresh = writer.calls.find((call) => call.name.includes("refresh"));
  assert.ok(refresh, "refresh-token cookie was not written");
  assert.equal(refresh.options.httpOnly, true);
});

test("the override does not clobber the SDK's other cookie defaults", () => {
  const options = accessTokenCookieOptions(ACCESS_TOKEN, {
    httpOnly: true,
  });

  assert.equal(options.path, "/");
  assert.equal(options.sameSite, "lax");
  assert.equal(typeof options.secure, "boolean");
  assert.ok(options.expires instanceof Date, "JWT exp should still drive cookie expiry");
});

test("both tokens are written, so the override cannot silently drop one", () => {
  const writer = recordingWriter();

  setAuthCookies(
    writer,
    { accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN },
    AUTH_COOKIE_SETTINGS,
  );

  assert.equal(writer.calls.length, 2);
  assert.ok(writer.calls.every((call) => call.options.httpOnly === true));
});

test("a missing refresh token does not break the access-token write", () => {
  const writer = recordingWriter();

  setAuthCookies(writer, { accessToken: ACCESS_TOKEN }, AUTH_COOKIE_SETTINGS);

  assert.equal(writer.calls.length, 1);

  const [call] = writer.calls;
  assert.ok(call, "expected the access-token cookie to be written");
  assert.equal(call.options.httpOnly, true);
});