import type { setAuthCookies } from "@insforge/sdk/ssr";

// AuthCookieSettings is internal to the SDK's type graph, so derive it from the
// signature instead of pinning a shape that could drift.
type AuthCookieSettings = NonNullable<Parameters<typeof setAuthCookies>[2]>;

/**
 * The SDK writes the access-token cookie with `httpOnly: false` by default
 * (see `accessTokenCookieOptions` in @insforge/sdk) while the refresh token is
 * httpOnly. Nothing in this app reads the access token client-side — every
 * session check runs server-side through `lib/auth.ts` — so the flag is pure
 * downside: it leaves a bearer JWT readable by any script on the origin.
 *
 * Applied at all three sites that write auth cookies: the OAuth callback, the
 * proxy session refresh, and /api/auth/refresh. Missing one would let a later
 * refresh silently restore the readable cookie.
 */
export const AUTH_COOKIE_SETTINGS: AuthCookieSettings = {
  options: {
    accessToken: { httpOnly: true },
  },
};