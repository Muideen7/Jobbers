"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowRight, Eye, SearchX } from "lucide-react";

import { ResearchCompanyButton } from "@/components/job-details/ResearchCompanyButton";
import { Badge } from "@/components/ui/badge";
import { getRecentlyViewedIds } from "@/lib/recent-jobs";
import { formatDate, getInitials, getMatchBadgeVariant } from "@/lib/utils";
import type { Job } from "@/types";

export type QueueJob = Pick<
  Job,
  "id" | "title" | "company" | "location" | "found_at" | "match_score"
>;

type Props = {
  jobs: QueueJob[];
};

/**
 * localStorage is an external store, so expose it through useSyncExternalStore.
 * The parsed array is cached by its serialized value to keep the snapshot
 * reference stable between renders.
 */
let viewedCache: { key: string; ids: string[] } | null = null;

function getViewedSnapshot(): string[] {
  const ids = getRecentlyViewedIds();
  const key = ids.join("\u0000");
  if (!viewedCache || viewedCache.key !== key) {
    viewedCache = { key, ids };
  }
  return viewedCache.ids;
}

function getServerViewedSnapshot(): null {
  return null;
}

function subscribeViewed(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted">
        <SearchX className="h-5 w-5 text-accent" />
      </div>
      <p className="mt-3 text-sm font-medium text-text-primary">
        Nothing waiting on research
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-text-muted">
        Open a role from{" "}
        <Link
          href="/jobs"
          className="font-medium text-accent hover:text-accent-dark"
        >
          Find Jobs
        </Link>{" "}
        and it will land here until you research the company.
      </p>
    </div>
  );
}

/**
 * The Research queue is driven by which jobs the user has *opened* — that
 * history lives in localStorage, so the server hands over every unresearched
 * role and this component intersects it with the viewed ids (newest first).
 */
export function ResearchQueue({ jobs }: Props) {
  const viewedIds = useSyncExternalStore(
    subscribeViewed,
    getViewedSnapshot,
    getServerViewedSnapshot,
  );

  if (viewedIds === null) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-44 animate-pulse rounded-2xl border border-border bg-surface-secondary/40"
          />
        ))}
      </div>
    );
  }

  const byId = new Map(jobs.map((job) => [job.id, job]));
  const waiting = viewedIds
    .map((id) => byId.get(id))
    .filter((job): job is QueueJob => Boolean(job));

  if (waiting.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {waiting.map((job) => {
        const company = job.company ?? "Unknown company";

        return (
          <article
            key={job.id}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-border-muted hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-bold text-accent">
                  {getInitials(company)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-4 text-text-primary">
                    {job.title ?? "Untitled role"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {company}
                    {job.location ? ` · ${job.location}` : ""}
                  </p>
                </div>
              </div>
              <Badge
                variant={getMatchBadgeVariant(job.match_score)}
                className="shrink-0 text-[11px]"
              >
                {job.match_score !== null
                  ? `${job.match_score}% Match`
                  : "Not scored"}
              </Badge>
            </div>

            <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-surface-secondary px-2.5 py-1 text-[11px] font-medium text-text-secondary">
              <Eye className="h-3 w-3" />
              Viewed · not researched
            </div>

            <p className="text-xs text-text-muted">
              Found {formatDate(job.found_at)}
            </p>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3.5">
              <Link
                href={`/jobs/${job.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-dark"
              >
                View role
                <ArrowRight className="h-4 w-4" />
              </Link>
              <ResearchCompanyButton jobId={job.id} />
            </div>
          </article>
        );
      })}
    </div>
  );
}