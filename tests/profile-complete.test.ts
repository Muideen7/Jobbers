import assert from "node:assert/strict";
import { test } from "node:test";

import { isProfileComplete } from "../lib/profile-utils.ts";
import type { Profile } from "../types/index.ts";

function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-123",
    full_name: null,
    email: "user@example.com",
    phone: null,
    location: null,
    current_title: null,
    experience_level: null,
    years_experience: null,
    skills: [],
    industries: [],
    work_experience: null,
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
    ...overrides,
  };
}

test("isProfileComplete returns false for null profile", () => {
  assert.equal(isProfileComplete(null), false);
});

test("isProfileComplete returns false when is_complete is true but profile fields are empty", () => {
  const profile = createMockProfile({ is_complete: true });
  assert.equal(isProfileComplete(profile), false);
});

test("isProfileComplete returns false when profile is missing core fields", () => {
  assert.equal(isProfileComplete(createMockProfile()), false);
  assert.equal(
    isProfileComplete(createMockProfile({ full_name: "John Doe" })),
    false,
  );
  assert.equal(
    isProfileComplete(
      createMockProfile({
        full_name: "John Doe",
        job_titles_seeking: ["Frontend Developer"],
      }),
    ),
    false,
  );
  assert.equal(
    isProfileComplete(
      createMockProfile({
        full_name: "John Doe",
        skills: ["React", "TypeScript"],
      }),
    ),
    false,
  );
});

test("isProfileComplete returns true when profile is filled with core matching criteria", () => {
  const profile = createMockProfile({
    full_name: "John Doe",
    location: "San Francisco, CA",
    current_title: "Full Stack Engineer",
    experience_level: "Senior",
    years_experience: 5,
    skills: ["React", "Node.js", "TypeScript"],
    work_experience: [
      {
        company: "Acme Corp",
        title: "Senior Engineer",
        start_date: "2021-01",
        end_date: null,
        is_current: true,
        responsibilities: "Building web apps",
      },
    ],
    education: {
      degree: "B.S. Computer Science",
      field: "Computer Science",
      institution: "State University",
      graduation_year: "2020",
    },
  });
  assert.equal(isProfileComplete(profile), true);
});
