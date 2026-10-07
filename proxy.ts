import { NextRequest, NextResponse } from "next/server";
import type { ResponseCookies } from "next/dist/server/web/spec-extension/cookies";
import type { RequestCookies } from "next/dist/server/web/spec-extension/cookies";
import { updateSession } from "@insforge/sdk/ssr";
import type { CookieOptions, CookieStore } from "@insforge/sdk/ssr";

import { AUTH_COOKIE_SETTINGS } from "@/lib/auth-cookies";
import {
  buildContentSecurityPolicy,
  createNonce,
} from "@/lib/security-headers";

function createCookieStoreAdapter(
  cookies: RequestCookies | ResponseCookies,
): CookieStore {
  function setCookie(
    name: string,
    value: string,
    options?: CookieOptions,
  ): unknown;
  function setCookie(
    options: { name: string; value: string } & CookieOptions,
  ): unknown;
  function setCookie(
    nameOrOptions: string | ({ name: string; value: string } & CookieOptions),
    value?: string,
    options?: CookieOptions,
  ): unknown {
    if (typeof nameOrOptions === "string") {
      cookies.set({ name: nameOrOptions, value: value ?? "", ...options });
      return;
    }

    cookies.set(nameOrOptions);
    return undefined;
  }

  function deleteCookie(name: string): unknown;
  function deleteCookie(options: { name: string } & CookieOptions): unknown;
  function deleteCookie(
    nameOrOptions: string | ({ name: string } & CookieOptions),
  ): unknown {
    cookies.delete(
      typeof nameOrOptions === "string" ? nameOrOptions : nameOrOptions.name,
    );
    return undefined;
  }

  return {
    get: (name: string) => cookies.get(name),
    set: setCookie,
    delete: deleteCookie,
  };
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  // Every route this proxy owns is dynamically rendered, so a per-request
  // nonce can be injected into the HTML. Next.js reads it back out of the CSP
  // request header during SSR and stamps it on its own framework scripts, the
  // page bundles and its inline flight payload — so nothing here needs to be
  // nonced by hand.
  const nonce = createNonce();
  const contentSecurityPolicy = buildContentSecurityPolicy({ nonce });

  const requestHeaders = new Headers(request.headers);
  // Next.js extracts the nonce from the CSP header itself; x-nonce is only for
  // a Server Component that needs to pass it to a <Script nonce> directly.
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  // Redirect responses are not documents, but carrying the policy keeps the
  // header set uniform on every route this proxy touches.
  const withSecurityHeaders = (redirect: NextResponse): NextResponse => {
    redirect.headers.set("Content-Security-Policy", contentSecurityPolicy);
    return redirect;
  };

  let session;
  try {
    session = await updateSession({
      ...AUTH_COOKIE_SETTINGS,
      requestCookies: createCookieStoreAdapter(request.cookies),
      responseCookies: createCookieStoreAdapter(response.cookies),
    });
  } catch (error) {
    // updateSession throws (rather than returning an error) when the InsForge
    // env vars are missing. Fail closed to the login page with a real message
    // instead of returning an unhandled 500 on every matched route.
    console.error("[proxy] updateSession", error);
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/login?error=server", request.url)),
    );
  }

  if (!session.accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return response;
}

export const config = {
  // Must stay a static literal: Next.js parses `config` at build time, so it
  // cannot be derived from PROXY_OWNED_ROUTE_PREFIXES. tests/security-headers
  // .test.ts asserts the two lists stay identical.
  matcher: [
    "/home/:path*",
    "/jobs/:path*",
    "/applications/:path*",
    "/resumes/:path*",
    "/profile/:path*",
  ],
};
