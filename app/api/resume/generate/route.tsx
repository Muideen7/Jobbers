import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { randomUUID } from "node:crypto";

import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { getUserProfile, upsertUserProfile } from "@/lib/profile";
import { generateJson } from "@/lib/llm";
import type { Job, Profile, Resume } from "@/types";
import { ResumePDF, type GeneratedContent } from "./ResumePDF";

function createResumeDocument(
  profile: Profile,
  generated: GeneratedContent,
  targetRole?: string | null,
  targetCompany?: string | null,
): React.ReactElement<DocumentProps> {
  return (
    <ResumePDF
      profile={profile}
      generated={generated}
      targetRole={targetRole || null}
      targetCompany={targetCompany || null}
    />
  );
}

type RequestBody = {
  jobId?: string;
  targetRole?: string;
  targetCompany?: string;
  targetDescription?: string;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
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

    const body = (await req.json().catch(() => ({}))) as RequestBody;

    let targetJob: Job | null = null;
    if (body.jobId) {
      const jobsColl = await getCollection<Job>("jobs");
      targetJob = (await jobsColl.findOne({ id: body.jobId, user_id: user.id })) ??
        (await jobsColl.findOne({ id: body.jobId }));
    }

    const targetRole = targetJob?.title || body.targetRole || profile.current_title || "";
    const targetCompany = targetJob?.company || body.targetCompany || "";
    const jobDescription = targetJob?.about_role || body.targetDescription || "";
    const matchedSkills = targetJob?.matched_skills ?? [];
    const missingSkills = targetJob?.missing_skills ?? [];

    const isTargeted = Boolean(targetRole || targetCompany);

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

    const targetContext = isTargeted
      ? `\n\nTARGET POSITION DETAILS:
Role Title: ${targetRole}
Company: ${targetCompany || "Confidential"}
Key Skills Required: ${[...matchedSkills, ...missingSkills].slice(0, 10).join(", ") || "Industry standards"}
Job Overview: ${jobDescription.slice(0, 800) || "Standard industry requirements"}`
      : "";

    const systemPrompt = isTargeted
      ? `You are an elite executive resume writer and ATS optimization expert. 
Your goal is to tailor the candidate's resume specifically for the position of "${targetRole}"${targetCompany ? ` at ${targetCompany}` : ""}.
Instructions:
1. "summary": Craft a 2-3 sentence high-impact professional summary directly positioning the candidate as an ideal fit for "${targetRole}", emphasizing relevant strengths and core proficiencies.
2. "work_experience": For each work experience entry, preserve company, title, start_date, end_date, and is_current. Rewrite the bullet points into 3-5 concise, metric- and achievement-oriented accomplishment statements beginning with strong action verbs (e.g. "Spearheaded", "Architected", "Engineered", "Optimized", "Delivered"). Highlight technologies and responsibilities relevant to "${targetRole}".
Return strictly valid JSON matching the specified schema with no markdown backticks or commentary.`
      : `You are a professional resume writer. Given a candidate's profile data, produce a 2-3 sentence professional summary paragraph and rewrite each work experience entry's responsibilities as 3-5 concise, achievement-focused bullet points starting with strong action verbs. Return only valid JSON.`;

    let generated: GeneratedContent;
    try {
      generated = (await generateJson({
        system: systemPrompt,
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
${profileContext}${targetContext}`,
        temperature: 0.5,
        maxOutputTokens: 1200,
      })) as GeneratedContent;
    } catch (error) {
      console.error("[api/resume/generate] generation failed", error);
      return NextResponse.json(
        { success: false, error: "Failed to generate tailored resume" },
        { status: 500 },
      );
    }

    const buffer = await renderToBuffer(
      createResumeDocument(profile, generated, targetRole, targetCompany),
    );
    const base64Data = Buffer.from(buffer).toString("base64");
    const now = new Date().toISOString();

    const resumeId = randomUUID();
    const resumeName = targetCompany && targetRole
      ? `${targetCompany} — ${targetRole}`
      : `${profile.full_name || "Professional"} Resume`;

    const resumesColl = await getCollection<Resume>("resumes");
    await resumesColl.updateMany(
      { user_id: user.id },
      { $set: { is_primary: false } },
    );

    const newResume: Resume = {
      id: resumeId,
      user_id: user.id,
      name: resumeName,
      kind: "generated",
      target_role: targetRole || null,
      target_company: targetCompany || null,
      template: "modern",
      storage_path: null,
      file_size: buffer.length,
      content: generated as unknown as Record<string, unknown>,
      source_job_id: targetJob?.id || null,
      file_path: null,
      file_data: base64Data,
      is_primary: true,
      created_at: now,
      updated_at: now,
    };

    await resumesColl.insertOne(newResume);
    await upsertUserProfile(user.id, { resume_pdf_url: "generated" });

    revalidatePath("/profile");
    revalidatePath("/resumes");
    revalidatePath("/resumes/saved");

    return NextResponse.json({
      success: true,
      resume: {
        id: resumeId,
        name: resumeName,
        target_role: targetRole,
        target_company: targetCompany,
        file_size: buffer.length,
        created_at: now,
        summary: generated.summary,
        work_experience: generated.work_experience,
        downloadUrl: `/api/resume/download/${resumeId}`,
      },
    });
  } catch (error) {
    console.error("[api/resume/generate]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
