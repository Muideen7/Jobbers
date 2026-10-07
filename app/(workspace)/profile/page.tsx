export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { calculateCompletion } from "@/lib/profile-utils";
import { privateMetadata } from "../../private-metadata";
import type { Profile } from "@/types";

export const metadata: Metadata = privateMetadata(
  "Profile",
  "Your Jobbers profile — the skills and experience used to score every role.",
);

export default async function ProfilePage() {
  const user = await requireUser();
  const insforge = await createInsforgeServer();

  const { data: profile } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const { completionPercent, missingFields } = calculateCompletion({
    full_name: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    location: profile?.location ?? null,
    current_title: profile?.current_title ?? null,
    experience_level: profile?.experience_level ?? null,
    years_experience: profile?.years_experience ?? null,
    skills: profile?.skills ?? [],
    work_experience: profile?.work_experience ?? null,
    education: profile?.education ?? null,
  });

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <ProfileOverview
        completionPercent={completionPercent}
        missingFields={missingFields}
        profile={profile ?? null}
      />
      <ProfilePageClient profile={profile ?? null} />
    </div>
  );
}