import type { Metadata } from "next";

import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { ProfileAttentionBanner } from "@/components/profile/ProfileAttentionBanner";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { calculateCompletion } from "@/lib/profile-utils";
import { privateMetadata } from "../../private-metadata";
import type { Job, Profile } from "@/types";

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
  const insforge = await createInsforgeServer();

  const [{ data: profile }, { data: jobRows, count: totalCount }] = await Promise.all([
    insforge.database
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle<Profile>(),
    insforge.database
      .from("jobs")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("match_score", { ascending: false, nullsFirst: false })
      .range(0, 99)
      .returns<Job[]>(),
  ]);

  const jobs = (jobRows ?? []).slice(0, 100);

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
        totalCount={totalCount ?? jobs.length}
        profileName={profile?.full_name ?? null}
      />
    </div>
  );
}