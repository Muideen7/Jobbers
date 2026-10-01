import React from "react";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";

import { getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { generateJson } from "@/lib/llm";
import type { Profile } from "@/types";
import { ResumePDF, type GeneratedContent } from "./ResumePDF";

function createResumeDocument(
  profile: Profile,
  generated: GeneratedContent,
): React.ReactElement<DocumentProps> {
  // ResumePDF renders a @react-pdf <Document>; the cast bridges React's component
  // prop inference to the renderer's document element type.
  return (
    <ResumePDF profile={profile} generated={generated} />
  ) as unknown as React.ReactElement<DocumentProps>;
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

    const insforge = await createInsforgeServer();

    const { data: profile, error: profileError } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle<Profile>();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 },
      );
    }

    // Generate polished resume content with Gemini
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

    // Render PDF buffer server-side
    const buffer = await renderToBuffer(createResumeDocument(profile, generated));

    // Remove existing file then upload fresh (SDK has no upsert — matches actions/profile.ts pattern)
    const path = `${user.id}/resume.pdf`;
    await insforge.storage.from("resumes").remove(path);

    // InsForge storage upload expects a Blob — wrap the Node Buffer.
    // Cast to ArrayBuffer to satisfy strict TS — Buffer is a safe subtype at runtime.
    const blob = new Blob([buffer as unknown as ArrayBuffer], {
      type: "application/pdf",
    });

    const { error: uploadError } = await insforge.storage
      .from("resumes")
      .upload(path, blob);

    if (uploadError) {
      console.error("[api/resume/generate] storage upload", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to upload resume" },
        { status: 500 },
      );
    }

    const { error: dbError } = await insforge.database
      .from("profiles")
      .update({ resume_pdf_url: path })
      .eq("id", user.id);

    if (dbError) {
      console.error("[api/resume/generate] db update", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to save resume URL" },
        { status: 500 },
      );
    }

    revalidatePath("/profile");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/resume/generate]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
