import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Briefcase, FileText } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { privateMetadata } from "../../private-metadata";

export const metadata: Metadata = privateMetadata(
  "Applications",
  "Track every job you have applied to across sources.",
);

/**
 * Honest placeholder: application tracking ships with the auto-apply phase.
 * Until then, point users at the two places that make applying easier today.
 */
export default async function ApplicationsPage() {
  await requireUser();

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pb-12 pt-6 sm:px-6 lg:px-0">
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Applications
          </h1>
          <p className="mt-1 text-sm leading-6 text-text-secondary">
            One place to see every role you have applied to — coming with the
            auto-apply phase.
          </p>
        </header>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted">
              <Briefcase className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-6 text-text-primary">
                Tracking is on its way
              </h2>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                When auto-apply ships, every submission lands here: where you
                applied, when, and the source it went through. For now, keep
                moving with the two workflows that get you to an application.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/jobs?tab=saved"
              className="group flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent">
              <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <FileText className="h-4 w-4 text-accent" />
                Ready to apply
                <ArrowRight className="ml-auto h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5" />
              </p>
              <p className="text-sm leading-6 text-text-muted">
                Every saved role where you interviewed the company already.
              </p>
            </Link>
            <Link
              href="/jobs"
              className="group flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent">
              <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Briefcase className="h-4 w-4 text-accent" />
                Find more roles
                <ArrowRight className="ml-auto h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5" />
              </p>
              <p className="text-sm leading-6 text-text-muted">
                Fresh multi-source jobs scored against your profile.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}