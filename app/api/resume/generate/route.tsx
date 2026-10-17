import React from "react";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { randomUUID } from "node:crypto";

import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { getUserProfile, upsertUserProfile } from "@/lib/profile";
import { generateJson } from "@/lib/llm";
import type { Profile, Resume } from "@/types";
import { ResumePDF, type GeneratedContent } from "./ResumePDF";

function createResumeDocument(
  profile: Profile,
  generated: GeneratedContent,
): React.ReactElement<DocumentProps> {
  return <ResumePDF profile={profile} generated={generated} />;
}

export async function POST(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const profile = await getUserProfile(user.id);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 },
      );
    }

    const profileContext = JSON.stringify({
      full_name: profile.full_name,
      current_title: profile.current_title,
      experience_level: profile.experience_level,
      years_experience: profile.years_experience,
      skills: profile.skills,
      industries: profile.industries,
      work_experience: profile.work_experience,
      education: profile.education,
      job_titles_seeking: profile.job_titles_seeking,
    });

    let generated: GeneratedContent;
    try {
      generated = (await generateJson({
        system:
          "You are a professional resume writer. Given a candidate's profile data, produce a 2-3 sentence professional summary paragraph and rewrite each work experience entry's responsibilities as 3-5 concise, achievement-focused bullet points starting with strong action verbs. Return only valid JSON.",
        prompt: `Generate polished resume content for this candidate and return JSON matching this exact shape:
{
  "summary": "string — 2-3 sentence professional summary",
  "work_experience": [
    {
      "company": "string",
      "title": "string",
      "start_date": "string",
      "end_date": "string | null",
      "is_current": false,
      "bullets": ["string", "string", "string"]
    }
  ]
}

Candidate profile:
${profileContext}`,
        temperature: 0.7,
        maxOutputTokens: 1000,
      })) as GeneratedContent;
    } catch (error) {
      console.error("[api/resume/generate] generation failed", error);
      return NextResponse.json(
        { success: false, error: "Failed to generate resume" },
        { status: 500 },
      );
    }

    const buffer = await renderToBuffer(createResumeDocument(profile, generated));
    const base64Data = Buffer.from(buffer).toString("base64");
    const now = new Date().toISOString();

    const resumesColl = await getCollection<Resume>("resumes");
    await resumesColl.updateMany({ user_id: user.id }, { $set: { is_primary: false } });

    await resumesColl.insertOne({
      id: randomUUID(),
      user_id: user.id,
      name: `${profile.full_name || "Professional"} Resume`,
      kind: "generated",
      target_role: null,
      target_company: null,
      template: null,
      storage_path: null,
      file_size: buffer.length,
      content: null,
      source_job_id: null,
      file_path: null,
      file_data: base64Data,
      is_primary: true,
      created_at: now,
      updated_at: now,
    });

    await upsertUserProfile(user.id, { resume_pdf_url: "generated" });

    revalidatePath("/profile");
    revalidatePath("/resumes");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/resume/generate]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
