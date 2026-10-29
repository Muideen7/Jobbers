export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { IdentityProfileClient } from "@/components/profile/IdentityProfileClient";
import { requireUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile";
import { privateMetadata } from "../../private-metadata";

export const metadata: Metadata = privateMetadata(
  "Profile",
  "Your Jobbers profile — the master record used to score every role.",
);

export default async function ProfilePage() {
  const user = await requireUser();
  let profile = await getUserProfile(user.id);

  if (profile && !profile.image && user.image) {
    profile.image = user.image;
  }

  if (!profile) {
    profile = {
      id: user.id,
      full_name: user.name || null,
      email: user.email || null,
      image: user.image || null,
      phone: null,
      location: null,
      current_title: null,
      experience_level: null,
      years_experience: null,
      skills: [],
      industries: [],
      work_experience: [],
      education: null,
      job_titles_seeking: [],
      remote_preference: null,
      preferred_locations: [],
      salary_expectation: null,
      cover_letter_tone: null,
      linkedin_url: null,
      portfolio_url: null,
      work_authorization: null,
      resume_pdf_url: null,
      linkedin_context_id: null,
      linkedin_connected: false,
      is_complete: false,
      last_jobs_visit_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return <IdentityProfileClient profile={profile} />;
}