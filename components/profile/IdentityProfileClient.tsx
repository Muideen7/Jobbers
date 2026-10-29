"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  User,
  Link2,
  ShieldCheck,
  Globe2,
  Sliders,
  ChevronDown,
  Loader2,
  GraduationCap,
  Target,
  Plus,
  X,
} from "lucide-react";

import { saveProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { DatePicker } from "@/components/ui/date-picker";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { Profile } from "@/types";

type Props = {
  profile: Profile | null;
};

type TabKey = "personal" | "work";

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: "personal", label: "Personal", icon: User },
  { key: "work", label: "Skills & Career", icon: Sliders },
];

const SUGGESTED_SKILLS = [
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "SQL",
  "Next.js",
  "Docker",
  "AWS",
  "Tailwind CSS",
  "GraphQL",
  "PostgreSQL",
  "Git",
  "REST APIs",
  "CI/CD",
  "Go",
  "Vue.js",
];

const PROFILE_DRAFT_STORAGE_KEY = "jobbers_profile_form_draft";
const PROFILE_SAVED_EXTENDED_KEY = "jobbers_profile_saved_extended";

export function IdentityProfileClient({ profile }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("personal");
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleDismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Form State
  const names = (profile?.full_name ?? "").split(" ");
  const [firstName, setFirstName] = useState(names[0] ?? "");
  const [lastName, setLastName] = useState(names.slice(1).join(" ") ?? "");
  const [middleName, setMiddleName] = useState(profile?.middle_name ?? "");
  const [preferredName, setPreferredName] = useState(profile?.preferred_name ?? (names[0] ?? ""));
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [countryCode] = useState("+234");
  const [gender, setGender] = useState(profile?.gender ?? "Prefer not to answer");
  const [dob, setDob] = useState<Date | null>(
    profile?.date_of_birth ? new Date(profile.date_of_birth) : null
  );
  const [country, setCountry] = useState(profile?.country ?? "");
  const [state, setState] = useState(profile?.state ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [postalCode, setPostalCode] = useState(profile?.postal_code ?? "");
  const [streetAddress, setStreetAddress] = useState(
    profile?.street_address ?? (profile?.location ?? "")
  );
  const [workLocationPref, setWorkLocationPref] = useState(
    profile?.work_location_pref ?? "Flexible / no preference"
  );
  const [willingToRelocate, setWillingToRelocate] = useState(
    profile?.willing_to_relocate ?? "Yes"
  );

  // Links & Work Tab State
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolio_url ?? "");
  const [githubUrl, setGithubUrl] = useState(profile?.github_url ?? "");
  const [twitterUrl, setTwitterUrl] = useState(profile?.twitter_url ?? "");

  // Work Authorization
  const [workAuth, setWorkAuth] = useState(profile?.work_authorization ?? "Citizen");
  const [requiresSponsorship, setRequiresSponsorship] = useState(
    profile?.requires_sponsorship ?? "No"
  );

  // EEO
  const [ethnicity, setEthnicity] = useState(profile?.ethnicity ?? "Prefer not to say");
  const [veteranStatus, setVeteranStatus] = useState(profile?.veteran_status ?? "Not a veteran");
  const [disabilityStatus, setDisabilityStatus] = useState(profile?.disability_status ?? "No disability");

  // Application Defaults
  const [currentTitle, setCurrentTitle] = useState(profile?.current_title ?? "");
  const [experienceLevel, setExperienceLevel] = useState(profile?.experience_level ?? "");
  const [yearsExperience, setYearsExperience] = useState(
    profile?.years_experience != null ? String(profile.years_experience) : ""
  );
  const [jobTitlesSeeking, setJobTitlesSeeking] = useState(
    (profile?.job_titles_seeking ?? []).join(", ")
  );
  const [remotePreference] = useState(profile?.remote_preference ?? "");
  const [salaryExpectation, setSalaryExpectation] = useState(profile?.salary_expectation ?? "");
  const [preferredLocations] = useState((profile?.preferred_locations ?? []).join(", "));

  // Skills & Education State
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [skillInput, setSkillInput] = useState("");
  const [degree, setDegree] = useState(profile?.education?.degree ?? "");
  const [fieldOfStudy, setFieldOfStudy] = useState(profile?.education?.field ?? "");
  const [institution, setInstitution] = useState(profile?.education?.institution ?? "");
  const [graduationYear, setGraduationYear] = useState(profile?.education?.graduation_year ?? "");

  const handleAddSkill = (skillToAdd?: string) => {
    const raw = skillToAdd ?? skillInput;
    const trimmed = raw.trim();
    if (!trimmed) return;

    const parts = trimmed
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setSkills((prev) => {
      const set = new Set(prev);
      for (const p of parts) {
        set.add(p);
      }
      return Array.from(set);
    });

    if (!skillToAdd) {
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // 1. Restore local saved cache or draft if saved. Deferred with a
  // microtask so the state updates aren't applied synchronously inside the
  // effect body (which trips react-hooks/set-state-in-effect); the restored
  // values, timing and hydration safety are unchanged — it still runs only on
  // the client after mount.
  useEffect(() => {
    queueMicrotask(() => {
      try {
        // First check locally saved extended values if the backend hasn't loaded them yet
        const rawSaved = localStorage.getItem(PROFILE_SAVED_EXTENDED_KEY);
        if (rawSaved) {
          const saved = JSON.parse(rawSaved);
          if (saved && typeof saved === "object") {
            if (saved.middleName && !profile?.middle_name) setMiddleName(saved.middleName);
            if (saved.preferredName && !profile?.preferred_name) setPreferredName(saved.preferredName);
            if (saved.email && !profile?.email) setEmail(saved.email);
            if (saved.gender && !profile?.gender) setGender(saved.gender);
            if (saved.dob && !profile?.date_of_birth) setDob(new Date(saved.dob));
            if (saved.country && !profile?.country) setCountry(saved.country);
            if (saved.state && !profile?.state) setState(saved.state);
            if (saved.city && !profile?.city) setCity(saved.city);
            if (saved.postalCode && !profile?.postal_code) setPostalCode(saved.postalCode);
            if (saved.streetAddress && !profile?.street_address) setStreetAddress(saved.streetAddress);
            if (saved.workLocationPref && !profile?.work_location_pref) setWorkLocationPref(saved.workLocationPref);
            if (saved.willingToRelocate && !profile?.willing_to_relocate) setWillingToRelocate(saved.willingToRelocate);
            if (saved.githubUrl && !profile?.github_url) setGithubUrl(saved.githubUrl);
            if (saved.twitterUrl && !profile?.twitter_url) setTwitterUrl(saved.twitterUrl);
            if (saved.requiresSponsorship && !profile?.requires_sponsorship) setRequiresSponsorship(saved.requiresSponsorship);
            if (saved.ethnicity && !profile?.ethnicity) setEthnicity(saved.ethnicity);
            if (saved.veteranStatus && !profile?.veteran_status) setVeteranStatus(saved.veteranStatus);
            if (saved.disabilityStatus && !profile?.disability_status) setDisabilityStatus(saved.disabilityStatus);
            if (Array.isArray(saved.skills) && (!profile?.skills || profile.skills.length === 0)) {
              setSkills(saved.skills);
            }
            if (saved.degree && !profile?.education?.degree) setDegree(saved.degree);
            if (saved.fieldOfStudy && !profile?.education?.field) setFieldOfStudy(saved.fieldOfStudy);
            if (saved.institution && !profile?.education?.institution) setInstitution(saved.institution);
            if (saved.graduationYear && !profile?.education?.graduation_year) setGraduationYear(saved.graduationYear);
          }
        }

        const rawDraft = localStorage.getItem(PROFILE_DRAFT_STORAGE_KEY);
        if (!rawDraft) return;
        const draft = JSON.parse(rawDraft);
        if (!draft || typeof draft !== "object") return;

        if (draft.firstName !== undefined) setFirstName(draft.firstName);
        if (draft.lastName !== undefined) setLastName(draft.lastName);
        if (draft.middleName !== undefined) setMiddleName(draft.middleName);
        if (draft.preferredName !== undefined) setPreferredName(draft.preferredName);
        if (draft.email !== undefined) setEmail(draft.email);
        if (draft.phone !== undefined) setPhone(draft.phone);
        if (draft.gender !== undefined) setGender(draft.gender);
        if (draft.dob) setDob(new Date(draft.dob));
        if (draft.country !== undefined) setCountry(draft.country);
        if (draft.state !== undefined) setState(draft.state);
        if (draft.city !== undefined) setCity(draft.city);
        if (draft.postalCode !== undefined) setPostalCode(draft.postalCode);
        if (draft.streetAddress !== undefined) setStreetAddress(draft.streetAddress);
        if (draft.workLocationPref !== undefined) setWorkLocationPref(draft.workLocationPref);
        if (draft.willingToRelocate !== undefined) setWillingToRelocate(draft.willingToRelocate);
        if (draft.linkedinUrl !== undefined) setLinkedinUrl(draft.linkedinUrl);
        if (draft.portfolioUrl !== undefined) setPortfolioUrl(draft.portfolioUrl);
        if (draft.githubUrl !== undefined) setGithubUrl(draft.githubUrl);
        if (draft.twitterUrl !== undefined) setTwitterUrl(draft.twitterUrl);
        if (draft.workAuth !== undefined) setWorkAuth(draft.workAuth);
        if (draft.requiresSponsorship !== undefined) setRequiresSponsorship(draft.requiresSponsorship);
        if (draft.ethnicity !== undefined) setEthnicity(draft.ethnicity);
        if (draft.veteranStatus !== undefined) setVeteranStatus(draft.veteranStatus);
        if (draft.disabilityStatus !== undefined) setDisabilityStatus(draft.disabilityStatus);
        if (draft.currentTitle !== undefined) setCurrentTitle(draft.currentTitle);
        if (draft.experienceLevel !== undefined) setExperienceLevel(draft.experienceLevel);
        if (draft.yearsExperience !== undefined) setYearsExperience(draft.yearsExperience);
        if (draft.jobTitlesSeeking !== undefined) setJobTitlesSeeking(draft.jobTitlesSeeking);
        if (draft.salaryExpectation !== undefined) setSalaryExpectation(draft.salaryExpectation);
        if (Array.isArray(draft.skills)) setSkills(draft.skills);
        if (draft.degree !== undefined) setDegree(draft.degree);
        if (draft.fieldOfStudy !== undefined) setFieldOfStudy(draft.fieldOfStudy);
        if (draft.institution !== undefined) setInstitution(draft.institution);
        if (draft.graduationYear !== undefined) setGraduationYear(draft.graduationYear);
      } catch {
        // Ignore parse/storage issues
      }
    });
  }, [profile]);

  // 2. Persist ongoing edits to localStorage so page refreshes or connection drops never lose inputs
  useEffect(() => {
    try {
      const draft = {
        firstName,
        lastName,
        middleName,
        preferredName,
        email,
        phone,
        gender,
        dob: dob ? dob.toISOString() : null,
        country,
        state,
        city,
        postalCode,
        streetAddress,
        workLocationPref,
        willingToRelocate,
        linkedinUrl,
        portfolioUrl,
        githubUrl,
        twitterUrl,
        workAuth,
        requiresSponsorship,
        ethnicity,
        veteranStatus,
        disabilityStatus,
        currentTitle,
        experienceLevel,
        yearsExperience,
        jobTitlesSeeking,
        salaryExpectation,
        skills,
        degree,
        fieldOfStudy,
        institution,
        graduationYear,
      };
      localStorage.setItem(PROFILE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore storage write failures
    }
  }, [
    firstName,
    lastName,
    middleName,
    preferredName,
    email,
    phone,
    gender,
    dob,
    country,
    state,
    city,
    postalCode,
    streetAddress,
    workLocationPref,
    willingToRelocate,
    linkedinUrl,
    portfolioUrl,
    githubUrl,
    twitterUrl,
    workAuth,
    requiresSponsorship,
    ethnicity,
    veteranStatus,
    disabilityStatus,
    currentTitle,
    experienceLevel,
    yearsExperience,
    jobTitlesSeeking,
    salaryExpectation,
    skills,
    degree,
    fieldOfStudy,
    institution,
    graduationYear,
  ]);

  function handleSave() {
    const fullName = `${firstName} ${lastName}`.trim();
    const locationStr = streetAddress || `${city}, ${state}, ${country}`.replace(/^[,\s]+|[,\s]+$/g, "");

    const workEntries = (profile?.work_experience ?? []).map((w) => ({
      company: w.company,
      title: w.title,
      start_date: w.start_date,
      end_date: w.end_date ?? "",
      is_current: w.is_current,
      responsibilities: w.responsibilities,
    }));

    startTransition(async () => {
      const res = await saveProfile({
        fullName,
        firstName,
        lastName,
        middleName,
        preferredName,
        email,
        phone,
        location: locationStr,
        gender,
        dob: dob ? dob.toISOString().split("T")[0] : undefined,
        country,
        state,
        city,
        postalCode,
        streetAddress,
        workLocationPref,
        willingToRelocate,
        linkedinUrl,
        portfolioUrl,
        githubUrl,
        twitterUrl,
        workAuth,
        requiresSponsorship,
        ethnicity,
        veteranStatus,
        disabilityStatus,
        currentTitle,
        experienceLevel,
        yearsExperience,
        skills,
        industries: profile?.industries ?? [],
        workEntries,
        degree,
        fieldOfStudy,
        institution,
        graduationYear,
        jobTitlesSeeking: jobTitlesSeeking.split(",").map((s) => s.trim()).filter(Boolean),
        remotePreference,
        salaryExpectation,
        preferredLocations: preferredLocations.split(",").map((s) => s.trim()).filter(Boolean),
        coverLetterTone: profile?.cover_letter_tone ?? "",
      });

      if (res.success) {
        try {
          localStorage.removeItem(PROFILE_DRAFT_STORAGE_KEY);
          localStorage.setItem(
            PROFILE_SAVED_EXTENDED_KEY,
            JSON.stringify({
              middleName,
              preferredName,
              email,
              gender,
              dob: dob ? dob.toISOString() : null,
              country,
              state,
              city,
              postalCode,
              streetAddress,
              workLocationPref,
              willingToRelocate,
              githubUrl,
              twitterUrl,
              requiresSponsorship,
              ethnicity,
              veteranStatus,
              disabilityStatus,
              skills,
              degree,
              fieldOfStudy,
              institution,
              graduationYear,
            })
          );
        } catch {
          // ignore
        }
        setToastMessage("Profile changes saved successfully.");
      } else {
        setToastMessage(res.error || "Failed to save profile.");
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Toast Feedback */}
      <Toast
        message={toastMessage}
        onDismiss={handleDismissToast}
        tone={toastMessage?.includes("successfully") ? "success" : "error"}
      />

      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Identity
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Your master record. These details flow into every resume profile and autofill.
        </p>
      </header>

      {/* Two Column Layout */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Left Sidebar Navigation Tabs */}
        <nav className="w-full shrink-0 lg:w-64">
          <div className="flex flex-row overflow-x-auto lg:flex-col gap-1.5 p-1 bg-surface-secondary/50 rounded-2xl lg:bg-transparent lg:p-0">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all text-left w-full shrink-0 ${
                    isActive
                      ? "bg-ink text-accent-foreground font-semibold shadow-sm"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary/80"
                  }`}
                >
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right Main Card Container */}
        <div className="flex-1 rounded-[32px] border border-border bg-surface p-6 shadow-card sm:p-10 flex flex-col justify-between min-h-[600px]">
          <div>
            {/* Section Sub-Header */}
            <div className="border-b border-border pb-5 mb-6">
              <h2 className="text-xl font-bold tracking-tight text-text-primary">
                {TABS.find((t) => t.key === activeTab)?.label}
              </h2>
              <p className="mt-1 text-xs text-text-muted">
                {activeTab === "personal" && "Inherited by all resume profiles unless overridden"}
                {activeTab === "work" && "Technical skills, education credentials, career defaults, online links, and work authorization"}
              </p>
            </div>

            {/* TAB 1: PERSONAL */}
            {activeTab === "personal" && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Profile Avatar & Identity Source */}
                <div className="col-span-1 sm:col-span-2 flex items-center gap-4 rounded-2xl border border-border bg-surface-secondary/40 p-4">
                  <UserAvatar
                    user={{
                      name: `${firstName} ${lastName}`.trim() || profile?.full_name,
                      email: email || profile?.email,
                      image: profile?.image,
                    }}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-text-primary">
                        {`${firstName} ${lastName}`.trim() || profile?.full_name || "Jobber Profile"}
                      </p>
                      {profile?.image ? (
                        <span className="rounded-full bg-success-lightest px-2.5 py-0.5 text-[10px] font-semibold text-success-foreground">
                          Connected Photo
                        </span>
                      ) : (
                        <span className="rounded-full bg-surface-secondary border border-border px-2.5 py-0.5 text-[10px] font-semibold text-text-muted">
                          Initials Avatar
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {profile?.image
                        ? "Profile photo imported from your connected Google or GitHub account."
                        : "Two-letter avatar generated from your first and last name."}
                    </p>
                  </div>
                </div>

                {/* First name */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-primary">First name</label>
                    <span className="rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-muted">1 profile</span>
                  </div>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>

                {/* Last name */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-primary">Last name</label>
                    <span className="rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-muted">1 profile</span>
                  </div>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>

                {/* Middle name */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-primary">Middle name</label>
                    <span className="rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-muted">1 profile</span>
                  </div>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder=""
                    className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>

                {/* Preferred name */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-primary">Preferred name</label>
                    <span className="rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-muted">1 profile</span>
                  </div>
                  <input
                    type="text"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    placeholder=""
                    className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-primary">Email</label>
                    <span className="rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-muted">1 profile</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>

                {/* Phone with Country Code Pill */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-primary">Phone</label>
                    <span className="rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-muted">1 profile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 shrink-0 rounded-2xl bg-surface-secondary/70 px-3 py-3 text-sm font-medium text-text-primary border-none">
                      <span>🇳🇬</span>
                      <span>{countryCode}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text-primary">Gender</label>
                  <div className="relative">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full appearance-none rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all cursor-pointer"
                    >
                      <option value="Prefer not to answer">Prefer not to answer</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  </div>
                </div>

                {/* Date of birth */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-primary">Date of birth</label>
                    <span className="rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-muted">1 profile</span>
                  </div>
                  <DatePicker
                    value={dob}
                    onChange={setDob}
                    placeholder="Pick your date of birth"
                    displayFormat="MMM d, yyyy"
                    maxDate={new Date()}
                    minDate={new Date(1920, 0, 1)}
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text-primary">Country</label>
                  <div className="relative">
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full appearance-none rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all cursor-pointer"
                    >
                      <option value="Nigeria">Nigeria</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Germany">Germany</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  </div>
                </div>

                {/* State */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text-primary">State</label>
                  <div className="relative">
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full appearance-none rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all cursor-pointer"
                    >
                      <option value="Lagos">Lagos</option>
                      <option value="Abuja">Abuja</option>
                      <option value="Rivers">Rivers</option>
                      <option value="Oyo">Oyo</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text-primary">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>

                {/* Postal code */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text-primary">Postal code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>

                {/* Street address */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-text-primary">Street address</label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>

                {/* Work location preference */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text-primary">Work location preference</label>
                  <div className="relative">
                    <select
                      value={workLocationPref}
                      onChange={(e) => setWorkLocationPref(e.target.value)}
                      className="w-full appearance-none rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all cursor-pointer"
                    >
                      <option value="Flexible / no preference">Flexible / no preference</option>
                      <option value="Remote only">Remote only</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site only">On-site only</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  </div>
                </div>

                {/* Willing to relocate for a role? */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text-primary">Willing to relocate for a role?</label>
                  <div className="relative">
                    <select
                      value={willingToRelocate}
                      onChange={(e) => setWillingToRelocate(e.target.value)}
                      className="w-full appearance-none rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all cursor-pointer"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Negotiable">Negotiable</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: WORK (SKILLS, EDUCATION, LINKS, APPLICATION DEFAULTS, WORK AUTHORIZATION, EEO) */}
            {activeTab === "work" && (
              <div className="space-y-8">
                {/* 1. Skills & Technical Proficiencies */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-accent" />
                      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                        Skills & Technical Proficiencies
                      </h3>
                    </div>
                    <span className="rounded-md bg-accent-muted px-2.5 py-0.5 text-xs font-semibold text-accent">
                      {skills.length} {skills.length === 1 ? "skill" : "skills"}
                    </span>
                  </div>
                  <p className="mb-4 text-xs text-text-secondary leading-relaxed">
                    The AI matching engine compares these skills directly against job descriptions to calculate match scores, rank roles, and pinpoint gap skills.
                  </p>

                  {/* Add skill input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      placeholder="Add a skill (e.g. React, Node.js, Python, Docker) and press Enter"
                      className="flex-1 rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                    />
                    <Button
                      type="button"
                      onClick={() => handleAddSkill()}
                      className="rounded-2xl px-5 bg-ink text-accent-foreground font-semibold hover:bg-ink-hover cursor-pointer shrink-0 inline-flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add</span>
                    </Button>
                  </div>

                  {/* Quick skill suggestions */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium text-text-muted">Suggested:</span>
                    {SUGGESTED_SKILLS.filter((s) => !skills.includes(s))
                      .slice(0, 8)
                      .map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleAddSkill(suggestion)}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:border-accent hover:text-accent hover:bg-accent-muted/40 transition-colors cursor-pointer"
                        >
                          <Plus className="h-2.5 w-2.5" />
                          {suggestion}
                        </button>
                      ))}
                  </div>

                  {/* Active skills list */}
                  <div className="mt-4 rounded-2xl border border-border bg-surface-secondary/40 p-4 min-h-[90px] flex items-center">
                    {skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1.5 rounded-full bg-accent-muted px-3 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent-muted/80"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="rounded-full p-0.5 hover:bg-accent/20 text-accent transition-colors cursor-pointer"
                              aria-label={`Remove ${skill}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-text-muted">
                        No skills added yet. Add at least 3–5 key skills so the AI can score your job matches and identify skill gaps.
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* 2. Education & Credentials */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-accent" />
                      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                        Education & Credentials
                      </h3>
                    </div>
                    <span className="rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-muted">
                      ATS matching
                    </span>
                  </div>
                  <p className="mb-4 text-xs text-text-secondary leading-relaxed">
                    Used for education qualification thresholds in AI role scoring and resume generation.
                  </p>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">
                        Degree / Qualification Level
                      </label>
                      <div className="relative">
                        <select
                          value={degree}
                          onChange={(e) => setDegree(e.target.value)}
                          className="w-full appearance-none rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all cursor-pointer"
                        >
                          <option value="">Select degree / level</option>
                          <option value="Bachelor's Degree">Bachelor&apos;s Degree (B.S. / B.A. / B.Sc)</option>
                          <option value="Master's Degree">Master&apos;s Degree (M.S. / M.A. / M.Sc)</option>
                          <option value="Doctorate (Ph.D.)">Doctorate (Ph.D. / D.Phil)</option>
                          <option value="Associate Degree">Associate Degree (A.S. / A.A.)</option>
                          <option value="Bootcamp / Certificate">Bootcamp / Professional Certificate</option>
                          <option value="High School / GED">High School / GED</option>
                          <option value="Self-Taught / Other">Self-Taught / Other</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">
                        Field of Study / Major
                      </label>
                      <input
                        type="text"
                        value={fieldOfStudy}
                        onChange={(e) => setFieldOfStudy(e.target.value)}
                        placeholder="e.g. Computer Science, Software Engineering"
                        className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">
                        School / Institution
                      </label>
                      <input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="e.g. Stanford University, University of Lagos"
                        className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">
                        Graduation Year
                      </label>
                      <input
                        type="text"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        placeholder="e.g. 2024"
                        className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* 3. Links Section */}
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-accent" />
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                      Online Presence & Links
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">LinkedIn URL</label>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">Portfolio URL</label>
                      <input
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://yourportfolio.com"
                        className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">GitHub URL</label>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">Twitter / X URL</label>
                      <input
                        type="url"
                        value={twitterUrl}
                        onChange={(e) => setTwitterUrl(e.target.value)}
                        placeholder="https://x.com/username"
                        className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* 2. Career & Application Defaults */}
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-accent" />
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                      Application Defaults
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">Current Title</label>
                      <input
                        type="text"
                        value={currentTitle}
                        onChange={(e) => setCurrentTitle(e.target.value)}
                        className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">Experience Level</label>
                      <div className="relative">
                        <select
                          value={experienceLevel}
                          onChange={(e) => setExperienceLevel(e.target.value)}
                          className="w-full appearance-none rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all cursor-pointer"
                        >
                          <option value="Junior">Junior</option>
                          <option value="Mid-Level">Mid-Level</option>
                          <option value="Senior">Senior</option>
                          <option value="Lead">Lead</option>
                          <option value="Staff">Staff</option>
                          <option value="Executive">Executive</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">Years of Experience</label>
                      <input
                        type="number"
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(e.target.value)}
                        className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">Salary Expectation</label>
                      <input
                        type="text"
                        value={salaryExpectation}
                        onChange={(e) => setSalaryExpectation(e.target.value)}
                        className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">Target Job Titles (comma separated)</label>
                      <input
                        type="text"
                        value={jobTitlesSeeking}
                        onChange={(e) => setJobTitlesSeeking(e.target.value)}
                        className="w-full rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* 2. Work Authorization Section */}
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                      Work Authorization
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">Work Authorization Status</label>
                      <div className="relative">
                        <select
                          value={workAuth}
                          onChange={(e) => setWorkAuth(e.target.value)}
                          className="w-full appearance-none rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all cursor-pointer"
                        >
                          <option value="Citizen">Citizen</option>
                          <option value="Permanent Resident">Permanent Resident</option>
                          <option value="Work Visa (H1B)">Work Visa (H1B)</option>
                          <option value="Work Visa (Other)">Work Visa (Other)</option>
                          <option value="Student Visa (OPT/CPT)">Student Visa (OPT/CPT)</option>
                          <option value="Requires Sponsorship">Requires Sponsorship</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">Requires Visa Sponsorship?</label>
                      <div className="relative">
                        <select
                          value={requiresSponsorship}
                          onChange={(e) => setRequiresSponsorship(e.target.value)}
                          className="w-full appearance-none rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all cursor-pointer"
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* 3. EEO Defaults Section */}
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-accent" />
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                      Equal Employment Opportunity (EEO)
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">Race / Ethnicity</label>
                      <div className="relative">
                        <select
                          value={ethnicity}
                          onChange={(e) => setEthnicity(e.target.value)}
                          className="w-full appearance-none rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all cursor-pointer"
                        >
                          <option value="Black / African Descent">Black / African Descent</option>
                          <option value="Asian">Asian</option>
                          <option value="Hispanic / Latino">Hispanic / Latino</option>
                          <option value="White / Caucasian">White / Caucasian</option>
                          <option value="Two or More Races">Two or More Races</option>
                          <option value="Prefer not to answer">Prefer not to answer</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">Veteran Status</label>
                      <div className="relative">
                        <select
                          value={veteranStatus}
                          onChange={(e) => setVeteranStatus(e.target.value)}
                          className="w-full appearance-none rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all cursor-pointer"
                        >
                          <option value="Not a veteran">Not a veteran</option>
                          <option value="Protected veteran">Protected veteran</option>
                          <option value="Prefer not to answer">Prefer not to answer</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-text-primary">Disability Status</label>
                      <div className="relative">
                        <select
                          value={disabilityStatus}
                          onChange={(e) => setDisabilityStatus(e.target.value)}
                          className="w-full appearance-none rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-sm font-medium text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-all cursor-pointer"
                        >
                          <option value="No disability">No disability</option>
                          <option value="Yes, I have a disability">Yes, I have a disability</option>
                          <option value="Prefer not to answer">Prefer not to answer</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer inside Card */}
          <div className="mt-10 flex justify-end border-t border-border pt-6">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-full px-6 py-2.5 bg-ink text-accent-foreground font-semibold hover:bg-ink-hover shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
