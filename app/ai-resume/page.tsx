import type { Metadata } from "next";

import { PostHogIdentify } from "@/components/analytics/PostHogIdentify";
import { AiResumeClient } from "@/components/ai-resume/AiResumeClient";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { privateMetadata } from "../private-metadata";
import type { Profile } from "@/types";

export const metadata: Metadata = privateMetadata(
  "AI Resume",
  "Upload a resume to extract your profile, download a tailored PDF, or find the perfect role.",
);

export default async function AiResumePage() {
  const user = await requireUser();
  const insforge = await createInsforgeServer();

  const { data: profile } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return (
    <>
      <PostHogIdentify userId={user.id} />
      <DashboardNav
        user={{
          name: profile?.full_name ?? null,
          email: profile?.email ?? null,
        }}
      />
      <main className="mx-auto max-w-[820px] px-4 pb-10 pt-8 sm:px-6 lg:px-0">
        <AiResumeClient existingResumeUrl={profile?.resume_pdf_url ?? null} />
      </main>
    </>
  );
}