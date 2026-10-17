"use client";

import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";

type Props = {
  jobId: string;
  applyUrl: string;
  company: string;
  initialApplied?: boolean;
};

export function ApplyNowButton({
  jobId,
  applyUrl,
  company,
  initialApplied = false,
}: Props) {
  const [applied, setApplied] = useState(initialApplied);

  async function handleApply() {
    window.open(applyUrl, "_blank", "noopener,noreferrer");

    if (!applied) {
      setApplied(true);
      try {
        await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, status: "applied" }),
        });
      } catch {
        // Silently tolerate tracking errors on client click
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleApply}
      className={`btn w-full whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 ${
        applied
          ? "border border-success bg-pastel-mint text-success-foreground font-semibold"
          : "btn-primary"
      }`}
    >
      {applied ? (
        <>
          <Check className="h-4 w-4" />
          Applied to {company} (View Again)
        </>
      ) : (
        <>
          <span>Apply Now at {company}</span>
          <ExternalLink className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
