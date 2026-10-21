export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { AiResumeClient } from "@/components/ai-resume/AiResumeClient";
import { requireUser } from "@/lib/auth";
import { getCollection, serializeMongo } from "@/lib/mongodb";
import { getUserProfile } from "@/lib/profile";
import { listUserResumes } from "@/lib/resumes";
import { privateMetadata } from "../../private-metadata";
import type { Job } from "@/types";

export const metadata: Metadata = privateMetadata(
  "AI Resume Studio",
  "Tailor your resume specifically for roles in your pipeline, emphasize missing skills, and export ATS-ready PDFs.",
);

export default async function AiResumePage() {
  const user = await requireUser();
  const jobsCollection = await getCollection<Job>("jobs");

  const [profile, resumes, jobs] = await Promise.all([
    getUserProfile(user.id),
    listUserResumes(user.id),
    jobsCollection
      .find({ user_id: user.id })
      .project({
        id: 1,
        title: 1,
        company: 1,
        location: 1,
        match_score: 1,
        matched_skills: 1,
        missing_skills: 1,
        about_role: 1,
      })
      .sort({ match_score: -1, found_at: -1 })
      .limit(60)
      .toArray() as Promise<unknown> as Promise<Job[]>,
  ]);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <AiResumeClient
        profile={serializeMongo(profile)}
        initialResumes={serializeMongo(resumes ?? [])}
        jobs={serializeMongo(jobs ?? [])}
        existingResumeUrl={profile?.resume_pdf_url ?? null}
      />
    </div>
  );
}
