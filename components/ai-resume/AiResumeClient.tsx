"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileDown, Sparkles } from "lucide-react";

import type { ExtractedProfile } from "@/actions/profile";
import { ResumeSection } from "@/components/profile/ResumeSection";
import { ExtractedReviewDialog } from "@/components/dashboard/ExtractedReviewDialog";
import { Button } from "@/components/ui/button";

/**
 * /ai-resume: reuses the profile page's ResumeSection (upload -> Gemini
 * extract) and routes the extracted profile through the shared review dialog
 * so a user can apply it without leaving the page.
 */
export function AiResumeClient({
  existingResumeUrl,
}: {
  existingResumeUrl: string | null;
}) {
  const router = useRouter();
  const [extracted, setExtracted] = useState<ExtractedProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          AI Resume
        </h1>
        <p className="mt-1 text-sm leading-6 text-text-secondary">
          Upload a resume to extract your profile into Jobbers, then have
          Gemini tailor it for a specific role.
        </p>
      </header>

      <ResumeSection
        existingResumeUrl={existingResumeUrl}
        onExtracted={(data) => {
          setExtracted(data);
          setDialogOpen(true);
        }}
      />

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted">
            <FileDown className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold leading-6 text-text-primary">
              Tailor a resume for a role
            </h2>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              Select a saved job from your feed and Gemini rewrites your resume
              to match it, then hands you a ready-to-apply PDF.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <a href="/dashboard" aria-label="Find a role to tailor a resume for">
                <Sparkles className="h-4 w-4" />
                Find a role
              </a>
            </Button>
          </div>
          <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-text-muted">
            Coming soon
          </span>
        </div>
      </section>

      <ExtractedReviewDialog
        extracted={extracted}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onApplied={() => router.refresh()}
      />
    </div>
  );
}