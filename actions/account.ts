"use server";

import { requireUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function deleteAccountAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const userId = user.id;

    // Convert string id to ObjectId for user collection if needed
    let userObjectId: ObjectId | null = null;
    try {
      userObjectId = new ObjectId(userId);
    } catch {
      // not a valid hex string, fallback to string id
    }

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

    await Promise.allSettled([
      // Better auth collections
      userCollection.deleteOne({ $or: [{ id: userId }, ...(userObjectId ? [{ _id: userObjectId }] : [])] }),
      sessionCollection.deleteMany({ userId }),
      accountCollection.deleteMany({ userId }),

      // User data collections
      profileCollection.deleteMany({ user_id: userId }),
      jobsCollection.deleteMany({ user_id: userId }),
      applicationsCollection.deleteMany({ user_id: userId }),
      interviewsCollection.deleteMany({ user_id: userId }),
      communicationsCollection.deleteMany({ user_id: userId }),
      resumesCollection.deleteMany({ user_id: userId }),
      runsCollection.deleteMany({ user_id: userId }),
      logsCollection.deleteMany({ user_id: userId }),
    ]);

    // Clear session cookies
    const cookieStore = await cookies();
    cookieStore.delete("better-auth.session_token");
    cookieStore.delete("better-auth.session_data");
  } catch (error) {
    console.error("[deleteAccountAction]", error);
    return { success: false, error: (error as Error).message || "Failed to delete account" };
  }

  redirect("/login?deleted=1");
}
