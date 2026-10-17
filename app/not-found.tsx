"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Compass, LayoutDashboard } from "lucide-react";

import { JobbersIcon } from "@/components/homepage/Logos";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  function handleGoBack() {
    if (typeof window !== "undefined") {
      const hasHistory = window.history.length > 1;
      const isInternal =
        Boolean(document.referrer) &&
        document.referrer.startsWith(window.location.origin);

      if (hasHistory || isInternal) {
        window.history.back();
        return;
      }
    }
    router.push("/home");
  }

  return (
    <main className="min-h-[85vh] w-full flex flex-col items-center justify-center px-4 py-16 bg-background animate-page-enter">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Brand icon & 404 pill */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-surface border border-border shadow-xs text-text-primary">
            <JobbersIcon className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-secondary text-xs font-semibold text-text-dark border border-border">
            <Compass className="w-3.5 h-3.5 text-text-muted" />
            <span>404 &bull; Not Found</span>
          </div>
        </div>

        {/* Heading & description */}
        <div className="space-y-2.5">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Page not found
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
            The page you are looking for doesn&apos;t exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGoBack}
            className="cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Go back
          </Button>

          <Button asChild variant="secondary" size="sm">
            <Link href="/home">
              <LayoutDashboard className="w-4 h-4 mr-1.5" />
              Dashboard
            </Link>
          </Button>

          <Button asChild size="sm">
            <Link href="/jobs">
              <Search className="w-4 h-4 mr-1.5" />
              Browse live jobs
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
