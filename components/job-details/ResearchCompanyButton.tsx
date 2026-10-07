"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";

import type { CompanyResearchDossier } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  jobId: string;
  fullWidth?: boolean;
};

export function ResearchCompanyButton({ jobId, fullWidth = false }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick(): void {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const res = await fetch("/api/agent/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });
        const json = (await res.json()) as {
          success: boolean;
          data?: { dossier: CompanyResearchDossier };
          error?: string;
        };

        if (!res.ok || !json.success) {
          setError(
            json.error ??
              "Company research could not be completed. Please try again.",
          );
          return;
        }

        setSuccess(true);
        router.refresh();
      } catch {
        setError("Network error. Please check your connection and try again.");
      }
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        fullWidth ? "w-full items-stretch" : "items-start sm:items-end",
      )}
    >
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className={cn(
          "btn btn-primary btn-sm disabled:opacity-60",
          fullWidth && "w-full justify-center",
        )}
      >
        <Search className="h-4 w-4" />
        {isPending ? "Researching..." : "Research Company"}
      </button>
      {error && <p className="max-w-xs text-xs text-error">{error}</p>}
      {success && (
        <p className="max-w-xs text-xs text-success">
          Research saved. Refreshing details...
        </p>
      )}
    </div>
  );
}
