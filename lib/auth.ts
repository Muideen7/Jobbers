// lib/auth.ts
import { auth, handlers } from "@/lib/betterAuth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Get the currently logged-in user. Returns null if no session.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const headerList = await headers();
    const session = await auth.api.getSession({
      headers: headerList,
    });
    if (!session?.user) return null;
    return session.user as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Ensure a user is logged in. Redirects to /login if not.
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export { auth, handlers };

export async function getPostLoginRedirectPath(userId?: string): Promise<string> {
  if (userId) return "/home";
  return "/home";
}
