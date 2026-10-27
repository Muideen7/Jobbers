"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[JobsError] captured crash in /jobs:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-light border border-border">
        <AlertTriangle className="h-7 w-7 text-danger" />
      </div>

      <h2 className="mt-5 text-xl font-bold tracking-tight text-text-primary">
        Unable to load jobs
      </h2>

      <p className="mt-2 text-sm text-text-secondary leading-relaxed">
        We encountered an unexpected error while finding or scoring roles. Please try again or head back to the dashboard.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => reset()}
          size="sm"
          className="rounded-full gap-2 px-5 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-full gap-2 px-5"
        >
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Go to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
