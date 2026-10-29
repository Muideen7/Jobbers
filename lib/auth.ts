// lib/auth.ts
import { auth, handlers } from "@/lib/betterAuth";
import { getCollection } from "@/lib/mongodb";
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
 * Resolves avatar photo from Google or GitHub if available.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const headerList = await headers();
    const session = await auth.api.getSession({
      headers: headerList,
    });
    if (!session?.user) return null;
    const user = session.user as AuthUser;

    if (user.image) {
      return user;
    }

    // Fallback: check if the user has an OAuth account in MongoDB (Google or GitHub)
    try {
      const accountColl = await getCollection("account");
      const oauthAccount = await accountColl.findOne({
        userId: user.id,
        providerId: { $in: ["google", "github"] },
      });

      if (oauthAccount) {
        let avatarUrl: string | null = null;

        if (oauthAccount.providerId === "github" && oauthAccount.accountId) {
          avatarUrl = `https://avatars.githubusercontent.com/u/${oauthAccount.accountId}`;
        } else if (oauthAccount.providerId === "google" && oauthAccount.idToken) {
          try {
            const parts = String(oauthAccount.idToken).split(".");
            const payloadPart = parts[1];
            if (payloadPart) {
              const payload = JSON.parse(
                Buffer.from(payloadPart, "base64url").toString("utf8"),
              );
              if (payload && typeof payload.picture === "string") {
                avatarUrl = payload.picture;
              }
            }
          } catch {
            // ignore jwt parse error
          }
        }

        if (avatarUrl) {
          user.image = avatarUrl;
          const userColl = await getCollection("user");
          await userColl.updateOne(
            { id: user.id },
            { $set: { image: avatarUrl } },
          );
        }
      }
    } catch (resolveErr) {
      console.warn("[lib/auth:getCurrentUser] avatar resolve error", resolveErr);
    }

    return user;
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
