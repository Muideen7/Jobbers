"use client";

import { useRef, useState, useTransition } from "react";
import { CloudUpload, FileText, Loader2, Sparkles } from "lucide-react";

import { extractProfile, uploadResume } from "@/actions/profile";
import type { ExtractedProfile } from "@/actions/profile";
import { ExtractedReviewDialog } from "@/components/dashboard/ExtractedReviewDialog";
import { cn } from "@/lib/utils";

type Props = {
  /** Called after extracted data has been applied to the saved profile. */
  onApplied?: () => void;
};

type Phase = "idle" | "uploading" | "extracting";

/**
 * Sidebar resume drop-in: dropping a PDF uploads it, asks Gemini to extract a
 * profile, and opens a review dialog before anything is written.
 */
export function ResumeDropzone({ onApplied }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, startTransition] = useTransition();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (file.type !== "application/pdf") {
      setError("Only PDF resumes are supported.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("The resume must be under 2MB.");
      return;
    }

    setFileName(file.name);
    setPhase("uploading");
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("resume", file);

        const upload = await uploadResume(formData);
        if (!upload.success) {
          setError(upload.error ?? "Upload failed. Please try again.");
          setPhase("idle");
          return;
        }

        setPhase("extracting");
        const result = await extractProfile();
        if (!result.success || !result.data) {
          setError(result.error ?? "Extraction failed. Please try again.");
          setPhase("idle");
          return;
        }

        setExtracted(result.data);
        setDialogOpen(true);
        setPhase("idle");
      } catch {
        setError("Something went wrong. Please try again.");
        setPhase("idle");
      }
    });
  }

  const busy = phase !== "idle";

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload your resume PDF"
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!busy) inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!busy) void handleFile(e.dataTransfer.files[0]);
        }}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-colors",
          busy
            ? "border-text-muted bg-surface-secondary"
            : isDragging
              ? "border-accent bg-accent-muted"
              : "border-ink/30 bg-surface-secondary hover:border-accent hover:bg-accent-muted",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />

        {busy ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <p className="text-xs font-medium text-text-secondary">
              {phase === "uploading" ? "Uploading…" : "Extracting with Gemini…"}
            </p>
          </div>
        ) : extracted ? (
          <div className="flex flex-col items-center gap-1.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-lightest">
              <FileText className="h-4 w-4 text-success" />
            </span>
            <p className="text-xs font-medium text-text-primary">
              {fileName ?? "Resume parsed"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <CloudUpload className="h-6 w-6 text-text-muted" />
            <p className="text-xs font-semibold text-text-primary">Drop your resume</p>
            <p className="flex items-center gap-1 text-xs text-text-muted">
              <Sparkles className="h-3 w-3 text-accent" />
              Gemini extracts your profile instantly
            </p>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-error">{error}</p>}

      <ExtractedReviewDialog
        extracted={extracted}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        {...(onApplied ? { onApplied } : {})}
      />
    </>
  );
}