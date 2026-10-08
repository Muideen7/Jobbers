"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileDown, Loader2, Sparkles } from "lucide-react";

import type { ExtractedProfile } from "@/actions/profile";
import { ResumeSection } from "@/components/profile/ResumeSection";
import { ExtractedReviewDialog } from "@/components/dashboard/ExtractedReviewDialog";
import { Button } from "@/components/ui/button";

/**
 * /resumes surface: upload -> Gemini extract, plus instant PDF generation via Gemini + @react-pdf/renderer.
 */
export function AiResumeClient({
  existingResumeUrl,
}: {
  existingResumeUrl: string | null;
}) {
  const router = useRouter();
  const [extracted, setExtracted] = useState<ExtractedProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  async function handleGeneratePdf() {
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/resume/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate resume PDF");
      }
      router.refresh();
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : "Error generating resume PDF");
    } finally {
      setIsGenerating(false);
    }
  }

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
              Generate PDF Resume with Gemini
            </h2>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              Gemini rewrites your achievements into impactful action bullet points and renders a clean, professional PDF resume ready for job applications.
            </p>

            {genError && (
              <p className="mt-2 text-xs font-medium text-destructive">
                {genError}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                onClick={handleGeneratePdf}
                disabled={isGenerating}
                size="sm"
                className="rounded-full"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {isGenerating ? "Generating PDF…" : "Generate AI Resume PDF"}
              </Button>

              {existingResumeUrl && (
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <a
                    href={`/api/resume/download`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Download Resume
                  </a>
                </Button>
              )}
            </div>
          </div>
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