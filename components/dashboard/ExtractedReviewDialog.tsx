"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

import { applyExtractedProfile, type ExtractedProfile } from "@/actions/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  extracted: ExtractedProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied?: () => void;
};

/**
 * Review step of the resume drop-in: shows what Gemini pulled out of the PDF
 * before it is merged over the saved profile (merge is non-destructive — see
 * applyExtractedProfile).
 */
export function ExtractedReviewDialog({
  extracted,
  open,
  onOpenChange,
  onApplied,
}: Props) {
  const [status, setStatus] = useState<"idle" | "applied" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApply() {
    if (!extracted) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await applyExtractedProfile(extracted);
        if (result.success) {
          setStatus("applied");
          onApplied?.();
        } else {
          setStatus("error");
          setError(result.error ?? "Failed to apply the extracted profile.");
        }
      } catch {
        setStatus("error");
        setError("Failed to apply the extracted profile.");
      }
    });
  }

  function handleOpenChange(next: boolean) {
    // Once applied it stays "applied" on the next open of a fresh extraction.
    if (!next && status === "applied") setStatus("idle");
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resume extracted</DialogTitle>
          <DialogDescription>
            Review what Gemini found before it is merged into your profile.
            Empty fields in your current profile are filled in; existing values
            are only replaced when the resume has a richer answer.
          </DialogDescription>
        </DialogHeader>

        {extracted && status !== "applied" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-surface-secondary p-4">
              <p className="text-sm font-semibold leading-5 text-text-primary">
                {extracted.full_name ?? "Name not found"}
                {extracted.current_title ? ` — ${extracted.current_title}` : ""}
              </p>
              {extracted.years_experience != null && (
                <p className="mt-1 text-xs text-text-muted">
                  {extracted.years_experience} years of experience
                </p>
              )}
            </div>

            {extracted.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {extracted.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Experience
                </p>
                <p className="mt-1 font-medium text-text-primary">
                  {extracted.work_experience.length > 0
                    ? `${extracted.work_experience.length} role${
                        extracted.work_experience.length === 1 ? "" : "s"
                      }`
                    : "Not found"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Education
                </p>
                <p className="mt-1 font-medium text-text-primary">
                  {extracted.education.degree || extracted.education.institution
                    ? extracted.education.degree || "Education found"
                    : "Not found"}
                </p>
              </div>
            </div>

            {status === "error" && error && (
              <p className="text-sm text-error">{error}</p>
            )}
          </div>
        )}

        {status === "applied" && (
          <div className="flex flex-col items-start gap-2 rounded-xl border border-border bg-success-lightest p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-success-foreground">
              <Check className="h-4 w-4" />
              Profile updated
            </p>
            <p className="text-sm leading-6 text-text-secondary">
              Your saved profile now includes the fields Gemini pulled from your
              resume.
            </p>
          </div>
        )}

        <DialogFooter>
          {status === "applied" ? (
            <DialogClose asChild>
              <Button type="button">Done</Button>
            </DialogClose>
          ) : (
            <>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Discard
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={handleApply}
                disabled={isPending || !extracted}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPending ? "Applying…" : "Apply to profile"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}