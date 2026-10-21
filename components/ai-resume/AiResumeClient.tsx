"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Star,
  Target,
  Trash2,
  UploadCloud,
} from "lucide-react";

import type { ExtractedProfile } from "@/actions/profile";
import { ExtractedReviewDialog } from "@/components/dashboard/ExtractedReviewDialog";
import { ResumeSection } from "@/components/profile/ResumeSection";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Job, Profile, Resume } from "@/types";

type Props = {
  profile: Profile | null;
  jobs: Job[];
  initialResumes: Resume[];
  existingResumeUrl: string | null;
};

type GeneratedResumeResult = {
  id: string;
  name: string;
  target_role: string;
  target_company: string;
  file_size: number;
  created_at: string;
  summary: string;
  work_experience: Array<{
    company: string;
    title: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    bullets: string[];
  }>;
  downloadUrl: string;
};

export function AiResumeClient({
  profile,
  jobs,
  initialResumes,
  existingResumeUrl,
}: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"tailor" | "saved" | "master">(
    "tailor",
  );

  // Tailoring selection state
  const [selectedJobId, setSelectedJobId] = useState<string>(
    jobs[0]?.id ?? "custom",
  );
  const [customRole, setCustomRole] = useState("");
  const [customCompany, setCustomCompany] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [latestTailored, setLatestTailored] =
    useState<GeneratedResumeResult | null>(null);

  // Resume library state
  const [resumes, setResumes] = useState<Resume[]>(initialResumes);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);

  // Master extraction modal state
  const [extracted, setExtracted] = useState<ExtractedProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Active target job resolution
  const selectedJob = useMemo(() => {
    if (selectedJobId === "custom") return null;
    return jobs.find((j) => j.id === selectedJobId) ?? null;
  }, [jobs, selectedJobId]);

  const targetRoleName = selectedJob?.title || customRole || profile?.current_title || "Target Role";
  const targetCompanyName = selectedJob?.company || customCompany || "";

  const matchedSkills = selectedJob?.matched_skills ?? [];
  const missingSkills = selectedJob?.missing_skills ?? [];

  async function handleGenerate() {
    setIsGenerating(true);
    setGenError(null);

    try {
      const payload: Record<string, string> = {};
      if (selectedJobId !== "custom" && selectedJob) {
        payload.jobId = selectedJob.id;
      } else {
        if (customRole.trim()) payload.targetRole = customRole.trim();
        if (customCompany.trim()) payload.targetCompany = customCompany.trim();
        if (customDescription.trim()) payload.targetDescription = customDescription.trim();
      }

      const res = await fetch("/api/resume/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate tailored resume");
      }

      setLatestTailored(data.resume);

      // Prepend to saved resumes list
      if (data.resume) {
        const newDoc: Resume = {
          id: data.resume.id,
          user_id: profile?.id ?? "",
          name: data.resume.name,
          kind: "generated",
          target_role: data.resume.target_role || null,
          target_company: data.resume.target_company || null,
          template: "modern",
          storage_path: null,
          file_size: data.resume.file_size,
          content: {
            summary: data.resume.summary,
            work_experience: data.resume.work_experience,
          },
          is_primary: true,
          source_job_id: selectedJob?.id || null,
          file_path: null,
          created_at: data.resume.created_at,
          updated_at: data.resume.created_at,
        };
        setResumes((prev) => [
          newDoc,
          ...prev.map((r) => ({ ...r, is_primary: false })),
        ]);
      }

      router.refresh();
    } catch (err: unknown) {
      setGenError(
        err instanceof Error ? err.message : "Error generating tailored resume",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDeleteResume(id: string) {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setResumes((prev) => prev.filter((r) => r.id !== id));
        if (latestTailored?.id === id) {
          setLatestTailored(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete resume", err);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetPrimary(id: string) {
    setSettingPrimaryId(id);

    try {
      const res = await fetch(`/api/resumes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_primary: true }),
      });
      const data = await res.json();
      if (data.success) {
        setResumes((prev) =>
          prev.map((r) => ({ ...r, is_primary: r.id === id })),
        );
      }
    } catch (err) {
      console.error("Failed to set primary resume", err);
    } finally {
      setSettingPrimaryId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-muted text-accent">
              <Target className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              AI Resume Studio
            </h1>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Tailor your experience bullets and executive summary for specific roles in your pipeline.
          </p>
        </div>

        {/* Tab switch navigation */}
        <div className="flex items-center rounded-xl border border-border bg-surface p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("tailor")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "tailor"
                ? "bg-accent-light text-accent shadow-2xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            Tailor for a Role
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "saved"
                ? "bg-accent-light text-accent shadow-2xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Saved Resumes
            {resumes.length > 0 && (
              <span className="rounded-full bg-surface-secondary px-1.5 py-0.2 text-[10px] font-bold text-text-primary">
                {resumes.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("master")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "master"
                ? "bg-accent-light text-accent shadow-2xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Master PDF
          </button>
        </div>
      </header>

      {/* TAB 1: TAILOR FOR A ROLE */}
      {activeTab === "tailor" && (
        <div className="flex flex-col gap-6">
          {/* Target Job Selection Card */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h2 className="text-base font-semibold text-text-primary">
              1. Choose Target Role
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Select an opportunity from your saved job list or enter custom role details.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  Saved Job Opportunity
                </label>
                <div className="relative">
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-border bg-surface-secondary/60 px-3.5 py-2.5 text-sm font-medium text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                  >
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.company} — {job.title}{" "}
                        {job.match_score ? `(${job.match_score}% Match)` : ""}
                      </option>
                    ))}
                    <option value="custom">+ Enter custom role & company...</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-text-muted" />
                </div>
              </div>

              {selectedJobId !== "custom" && selectedJob && (
                <div className="flex flex-col justify-center rounded-xl border border-border/80 bg-surface-secondary/40 p-3.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    Selected Position
                  </span>
                  <p className="truncate text-sm font-bold text-text-primary">
                    {selectedJob.title}
                  </p>
                  <p className="truncate text-xs text-text-secondary">
                    {selectedJob.company} · {selectedJob.location || "Remote"}
                  </p>
                </div>
              )}
            </div>

            {/* Custom role input fields if custom is selected or no saved jobs */}
            {(selectedJobId === "custom" || jobs.length === 0) && (
              <div className="mt-5 grid grid-cols-1 gap-4 border-t border-border/60 pt-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-secondary">
                    Role Title
                  </label>
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="rounded-xl border border-border bg-surface-secondary/60 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-secondary">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    placeholder="e.g. Stripe, Linear, Vercel"
                    className="rounded-xl border border-border bg-surface-secondary/60 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="col-span-full flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-secondary">
                    Key Requirements / Skills to Target (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Paste job description snippets or comma-separated skills (e.g. Next.js, TypeScript, Tailwind, GraphQL)..."
                    className="rounded-xl border border-border bg-surface-secondary/60 p-3 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Skill Alignment & Focus Insights */}
          {(matchedSkills.length > 0 || missingSkills.length > 0) && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <h2 className="text-base font-semibold text-text-primary">
                2. Skills Alignment Analysis
              </h2>
              <p className="mt-0.5 text-xs text-text-muted">
                Gemini will weave missing competencies into your accomplishment statements while emphasizing your existing strengths.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                {matchedSkills.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-success-darker">
                      Strong Match Skills:
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {matchedSkills.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 rounded-lg bg-success-lightest px-2.5 py-1 text-xs font-medium text-success-darker"
                        >
                          <Check className="h-3 w-3" />
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {missingSkills.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary">
                      Target Focus Gaps (Will be naturally highlighted):
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {missingSkills.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 rounded-lg bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary border border-border"
                        >
                          <Target className="h-3 w-3 text-accent" />
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Trigger Card */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  Ready to tailor for {targetCompanyName ? `${targetCompanyName}` : targetRoleName}?
                </h3>
                <p className="mt-0.5 text-xs text-text-secondary">
                  Generates an ATS-compliant PDF with customized achievement bullets and tailored summary.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn btn-primary rounded-full shrink-0 font-bold whitespace-nowrap"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tailoring with Gemini...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Generate Tailored Resume
                  </>
                )}
              </Button>
            </div>

            {genError && (
              <p className="mt-3 text-xs font-medium text-error">{genError}</p>
            )}
          </div>

          {/* Newly Generated Result Card */}
          {latestTailored && (
            <div className="flex flex-col gap-4 rounded-2xl border-2 border-accent/40 bg-surface p-6 shadow-card animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success-lightest text-success-darker">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary">
                      {latestTailored.name}
                    </h3>
                    <p className="text-xs text-text-muted">
                      Generated just now · ATS-formatted vector PDF ready
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={latestTailored.downloadUrl}
                    download
                    className="btn btn-primary btn-sm rounded-full font-semibold"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Download PDF
                  </a>
                  <a
                    href={latestTailored.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm rounded-full"
                  >
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Preview
                  </a>
                </div>
              </div>

              {/* Summary Preview */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Tailored Professional Summary
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary bg-surface-secondary/40 p-4 rounded-xl border border-border/60">
                  {latestTailored.summary}
                </p>
              </div>

              {/* Experience Preview */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Tailored Experience Accomplishments
                </h4>
                <div className="mt-2 space-y-3">
                  {latestTailored.work_experience.slice(0, 2).map((exp, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-border/60 bg-surface-secondary/20 p-4"
                    >
                      <p className="text-xs font-bold text-text-primary">
                        {exp.title} — {exp.company}
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                        {exp.bullets.map((b, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <span className="text-accent font-bold">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVED RESUMES LIBRARY */}
      {activeTab === "saved" && (
        <div className="flex flex-col gap-4">
          {resumes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-muted text-accent">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-text-primary">
                No tailored resumes yet
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-5 text-text-muted">
                Tailor a resume for any saved job or upload your master PDF to generate your first document.
              </p>
              <Button
                type="button"
                onClick={() => setActiveTab("tailor")}
                className="btn btn-primary btn-sm mt-5 rounded-full"
              >
                Tailor your first resume
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {resumes.map((resume) => {
                const downloadUrl = `/api/resume/download/${resume.id}`;
                const sizeKb = resume.file_size
                  ? `${Math.round(resume.file_size / 1024)} KB`
                  : null;

                return (
                  <div
                    key={resume.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card transition-all hover:border-border-muted"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-text-primary">
                            {resume.name}
                          </h3>
                          {resume.is_primary && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2 py-0.5 text-[10px] font-bold text-accent">
                              <Star className="h-3 w-3 fill-accent" /> Primary
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                          {resume.target_company && (
                            <span>{resume.target_company}</span>
                          )}
                          {resume.target_company && resume.target_role && (
                            <span>·</span>
                          )}
                          {resume.target_role && (
                            <span className="text-text-secondary">
                              {resume.target_role}
                            </span>
                          )}
                          <span>·</span>
                          <span>Created {formatDate(resume.created_at)}</span>
                          {sizeKb && <span>· {sizeKb}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {!resume.is_primary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(resume.id)}
                          disabled={settingPrimaryId === resume.id}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-secondary hover:text-text-primary"
                        >
                          Set as Primary
                        </button>
                      )}

                      <a
                        href={downloadUrl}
                        download
                        className="btn btn-secondary btn-sm rounded-full gap-1.5 font-medium"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>

                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg p-2 text-text-muted hover:bg-surface-secondary hover:text-text-primary"
                        title="View PDF"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDeleteResume(resume.id)}
                        disabled={deletingId === resume.id}
                        className="rounded-lg p-2 text-text-muted hover:bg-error-light hover:text-error"
                        title="Delete resume"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MASTER RESUME & EXTRACTION */}
      {activeTab === "master" && (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h2 className="text-base font-semibold text-text-primary">
              Master Resume & Profile Sync
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Upload your existing PDF resume to automatically populate your profile skills, experience, and education via Gemini.
            </p>

            <div className="mt-5">
              <ResumeSection
                existingResumeUrl={existingResumeUrl}
                onExtracted={(data) => {
                  setExtracted(data);
                  setDialogOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Review Dialog for extracted resume */}
      {extracted && (
        <ExtractedReviewDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          extracted={extracted}
          onApplied={() => {
            setDialogOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
