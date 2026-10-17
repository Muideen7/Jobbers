export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { ProfileAttentionBanner } from "@/components/profile/ProfileAttentionBanner";
import { requireUser } from "@/lib/auth";
import { getCollection, serializeMongo } from "@/lib/mongodb";
import { getUserProfile, isProfileComplete, calculateCompletion } from "@/lib/profile";
import { privateMetadata } from "../../private-metadata";
import type { Job } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Dashboard",
  "Your Jobbers workspace: find roles, review AI match analysis and company research.",
);

/**
 * Workspace root. Server-side it fetches the profile (completion banner +
 * greeting) and the top 100 scored jobs; everything after that — filters,
 * selection, live search, research refresh — happens in DashboardClient.
 */
export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);
  const profileComplete = isProfileComplete(profile);

  const jobsCollection = await getCollection<Job>("jobs");

  const [rawJobs, researchedJobsCount] = profileComplete
    ? await Promise.all([
        jobsCollection
          .find({ user_id: user.id })
          .sort({ match_score: -1 })
          .limit(100)
          .toArray(),
        jobsCollection.countDocuments({
          user_id: user.id,
          company_research: { $exists: true, $ne: null },
        }),
      ])
    : [[], 0];

  const jobs: Job[] = serializeMongo(
    rawJobs.map((job) => {
      const { _id, ...rest } = job as unknown as { _id?: unknown } & Job;
      return {
        ...rest,
        id: job.id || (_id ? String(_id) : ""),
        company_research: job.company_research ?? null,
      };
    }),
  );
  const totalCount = jobs.length;

  const { completionPercent, missingFields } = calculateCompletion(
    profile ?? {
      full_name: null,
      phone: null,
      location: null,
      current_title: null,
      experience_level: null,
      years_experience: null,
      skills: [],
      work_experience: null,
      education: null,
    },
  );

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {completionPercent < 100 && (
        <ProfileAttentionBanner
          completionPercent={completionPercent}
          missingFields={missingFields}
        />
      )}
      <DashboardClient
        initialJobs={jobs}
        totalCount={totalCount}
        profileName={profile?.full_name ?? null}
        profileComplete={profileComplete}
        researchedCount={researchedJobsCount}
      />
    </div>
  );
}