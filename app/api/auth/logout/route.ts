import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies, createServerClient } from "@insforge/sdk/ssr";

import { getInsforgeEnv } from "@/lib/insforge-server";

// Sign-out must not be a GET. A state-changing GET is reachable by any
// cross-origin top-level navigation, which lets a third-party page force a
// logout on a logged-in visitor (SameSite=Lax still sends the cookie).
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const insforge = createServerClient({
      ...getInsforgeEnv(),
      cookies: request.cookies,
    });

    await insforge.auth.signOut();
  } catch (error) {
    // Sign-out still clears the local cookies below, so the user ends up signed
    // out either way. Logged because a failed revoke means the refresh token may
    // remain valid server-side.
    console.error("[api/auth/logout] signOut", error);
  }

  // 303 so the browser follows up with a GET instead of re-POSTing to "/".
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  clearAuthCookies(response.cookies);

  return response;
}