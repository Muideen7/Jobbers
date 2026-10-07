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
 * Compact resume dropzone for the sidebar: dropping or selecting a PDF uploads it,
 * extracts profile data with Gemini, and opens the review dialog.
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
          "group relative flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed p-3.5 text-center transition-all",
          busy
            ? "border-text-muted bg-surface-secondary/70"
            : isDragging
              ? "border-accent bg-accent-muted ring-2 ring-accent/20"
              : "border-border bg-surface-secondary/40 hover:border-accent hover:bg-accent-muted/20",
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
          <div className="flex items-center gap-2 py-1">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            <p className="text-xs font-medium text-text-secondary">
              {phase === "uploading" ? "Uploading PDF…" : "Gemini extracting…"}
            </p>
          </div>
        ) : extracted ? (
          <div className="flex items-center gap-2 py-0.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-lightest">
              <FileText className="h-3.5 w-3.5 text-success" />
            </span>
            <div className="text-left">
              <p className="max-w-[170px] truncate text-xs font-semibold text-text-primary">
                {fileName ?? "Resume parsed"}
              </p>
              <p className="text-[11px] text-text-muted">Click to replace</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 py-0.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface text-text-muted transition-colors group-hover:text-accent">
              <CloudUpload className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-text-primary group-hover:text-accent transition-colors">
                Drop resume PDF or browse
              </p>
              <p className="flex items-center gap-1 text-[11px] text-text-muted">
                <Sparkles className="h-2.5 w-2.5 text-accent" />
                Auto-fills profile with AI
              </p>
            </div>
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