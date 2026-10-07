import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthCookies,
  createServerClient,
  setAuthCookies,
} from "@insforge/sdk/ssr";

import { AUTH_COOKIE_SETTINGS } from "@/lib/auth-cookies";
import { getInsforgeEnv } from "@/lib/insforge-server";

const verifierCookieName = "jobbers_oauth_code_verifier";

type ProfileCompletionRow = {
  is_complete: boolean | null;
};

async function getRedirectPath(userId: string, accessToken: string): Promise<string> {
  const insforge = createServerClient({ ...getInsforgeEnv(), accessToken });
  const { data, error } = await insforge.database
    .from("profiles")
    .select("is_complete")
    .eq("id", userId)
    .maybeSingle<ProfileCompletionRow>();

  if (error || !data?.is_complete) {
    return "/profile";
  }

  return "/home";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const loginUrl = new URL("/login", request.url);

  try {
    const callbackError = request.nextUrl.searchParams.get("error");
    const code = request.nextUrl.searchParams.get("insforge_code");
    const codeVerifier = request.cookies.get(verifierCookieName)?.value;

    if (callbackError || !code || !codeVerifier) {
      loginUrl.searchParams.set("error", "callback");
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(verifierCookieName);
      clearAuthCookies(response.cookies);
      return response;
    }

    const insforge = createServerClient(getInsforgeEnv());
    const { data, error } = await insforge.auth.exchangeOAuthCode(
      code,
      codeVerifier,
    );

    if (error || !data?.accessToken || !data.user) {
      console.error("[auth/callback]", error);
      loginUrl.searchParams.set("error", "callback");
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(verifierCookieName);
      clearAuthCookies(response.cookies);
      return response;
    }

    const redirectPath = await getRedirectPath(data.user.id, data.accessToken);
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    // The one-time authorization code arrives on the query string of this URL.
    // Without this the same-origin redirect below hands the full query to
    // /profile as a Referer, which lands in request logs and in PostHog's
    // $referrer on the resulting pageview.
    response.headers.set("Referrer-Policy", "no-referrer");
    response.cookies.delete(verifierCookieName);
    // The SDK guards with `if (tokens.refreshToken)`, so an absent refresh token
    // and an explicit `undefined` behave identically. Building the object this
    // way keeps the key off entirely rather than assigning `undefined`, which
    // exactOptionalPropertyTypes rejects.
    const tokens: Parameters<typeof setAuthCookies>[1] = {
      accessToken: data.accessToken,
    };

    if (data.refreshToken) {
      tokens.refreshToken = data.refreshToken;
    }

    setAuthCookies(response.cookies, tokens, AUTH_COOKIE_SETTINGS);

    return response;
  } catch (error) {
    console.error("[auth/callback]", error);
    loginUrl.searchParams.set("error", "callback");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(verifierCookieName);
    clearAuthCookies(response.cookies);
    return response;
  }
}
