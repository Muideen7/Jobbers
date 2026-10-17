import { NextRequest, NextResponse } from "next/server";


import { createNonce, buildContentSecurityPolicy } from "@/lib/security-headers";






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
    "/analytics/:path*",
    "/company-research/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
