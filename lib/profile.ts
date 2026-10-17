import "server-only";
import { ObjectId, type Filter } from "mongodb";
import { getCollection } from "@/lib/mongodb";
import type { Profile } from "@/types";

type ProfileDoc = Profile & {
  _id?: ObjectId | string;
  userId?: string;
};

function buildProfileFilter(userId: string): Filter<ProfileDoc> {
  const filters: Filter<ProfileDoc>[] = [
    { id: userId } as Filter<ProfileDoc>,
    { userId } as Filter<ProfileDoc>,
  ];
  if (ObjectId.isValid(userId)) {
    filters.push({ _id: new ObjectId(userId) } as Filter<ProfileDoc>);
  }
  return { $or: filters };
}

/**
 * Fetch a user profile from MongoDB by user ID or email.
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    const collection = await getCollection<ProfileDoc>("profiles");
    const doc = await collection.findOne(buildProfileFilter(userId));
    if (!doc) return null;
    return {
      ...doc,
      id: userId,
      _id: doc._id ? String(doc._id) : undefined,
    } as Profile;
  } catch (error) {
    console.error("[lib/profile:getUserProfile]", error);
    return null;
  }
}

/**
 * Upsert a user profile in MongoDB.
 */
export async function upsertUserProfile(
  userId: string,
  data: Partial<Profile>,
): Promise<Profile | null> {
  try {
    const collection = await getCollection<ProfileDoc>("profiles");
    const now = new Date().toISOString();
    await collection.updateOne(
      buildProfileFilter(userId),
      {
        $set: {
          id: userId,
          userId: userId,
          ...data,
          updated_at: now,
        },
        $setOnInsert: {
          created_at: now,
        },
      },
      { upsert: true },
    );
    return await getUserProfile(userId);
  } catch (error) {
    console.error("[lib/profile:upsertUserProfile]", error);
    return null;
  }
}

export { isProfileComplete, calculateCompletion } from "./profile-utils";
