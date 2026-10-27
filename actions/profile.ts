"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
// Import from lib directly to avoid pdf-parse's index.js debug mode, which reads
// a test file on every require() call and crashes when module.parent is null
// (always the case under Next.js/Turbopack).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  buf: Buffer,
) => Promise<{ text: string }>;

import { requireUser } from "@/lib/auth";
import { getUserProfile, upsertUserProfile } from "@/lib/profile";
import { getCollection } from "@/lib/mongodb";
import { calculateCompletion } from "@/lib/profile-utils";
import { generateJson } from "@/lib/llm";
import type { Education, Profile, Resume, WorkExperience } from "@/types";

type WorkExperienceEntry = {
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  responsibilities: string;
};

export type ProfileFormData = {
  fullName: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  middleName?: string | undefined;
  preferredName?: string | undefined;
  email?: string | undefined;
  phone: string;
  gender?: string | undefined;
  dob?: string | undefined;
  country?: string | undefined;
  state?: string | undefined;
  city?: string | undefined;
  postalCode?: string | undefined;
  streetAddress?: string | undefined;
  workLocationPref?: string | undefined;
  willingToRelocate?: string | undefined;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
  githubUrl?: string | undefined;
  twitterUrl?: string | undefined;
  workAuth: string;
  requiresSponsorship?: string | undefined;
  ethnicity?: string | undefined;
  veteranStatus?: string | undefined;
  disabilityStatus?: string | undefined;
  currentTitle: string;
  experienceLevel: string;
  yearsExperience: string;
  skills: string[];
  industries: string[];
  workEntries: WorkExperienceEntry[];
  degree: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear: string;
  jobTitlesSeeking: string[];
  remotePreference: string;
  salaryExpectation: string;
  preferredLocations: string[];
  coverLetterTone: string;
};

export async function saveProfile(
  data: ProfileFormData,
): Promise<{ success: boolean; error?: string }> {
  // requireUser must be outside try/catch — redirect() throws NEXT_REDIRECT
  // which would otherwise be caught and swallowed as a generic error.
  const user = await requireUser();

  try {
    const education: Education = {
      degree: data.degree || null,
      field: data.fieldOfStudy || null,
      institution: data.institution || null,
      graduation_year: data.graduationYear || null,
    };

    const parsed = parseInt(data.yearsExperience, 10);
    const yearsExperience =
      data.yearsExperience && !isNaN(parsed) ? parsed : null;

    const workExperience: WorkExperience[] = data.workEntries.map((e) => ({
      company: e.company,
      title: e.title,
      start_date: e.start_date,
      end_date: e.is_current ? null : e.end_date || null,
      is_current: e.is_current,
      responsibilities: e.responsibilities,
    }));

    const { isComplete } = calculateCompletion({
      full_name: data.fullName || null,
      phone: data.phone || null,
      location: data.location || null,
      current_title: data.currentTitle || null,
      experience_level: data.experienceLevel || null,
      years_experience: yearsExperience,
      skills: data.skills,
      work_experience: workExperience,
      education,
    });

    const basePayload: Record<string, unknown> = {
      full_name: data.fullName || null,
      email: data.email || null,
      phone: data.phone || null,
      location: data.location || null,
      linkedin_url: data.linkedinUrl || null,
      portfolio_url: data.portfolioUrl || null,
      work_authorization: data.workAuth || null,
      current_title: data.currentTitle || null,
      experience_level: data.experienceLevel || null,
      years_experience: yearsExperience,
      skills: data.skills,
      industries: data.industries,
      work_experience: workExperience,
      education,
      job_titles_seeking: data.jobTitlesSeeking,
      remote_preference: data.remotePreference || null,
      salary_expectation: data.salaryExpectation || null,
      preferred_locations: data.preferredLocations,
      cover_letter_tone: data.coverLetterTone || null,
      is_complete: isComplete,
    };

    const extendedPayload: Record<string, unknown> = {
      ...basePayload,
      middle_name: data.middleName || null,
      preferred_name: data.preferredName || null,
      gender: data.gender || null,
      date_of_birth: data.dob || null,
      country: data.country || null,
      state: data.state || null,
      city: data.city || null,
      postal_code: data.postalCode || null,
      street_address: data.streetAddress || null,
      work_location_pref: data.workLocationPref || null,
      willing_to_relocate: data.willingToRelocate || null,
      github_url: data.githubUrl || null,
      twitter_url: data.twitterUrl || null,
      requires_sponsorship: data.requiresSponsorship || null,
      ethnicity: data.ethnicity || null,
      veteran_status: data.veteranStatus || null,
      disability_status: data.disabilityStatus || null,
    };

    await upsertUserProfile(user.id, extendedPayload as Partial<Profile>);

    revalidatePath("/profile");
    revalidatePath("/home");
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("[actions/profile] saveProfile", error);
    return { success: false, error: "Failed to save profile" };
  }
}

export type UploadResumeResult = {
  success: boolean;
  error?: string;
  extractedData?: ExtractedProfile | null;
  extractionMessage?: string | null;
};

export async function uploadResume(
  formData: FormData,
): Promise<UploadResumeResult> {
  // requireUser must be outside try/catch — redirect() throws NEXT_REDIRECT
  const user = await requireUser();

  try {
    const file = formData.get("resume");
    if (!(file instanceof File)) {
      return { success: false, error: "No file provided" };
    }
    if (file.type !== "application/pdf") {
      return { success: false, error: "File must be a PDF" };
    }
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: "File must be under 2MB" };
    }

    const fileSize = file.size;
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const resumes = await getCollection<Resume>("resumes");
    // Clear previous primaries for this user
    await resumes.updateMany({ user_id: user.id }, { $set: { is_primary: false } });

    // Insert new primary resume document
    const now = new Date().toISOString();
    await resumes.insertOne({
      id: randomUUID(),
      user_id: user.id,
      name: file.name || "Uploaded resume",
      kind: "uploaded",
      target_role: null,
      target_company: null,
      template: null,
      storage_path: null,
      file_size: fileSize,
      content: null,
      source_job_id: null,
      file_path: null,
      file_data: base64Data,
      is_primary: true,
      created_at: now,
      updated_at: now,
    });

    await upsertUserProfile(user.id, { resume_pdf_url: "uploaded" });

    let extractedData: ExtractedProfile | null = null;
    let extractionMessage: string | null = null;

    try {
      let extractedText: string | null = null;
      try {
        const pdfData = await pdfParse(Buffer.from(arrayBuffer));
        extractedText = pdfData?.text ?? null;
      } catch (pdfErr) {
        console.warn("[actions/profile] pdfParse error, using Gemini multimodal PDF reader:", (pdfErr as Error).message);
      }

      const prompt =
        extractedText && extractedText.trim().length >= 50
          ? `Extract profile data from this resume text and return JSON with this exact shape:
{
  "full_name": string | null,
  "phone": string | null,
  "location": string | null,
  "current_title": string | null,
  "experience_level": "Junior"|"Mid-Level"|"Senior"|"Lead"|"Manager"|"Director"|"Executive"|null,
  "years_experience": number | null,
  "skills": string[],
  "industries": string[],
  "work_experience": [{ "company": string, "title": string, "start_date": string, "end_date": string|null, "is_current": boolean, "responsibilities": string }],
  "education": { "degree": string|null, "field": string|null, "institution": string|null, "graduation_year": string|null },
  "job_titles_seeking": string[],
  "linkedin_url": string|null,
  "portfolio_url": string|null
}

Resume text:
${extractedText.slice(0, 10000)}`
          : `Extract structured profile data from this uploaded resume document and return JSON with this exact shape:
{
  "full_name": string | null,
  "phone": string | null,
  "location": string | null,
  "current_title": string | null,
  "experience_level": "Junior"|"Mid-Level"|"Senior"|"Lead"|"Manager"|"Director"|"Executive"|null,
  "years_experience": number | null,
  "skills": string[],
  "industries": string[],
  "work_experience": [{ "company": string, "title": string, "start_date": string, "end_date": string|null, "is_current": boolean, "responsibilities": string }],
  "education": { "degree": string|null, "field": string|null, "institution": string|null, "graduation_year": string|null },
  "job_titles_seeking": string[],
  "linkedin_url": string|null,
  "portfolio_url": string|null
}`;

      extractedData = (await generateJson({
        system:
          "You are an expert resume parser. Extract structured profile data from the candidate's resume and return only valid JSON matching the exact schema provided. Use null for missing fields. Arrays must always be arrays (never null). experience_level must be one of: Junior, Mid-Level, Senior, Lead, Manager, Director, Executive — pick the closest match or null.",
        prompt,
        temperature: 0.2,
        maxOutputTokens: 3500,
        ...(extractedText && extractedText.trim().length >= 50
          ? {}
          : { inlineData: { mimeType: "application/pdf", data: base64Data } }),
      })) as ExtractedProfile;

      if (extractedData) {
        try {
          await applyExtractedProfile(extractedData);
        } catch (applyErr) {
          console.warn("[uploadResume] auto-apply profile warning:", (applyErr as Error).message);
        }
      }
    } catch (extractErr) {
      console.error("[actions/profile] resume parsing error:", extractErr);
      extractionMessage =
        "Automated extraction could not read this PDF. Please fill in your profile details manually below.";
    }

    revalidatePath("/profile");
    revalidatePath("/resumes");
    return {
      success: true,
      extractedData,
      extractionMessage,
    };
  } catch (error) {
    console.error("[actions/profile] uploadResume", error);
    return { success: false, error: "Failed to upload resume" };
  }
}

export type ExtractedProfile = {
  full_name: string | null;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  experience_level: string | null;
  years_experience: number | null;
  skills: string[];
  industries: string[];
  work_experience: WorkExperience[];
  education: Education;
  job_titles_seeking: string[];
  linkedin_url: string | null;
  portfolio_url: string | null;
};

/**
 * Applies an extracted (resume-parsed) profile over the user's saved one.
 */
export async function applyExtractedProfile(
  extracted: ExtractedProfile,
): Promise<{ success: boolean; error?: string }> {
  // requireUser must stay outside try/catch (NEXT_REDIRECT invariant).
  const user = await requireUser();

  const merged: ProfileFormData = await (async () => {
    const profile = await getUserProfile(user.id);

    if (!profile) {
      console.error("[actions/profile] applyExtractedProfile profile not found", user.id);
      throw new Error("Profile not found. Please sign out and sign in again.");
    }

    const pick = (
      value: string | null | undefined,
      current: string | null,
    ): string => (value && value.trim().length > 0 ? value : current ?? "");

    const pickArray = (
      value: string[] | null | undefined,
      current: string[],
    ): string[] => (value && value.length > 0 ? value : current);

    const toWorkEntry = (w: WorkExperience): WorkExperienceEntry => ({
      company: w.company,
      title: w.title,
      start_date: w.start_date,
      end_date: w.end_date ?? "",
      is_current: w.is_current,
      responsibilities: w.responsibilities,
    });

    const extractedWork = extracted.work_experience.map(toWorkEntry);
    const extractedHasWork = extracted.work_experience.length > 0;

    const extractedEducation = extracted.education;
    const extractedHasEducation =
      extractedEducation.degree ||
      extractedEducation.field ||
      extractedEducation.institution ||
      extractedEducation.graduation_year;

    return {
      fullName: pick(extracted.full_name, profile.full_name),
      phone: pick(extracted.phone, profile.phone),
      location: pick(extracted.location, profile.location),
      linkedinUrl: pick(extracted.linkedin_url, profile.linkedin_url),
      portfolioUrl: pick(extracted.portfolio_url, profile.portfolio_url),
      workAuth: profile.work_authorization ?? "",
      currentTitle: pick(extracted.current_title, profile.current_title),
      experienceLevel: pick(
        extracted.experience_level,
        profile.experience_level,
      ),
      yearsExperience:
        extracted.years_experience != null
          ? String(extracted.years_experience)
          : profile.years_experience != null
            ? String(profile.years_experience)
            : "",
      skills: pickArray(extracted.skills, profile.skills),
      industries: pickArray(extracted.industries, profile.industries),
      workEntries: extractedHasWork
        ? extractedWork
        : (profile.work_experience ?? []).map(toWorkEntry),
      degree: extractedHasEducation
        ? extractedEducation.degree ?? ""
        : profile.education?.degree ?? "",
      fieldOfStudy: extractedHasEducation
        ? extractedEducation.field ?? ""
        : profile.education?.field ?? "",
      institution: extractedHasEducation
        ? extractedEducation.institution ?? ""
        : profile.education?.institution ?? "",
      graduationYear: extractedHasEducation
        ? extractedEducation.graduation_year ?? ""
        : profile.education?.graduation_year ?? "",
      jobTitlesSeeking: pickArray(
        extracted.job_titles_seeking,
        profile.job_titles_seeking,
      ),
      remotePreference: profile.remote_preference ?? "",
      salaryExpectation: profile.salary_expectation ?? "",
      preferredLocations: profile.preferred_locations,
      coverLetterTone: profile.cover_letter_tone ?? "",
    };
  })();

  return saveProfile(merged);
}

export async function extractProfile(): Promise<{
  success: boolean;
  data?: ExtractedProfile;
  error?: string;
}> {
  const user = await requireUser();

  try {
    const resumes = await getCollection<Resume>("resumes");
    const resume = await resumes.findOne({ user_id: user.id, is_primary: true });

    if (!resume || !resume.file_data) {
      return {
        success: false,
        error: "No resume found. Please upload your resume first.",
      };
    }

    let extractedText: string | null = null;
    try {
      const buffer = Buffer.from(resume.file_data, "base64");
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData?.text ?? null;
    } catch (pdfErr) {
      console.warn("[actions/profile] extractProfile pdfParse error, using Gemini multimodal PDF reader:", (pdfErr as Error).message);
    }

    const prompt =
      extractedText && extractedText.trim().length >= 50
        ? `Extract profile data from this resume text and return JSON with this exact shape:
{
  "full_name": string | null,
  "phone": string | null,
  "location": string | null,
  "current_title": string | null,
  "experience_level": "Junior"|"Mid-Level"|"Senior"|"Lead"|"Manager"|"Director"|"Executive"|null,
  "years_experience": number | null,
  "skills": string[],
  "industries": string[],
  "work_experience": [{ "company": string, "title": string, "start_date": string, "end_date": string|null, "is_current": boolean, "responsibilities": string }],
  "education": { "degree": string|null, "field": string|null, "institution": string|null, "graduation_year": string|null },
  "job_titles_seeking": string[],
  "linkedin_url": string|null,
  "portfolio_url": string|null
}

Resume text:
${extractedText.slice(0, 10000)}`
        : `Extract structured profile data from this uploaded resume document and return JSON with this exact shape:
{
  "full_name": string | null,
  "phone": string | null,
  "location": string | null,
  "current_title": string | null,
  "experience_level": "Junior"|"Mid-Level"|"Senior"|"Lead"|"Manager"|"Director"|"Executive"|null,
  "years_experience": number | null,
  "skills": string[],
  "industries": string[],
  "work_experience": [{ "company": string, "title": string, "start_date": string, "end_date": string|null, "is_current": boolean, "responsibilities": string }],
  "education": { "degree": string|null, "field": string|null, "institution": string|null, "graduation_year": string|null },
  "job_titles_seeking": string[],
  "linkedin_url": string|null,
  "portfolio_url": string|null
}`;

    const extracted = (await generateJson({
      system:
        "You are an expert resume parser. Extract structured profile data from the resume text and return only valid JSON matching the exact schema provided. Use null for missing fields. Arrays must always be arrays (never null). experience_level must be one of: Junior, Mid-Level, Senior, Lead, Manager, Director, Executive — pick the closest match or null.",
      prompt,
      temperature: 0.2,
      maxOutputTokens: 3500,
      ...(extractedText && extractedText.trim().length >= 50
        ? {}
        : { inlineData: { mimeType: "application/pdf", data: resume.file_data } }),
    })) as ExtractedProfile;

    if (extracted) {
      try {
        await applyExtractedProfile(extracted);
      } catch (applyErr) {
        console.warn("[extractProfile] auto-apply profile warning:", (applyErr as Error).message);
      }
    }

    return { success: true, data: extracted };
  } catch (error) {
    console.error("[actions/profile] extractProfile", error);
    return { success: false, error: "Failed to extract profile from resume." };
  }
}
