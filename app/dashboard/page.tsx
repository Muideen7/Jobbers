import type { Metadata } from "next";

import { PostHogIdentify } from "@/components/analytics/PostHogIdentify";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { ProfileAttentionBanner } from "@/components/profile/ProfileAttentionBanner";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { calculateCompletion } from "@/lib/profile-utils";
import { privateMetadata } from "../private-metadata";
import type { Job, Profile } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Dashboard",
  "Your Jobbers workspace: find roles, review AI match analysis and company research.",
);

type DashboardPageProps = {
  searchParams: Promise<{ q?: string }>;
};

/**
 * Workspace root. Server-side it fetches the profile (completion banner +
 * nav identity) and the top 100 scored jobs; everything after that — filters,
 * selection, live search, research refresh — happens in DashboardClient.
 */
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { q = "" } = await searchParams;
  const user = await requireUser();
  const insforge = await createInsforgeServer();

  const [{ data: profile }, { data: jobRows }] = await Promise.all([
    insforge.database
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle<Profile>(),
    insforge.database
      .from("jobs")
      .select("*")
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
    <>
      <PostHogIdentify userId={user.id} />
      <DashboardNav
        user={{
          name: profile?.full_name ?? null,
          email: profile?.email ?? null,
        }}
        initialQuery={q}
      />
      <main className="mx-auto max-w-[1600px] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5">
          {completionPercent < 100 && (
            <ProfileAttentionBanner
              completionPercent={completionPercent}
              missingFields={missingFields}
            />
          )}
          <DashboardClient initialJobs={jobs} initialQuery={q} />
        </div>
      </main>
    </>
  );
}