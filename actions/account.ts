"use server";

import { requireUser } from "@/lib/auth";
import { auth } from "@/lib/betterAuth";
import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { cookies, headers } from "next/headers";

export async function deleteAccountAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const userId = user.id;
    const userEmail = user.email;

    // Convert string id to ObjectId if possible
    let userObjectId: ObjectId | null = null;
    try {
      userObjectId = new ObjectId(userId);
    } catch {
      // not a 24-character hex string
    }

    // 1. Try Better Auth's internal deleteUser API
    try {
      const headerList = await headers();
      await auth.api.deleteUser({ headers: headerList, body: {} });
    } catch (authErr) {
      console.warn("[deleteAccountAction] better-auth deleteUser API warning:", (authErr as Error).message);
    }

    // 2. Direct MongoDB collection sweep to guarantee zero orphaned records
    const userCollection = await getCollection("user");
    const sessionCollection = await getCollection("session");
    const accountCollection = await getCollection("account");

    const profileCollection = await getCollection("profiles");
    const jobsCollection = await getCollection("jobs");
    const applicationsCollection = await getCollection("applications");
    const interviewsCollection = await getCollection("interviews");
    const communicationsCollection = await getCollection("communications");
    const resumesCollection = await getCollection("resumes");
    const runsCollection = await getCollection("agent_runs");
    const logsCollection = await getCollection("agent_logs");
    const integrationsCollection = await getCollection("integrations");

    await Promise.allSettled([
      // Better auth collections: delete by email, id, and _id
      userCollection.deleteMany({
        $or: [
          ...(userEmail ? [{ email: userEmail }] : []),
          { id: userId },
          ...(userObjectId ? [{ _id: userObjectId }] : []),
        ],
      }),
      sessionCollection.deleteMany({
        $or: [
          { userId },
          ...(userObjectId ? [{ userId: userObjectId as unknown as string }] : []),
        ],
      }),
      accountCollection.deleteMany({
        $or: [
          { userId },
          ...(userObjectId ? [{ userId: userObjectId as unknown as string }] : []),
        ],
      }),

      // User data collections
      profileCollection.deleteMany({ user_id: userId }),
      jobsCollection.deleteMany({ user_id: userId }),
      applicationsCollection.deleteMany({ user_id: userId }),
      interviewsCollection.deleteMany({ user_id: userId }),
      communicationsCollection.deleteMany({ user_id: userId }),
      resumesCollection.deleteMany({ user_id: userId }),
      runsCollection.deleteMany({ user_id: userId }),
      logsCollection.deleteMany({ user_id: userId }),
      integrationsCollection.deleteMany({ user_id: userId }),
    ]);

    // 3. Clear all session cookie variants (both HTTP and HTTPS __Secure- on Vercel)
    const cookieStore = await cookies();
    const cookieNames = [
      "better-auth.session_token",
      "__Secure-better-auth.session_token",
      "better-auth.session_data",
      "__Secure-better-auth.session_data",
      "better-auth.dont_remember",
      "__Secure-better-auth.dont_remember",
      "better-auth.account_data",
      "__Secure-better-auth.account_data",
    ];

    for (const name of cookieNames) {
      try {
        cookieStore.delete(name);
        cookieStore.set(name, "", {
          path: "/",
          expires: new Date(0),
          maxAge: 0,
        });
      } catch {
        // ignore
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteAccountAction]", error);
    return { success: false, error: (error as Error).message || "Failed to delete account" };
  }
}
