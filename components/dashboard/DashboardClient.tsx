"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  MapPin,
  Percent,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
// recharts imports reserved for future analytics chart rendering
// import {
//   Area,
//   AreaChart,
//   Bar,
//   BarChart,
//   CartesianGrid,
//   ResponsiveContainer,
//   Tooltip,
//   XAxis,
//   YAxis,
// } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getAppliedJobIds,
  getRecentlyViewedIds,
  recordJobView,
  toggleAppliedJob,
} from "@/lib/recent-jobs";
import { cn, formatDate, getInitials, getMatchBadgeVariant, getSurname } from "@/lib/utils";
import type { Job } from "@/types";

type Props = {
  initialJobs: Job[];
  totalCount?: number;
  profileName?: string | null;
};

type ActiveTab = "matches" | "recent" | "applied";

function InfoChip({ icon, children }: { icon: "map" | "pay"; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary/80 px-2 py-0.5 text-[11px] font-medium text-text-secondary">
      {icon === "map" ? <MapPin className="h-3 w-3 shrink-0" /> : <DollarSign className="h-3 w-3 shrink-0" />}
      <span className="truncate max-w-[140px]">{children}</span>
    </span>
  );
}

/**
 * Rotating pastel palette — reserved for the top stat cards only. The job
 * showcase cards below mirror the Find Jobs job-card look (surface + border).
 */
const PASTEL_CARD_BACKGROUNDS = [
  "bg-pastel-blue",
  "bg-pastel-mint",
  "bg-pastel-pink",
  "bg-pastel-lilac",
  "bg-pastel-cream",
  "bg-pastel-aqua",
] as const;

function pastelFor(index: number) {
  return PASTEL_CARD_BACKGROUNDS[index % PASTEL_CARD_BACKGROUNDS.length];
}

/**
 * Clean, uncluttered Dashboard overview.
 * Displays candidate stats, workspace shortcuts, and at most 6 cards
 * with tabs for Top AI Matches, Recently Viewed, and Applied/Saved roles.
 */
export function DashboardClient({
  initialJobs,
  totalCount,
  profileName,
}: Props) {
  const totalJobsCount = totalCount ?? initialJobs.length;

  const [activeTab, setActiveTab] = useState<ActiveTab>("matches");
  // Lazy initializers — getRecentlyViewedIds/getAppliedJobIds are SSR-safe
  // (they return [] when window is undefined), so no effect is needed.
  const [recentIds, setRecentIds] = useState<string[]>(() => getRecentlyViewedIds());
  const [appliedIds, setAppliedIds] = useState<string[]>(() => getAppliedJobIds());

  function handleToggleApplied(jobId: string) {
    toggleAppliedJob(jobId);
    setAppliedIds(getAppliedJobIds());
  }

  function handleViewJob(jobId: string) {
    recordJobView(jobId);
    setRecentIds(getRecentlyViewedIds());
  }

  // At most 6 cards for each category
  const topJobs = initialJobs.slice(0, 6);

  const jobMap = new Map(initialJobs.map((j) => [j.id, j]));
  const recentJobs = recentIds
    .map((id) => jobMap.get(id))
    .filter((j): j is Job => Boolean(j))
    .slice(0, 6);

  const appliedJobs = appliedIds
    .map((id) => jobMap.get(id))
    .filter((j): j is Job => Boolean(j))
    .slice(0, 6);

  const displayedJobs =
    activeTab === "recent"
      ? recentJobs
      : activeTab === "applied"
        ? appliedJobs
        : topJobs;

  // Compute key stats
  const scoredJobs = initialJobs.filter((j) => j.match_score !== null);
  const avgMatchRate =
    scoredJobs.length > 0
      ? Math.round(
          scoredJobs.reduce((acc, j) => acc + (j.match_score ?? 0), 0) /
            scoredJobs.length,
        )
      : 0;

  const highestScore =
    scoredJobs.length > 0
      ? Math.max(...scoredJobs.map((j) => j.match_score ?? 0))
      : 0;

  const researchedCount = initialJobs.filter(
    (j) => j.company_research !== null,
  ).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Welcome back, {getSurname(profileName) ?? "Jobber"}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Here are your highest-scoring job matches and live agent activity.
          </p>
        </div>

        <Button asChild size="sm" className="rounded-full gap-2 shrink-0 self-start sm:self-auto font-semibold">
          <Link href="/jobs">
            <Search className="h-3.5 w-3.5" />
            Find More Roles
          </Link>
        </Button>
      </div>

      {/* Stats Bar */}
      <section className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`rounded-[28px] border border-ink/[0.04] ${pastelFor(0)} p-5 sm:p-6`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Total Roles Found
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface/70 text-text-secondary">
              <Briefcase className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-text-primary">
            {totalJobsCount}
          </p>
          <p className="mt-1 text-xs text-text-muted">Indexed across live sources</p>
        </div>

        <div className={`rounded-[28px] border border-ink/[0.04] ${pastelFor(1)} p-5 sm:p-6`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Avg Match Score
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface/70 text-accent">
              <Percent className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-text-primary">
            {avgMatchRate > 0 ? `${avgMatchRate}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-text-muted">Based on your skills & profile</p>
        </div>

        <div className={`rounded-[28px] border border-ink/[0.04] ${pastelFor(2)} p-5 sm:p-6`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Highest Match
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface/70 text-success">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-text-primary">
            {highestScore > 0 ? `${highestScore}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-text-muted">Top candidate alignment</p>
        </div>

        <div className={`rounded-[28px] border border-ink/[0.04] ${pastelFor(3)} p-5 sm:p-6`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Researched Companies
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface/70 text-info-medium">
              <Building2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold text-text-primary">
            {researchedCount}
          </p>
          <p className="mt-1 text-xs text-text-muted">AI dossiers ready</p>
        </div>
      </section>

      {/* Workspace Jobs Showcase (At Most 6 Cards with Tabs) */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-border bg-surface p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab("matches")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                activeTab === "matches"
                  ? "bg-ink text-accent-foreground shadow-xs"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Top AI Matches
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("recent")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                activeTab === "recent"
                  ? "bg-ink text-accent-foreground shadow-xs"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              Recently Viewed
              {recentJobs.length > 0 && (
                <span className={cn(
                  "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                  activeTab === "recent" ? "bg-surface text-ink" : "bg-surface-secondary text-text-primary"
                )}>
                  {recentJobs.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("applied")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                activeTab === "applied"
                  ? "bg-ink text-accent-foreground shadow-xs"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Applied / Saved
              {appliedJobs.length > 0 && (
                <span className={cn(
                  "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                  activeTab === "applied" ? "bg-surface text-ink" : "bg-surface-secondary text-text-primary"
                )}>
                  {appliedJobs.length}
                </span>
              )}
            </button>
          </div>

          <Link
            href="/jobs"
            className="inline-flex shrink-0 items-center gap-1.5 self-start text-xs font-semibold text-accent transition-colors hover:text-accent-dark hover:underline sm:self-auto"
          >
            Explore all {totalJobsCount} roles
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {displayedJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface px-6 py-14 text-center shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary">
              {activeTab === "recent" ? (
                <Clock className="h-6 w-6 text-text-muted" />
              ) : activeTab === "applied" ? (
                <Briefcase className="h-6 w-6 text-text-muted" />
              ) : (
                <Search className="h-6 w-6 text-text-muted" />
              )}
            </div>
            <p className="mt-4 text-sm font-semibold text-text-primary">
              {activeTab === "recent"
                ? "No recently viewed roles yet"
                : activeTab === "applied"
                  ? "No applied or saved roles yet"
                  : "No matched roles found yet"}
            </p>
            <p className="mt-1.5 max-w-sm text-xs text-text-muted">
              {activeTab === "recent"
                ? "Click 'View Details' on any position to track roles you've previewed."
                : activeTab === "applied"
                  ? "Click 'Mark Applied' on any position card to track your pipeline."
                  : "Discover open positions across live job sources scored by AI."}
            </p>
            <Button asChild size="sm" className="mt-5 rounded-full font-semibold">
              <Link href="/jobs">Browse Live Jobs</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {displayedJobs.map((job) => {
              const company = job.company ?? "Unknown company";
              const title = job.title ?? "Untitled role";
              const isApplied = appliedIds.includes(job.id);

              return (
                <div
                  key={job.id}
                  className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-border-muted"
                >
                  <div>
                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-secondary border border-border/60 text-xs font-bold text-text-primary">
                          {getInitials(company)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold leading-4 text-text-secondary">
                            {company}
                          </p>
                          <p className="text-[11px] text-text-muted">{formatDate(job.found_at)}</p>
                        </div>
                      </div>

                      <Badge variant={getMatchBadgeVariant(job.match_score)} className="shrink-0 text-xs">
                        {job.match_score !== null ? `${job.match_score}% Match` : "Not scored"}
                      </Badge>
                    </div>

                    {/* Role Title */}
                    <h3 className="mt-3 text-base font-bold leading-snug text-text-primary group-hover:text-accent transition-colors line-clamp-1">
                      <Link
                        href={`/jobs/${job.id}`}
                        onClick={() => handleViewJob(job.id)}
                      >
                        {title}
                      </Link>
                    </h3>

                    {/* Chips */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {job.location && <InfoChip icon="map">{job.location}</InfoChip>}
                      {job.salary && <InfoChip icon="pay">{job.salary}</InfoChip>}
                    </div>
                  </div>

                  {/* Card Bottom */}
                  <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleApplied(job.id)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
                        isApplied
                          ? "bg-success-lightest text-success border border-success/30 font-semibold"
                          : "bg-surface-secondary text-text-secondary hover:text-text-primary border border-border",
                      )}
                      title={isApplied ? "Remove from applied" : "Mark as applied"}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {isApplied ? "Applied" : "Mark applied"}
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        onClick={() => handleViewJob(job.id)}
                        className="inline-flex items-center gap-0.5 text-xs font-semibold text-text-primary hover:text-accent transition-colors"
                      >
                        View Details
                        <ArrowRight className="h-3 w-3" />
                      </Link>

                      {job.external_apply_url && (
                        <Link
                          href={job.external_apply_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-text-muted hover:text-text-primary ml-1"
                          title="Apply on source job board"
                        >
                          Apply
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Analytics Charts */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-text-primary sm:text-xl">
            Analytics
          </h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            Track job discovery and research activity over time
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex h-[220px] flex-col rounded-2xl border border-border bg-surface p-4 shadow-card sm:h-55">
            <p className="text-sm font-semibold text-text-primary">Jobs Found Over Time</p>
            <p className="text-xs text-text-muted">Last 30 days</p>
            <div className="flex flex-1 items-center justify-center text-center">
              <p className="px-6 text-xs text-text-muted">No data exists yet</p>
            </div>
          </div>
          <div className="flex h-[220px] flex-col rounded-2xl border border-border bg-surface p-4 shadow-card sm:h-55">
            <p className="text-sm font-semibold text-text-primary">Match Score Distribution</p>
            <p className="text-xs text-text-muted">Jobs found</p>
            <div className="flex flex-1 items-center justify-center text-center">
              <p className="px-6 text-xs text-text-muted">No data exists yet</p>
            </div>
          </div>
          <div className="flex h-[220px] flex-col rounded-2xl border border-border bg-surface p-4 shadow-card sm:h-55 md:col-span-2">
            <p className="text-sm font-semibold text-text-primary">Company Research Activity</p>
            <p className="text-xs text-text-muted">Last 7 days</p>
            <div className="flex flex-1 items-center justify-center text-center">
              <p className="px-6 text-xs text-text-muted">No data exists yet</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}