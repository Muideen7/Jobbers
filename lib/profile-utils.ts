import type { MissingField, Profile } from "@/types";

type CompletionInput = {
  full_name: string | null;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  experience_level: string | null;
  years_experience: number | null;
  skills: string[];
  work_experience: { company: string }[] | null;
  education: { degree: string | null } | null;
};

type CompletionResult = {
  isComplete: boolean;
  completionPercent: number;
  missingFields: MissingField[];
};

export function calculateCompletion(data: CompletionInput): CompletionResult {
  const checks: Array<{ field: MissingField; filled: boolean }> = [
    { field: "FULL NAME", filled: !!data.full_name?.trim() },
    { field: "PHONE", filled: !!data.phone?.trim() },
    { field: "LOCATION", filled: !!data.location?.trim() },
    { field: "JOB TITLE", filled: !!data.current_title?.trim() },
    { field: "EXPERIENCE LEVEL", filled: !!data.experience_level },
    { field: "YEARS EXP", filled: data.years_experience !== null },
    { field: "SKILLS", filled: (data.skills ?? []).length > 0 },
    { field: "WORK EXPERIENCE", filled: (data.work_experience ?? []).length > 0 },
    { field: "EDUCATION", filled: !!data.education?.degree },
  ];

  const missingFields = checks.filter((c) => !c.filled).map((c) => c.field);
  const completionPercent = Math.round(
    ((checks.length - missingFields.length) / checks.length) * 100,
  );

  return {
    isComplete: missingFields.length === 0,
    completionPercent,
    missingFields,
  };
}

/**
 * Checks whether the user has filled their profile for tailored AI recommendations.
 * Requires actual filled candidate profile data (skills, role/title, experience or education)
 * and an adequate completion threshold so AI matching is accurate and meaningful.
 */
export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;

  const { isComplete, completionPercent } = calculateCompletion({
    full_name: profile.full_name,
    phone: profile.phone,
    location: profile.location,
    current_title: profile.current_title,
    experience_level: profile.experience_level,
    years_experience: profile.years_experience,
    skills: profile.skills ?? [],
    work_experience: profile.work_experience,
    education: profile.education,
  });

  if (isComplete) return true;
  if (profile.is_complete === true && completionPercent >= 50) return true;

  const hasName = Boolean(profile.full_name?.trim());
  const hasRole = Boolean(
    (profile.job_titles_seeking && profile.job_titles_seeking.length > 0) ||
      profile.current_title?.trim(),
  );
  const hasSkills = Boolean(profile.skills && profile.skills.length > 0);
  const hasExperienceOrEdu = Boolean(
    (profile.work_experience && profile.work_experience.length > 0) ||
      profile.education?.degree ||
      profile.years_experience !== null,
  );

  return hasName && hasRole && hasSkills && hasExperienceOrEdu && completionPercent >= 50;
}

