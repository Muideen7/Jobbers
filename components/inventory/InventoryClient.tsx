"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, MapPin, Search, SearchX } from "lucide-react";

import { matchesQuery } from "@/lib/dashboard-filters";
import { formatDate, getInitials, getMatchBadgeVariant, MATCH_THRESHOLD } from "@/lib/utils";
import type { Job } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type StatusFilter = "all" | "researched" | "unresearched" | "high";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "researched", label: "Researched" },
  { value: "unresearched", label: "Not researched" },
  { value: "high", label: `High match (${MATCH_THRESHOLD}%+)` },
];

/**
 * Inventory workspace page: search + status filter over every saved job.
 * Uses the current app language (border-border, shadow-card) and links
 * through to the full job detail page.
 */
export function InventoryClient({ jobs }: { jobs: Job[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      if (!matchesQuery(job, query)) return false;
      const hasResearch = job.company_research !== null;
      switch (status) {
        case "researched":
          return hasResearch;
        case "unresearched":
          return !hasResearch;
        case "high":
          return (job.match_score ?? 0) >= MATCH_THRESHOLD;
        default:
          return true;
      }
    });
  }, [jobs, query, status]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Inventory</h1>
        <p className="mt-1 text-sm leading-6 text-text-secondary">
          Every role saved from your searches, with its AI match score and
          research status.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title, company, or skill..."
            aria-label="Filter inventory"
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={status === filter.value ? "default" : "outline"}
              className="rounded-full px-3"
              onClick={() => setStatus(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface px-6 py-16 text-center shadow-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary">
            <SearchX className="h-6 w-6 text-text-muted" />
          </div>
          <p className="mt-5 text-sm font-semibold text-text-primary">
            {jobs.length === 0 ? "No saved jobs yet" : "No jobs match this view"}
          </p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-text-muted">
            {jobs.length === 0
              ? "Run a search from the dashboard or find-jobs page and saved roles will appear here."
              : "Try a different search term or status filter."}
          </p>
          {jobs.length === 0 && (
            <Button asChild variant="outline" className="mt-5">
              <Link href="/home">Search for jobs</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((job) => (
            <InventoryCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

function InventoryCard({ job }: { job: Job }) {
  const company = job.company ?? "Unknown company";
  const title = job.title ?? "Untitled role";
  const hasResearch = job.company_research !== null;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-bold text-accent">
            {getInitials(company)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-4 text-text-primary">
              {company}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
              <CalendarDays className="h-3 w-3" />
              {formatDate(job.found_at)}
            </p>
          </div>
        </div>
        <Badge variant={getMatchBadgeVariant(job.match_score)}>
          {job.match_score !== null ? `${job.match_score}% Match` : "Not scored"}
        </Badge>
      </div>

      <Link
        href={`/jobs/${job.id}`}
        className="text-base font-semibold leading-6 text-text-primary transition-colors hover:text-accent"
      >
        {title}
      </Link>

      <div className="flex flex-wrap gap-1.5">
        {job.location && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary">
            <MapPin className="h-3 w-3" />
            {job.location}
          </span>
        )}
        {job.salary && (
          <span className="inline-flex items-center rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary">
            {job.salary}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant={hasResearch ? "success" : "secondary"}>
          {hasResearch ? "Researched" : "Not researched"}
        </Badge>
        {job.is_tailored && <Badge variant="info">Tailored</Badge>}
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link href={`/jobs/${job.id}`}>View details</Link>
        </Button>
        {job.external_apply_url && (
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={job.external_apply_url} target="_blank" rel="noreferrer">
              Apply
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}