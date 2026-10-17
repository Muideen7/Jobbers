import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/betterAuth";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch (error) {
    console.error("[api/auth/logout] signOut", error);
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.delete("better-auth.session_token");
  response.cookies.delete("__Secure-better-auth.session_token");

  return response;
}