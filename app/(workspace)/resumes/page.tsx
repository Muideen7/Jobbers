export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";

import { AiResumeClient } from "@/components/ai-resume/AiResumeClient";
import { requireUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile";
import { listUserResumes } from "@/lib/resumes";
import { privateMetadata } from "../../private-metadata";

export const metadata: Metadata = privateMetadata(
  "AI Resume",
  "Upload a resume to extract your profile, download a tailored PDF, or find the perfect role.",
);

export default async function AiResumePage() {
  const user = await requireUser();

  const [profile, resumes] = await Promise.all([
    getUserProfile(user.id),
    listUserResumes(user.id),
  ]);

  const hasResumes = resumes.length > 0;

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pb-12 pt-6 sm:px-6 lg:px-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">AI Resume</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {hasResumes
              ? "Manage your current resume and generate a new one."
              : "Upload a PDF to get started. We'll extract details and create a saved resume."}
          </p>
        </div>
        {hasResumes && (
          <Link
            href="/resumes/saved"
            className="text-sm font-medium text-accent hover:text-accent-hover"
          >
            View saved resumes
          </Link>
        )}
      </div>
      <AiResumeClient existingResumeUrl={profile?.resume_pdf_url ?? null} />
    </div>
  );
}