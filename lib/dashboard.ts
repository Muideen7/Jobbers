// lib/dashboard.ts

import { getCollection } from "@/lib/mongodb";
import type { Profile, Application } from "@/types/database";

/**
 * Serialize MongoDB ObjectId and Date values to strings.
 * All service functions should return plain JSON‑serializable data.
 */
function serialize<T extends Record<string, unknown>>(doc: T): T {
  const copy = { ...doc } as Record<string, unknown>;
  if (copy._id && typeof copy._id === "object" && "toString" in copy._id) {
    copy._id = copy._id.toString();
  }
  if (copy.createdAt instanceof Date) copy.createdAt = copy.createdAt.toISOString();
  if (copy.updatedAt instanceof Date) copy.updatedAt = copy.updatedAt.toISOString();
  if (copy.appliedAt instanceof Date) copy.appliedAt = copy.appliedAt.toISOString();
  return copy as T;
}

/** Get the current user's profile. */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const profiles = await getCollection<Profile>("profiles");
  const doc = await profiles.findOne({ userId });
  return doc ? serialize(doc) : null;
}

/** KPI: total applications count for the user. */
export async function getTotalApplications(userId: string): Promise<number> {
  const apps = await getCollection<Application>("applications");
  return await apps.countDocuments({ userId });
}

/** KPI: count per stage. */
export async function getApplicationsByStage(userId: string): Promise<Record<string, number>> {
  const apps = await getCollection<Application>("applications");
  const pipeline = [
    { $match: { userId } },
    { $group: { _id: "$stage", count: { $sum: 1 } } },
  ];
  const agg = await apps.aggregate(pipeline).toArray();
  const result: Record<string, number> = {};
  for (const { _id, count } of agg) {
    result[_id] = count;
  }
  return result;
}

/** KPI: average AI fit score (0‑100). */
export async function getAverageFitScore(userId: string): Promise<number> {
  const apps = await getCollection<Application>("applications");
  const pipeline = [
    { $match: { userId } },
    { $group: { _id: null, avgScore: { $avg: "$matchScore" } } },
  ];
  const agg = await apps.aggregate(pipeline).toArray();
  if (agg.length === 0) return 0;
  const avg = agg[0]?.avgScore;
  return typeof avg === "number" ? Math.round(avg) : 0;
}

/** KPI: saved jobs count (applications in "Saved" stage). */
export async function getSavedJobsCount(userId: string): Promise<number> {
  const apps = await getCollection<Application>("applications");
  return await apps.countDocuments({ userId, stage: "Saved" });
}

/** Combined dashboard data */
export async function getDashboardData(userId: string) {
  const [profile, totalApps, byStage, avgScore, savedCount] = await Promise.all([
    getUserProfile(userId),
    getTotalApplications(userId),
    getApplicationsByStage(userId),
    getAverageFitScore(userId),
    getSavedJobsCount(userId),
  ]);

  return {
    profile,
    totalApplications: totalApps,
    applicationsByStage: byStage,
    averageFitScore: avgScore,
    savedJobsCount: savedCount,
  };
}
