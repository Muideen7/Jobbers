"use client";

import Link from "next/link";
import {
  BarChart2,
  TrendingUp,
  Building2,
  ArrowRight,
  Calendar,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Job } from "@/types";

type Props = {
  jobs: Job[];
  /** Current epoch ms, computed on the server so the client render stays pure. */
  now: number;
};

type DayBucket = { label: string; count: number };

function buildJobsOverTime(jobs: Job[]): DayBucket[] {
  const buckets: Record<string, number> = {};
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = 0;
  }
  for (const job of jobs) {
    if (!job.found_at) continue;
    const key = new Date(job.found_at).toISOString().slice(0, 10);
    if (key in buckets) {
      buckets[key] = (buckets[key] ?? 0) + 1;
    }
  }
  return Object.entries(buckets).map(([date, count]) => ({
    label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    count,
  }));
}

function buildScoreDistribution(jobs: Job[]): { range: string; count: number; color: string }[] {
  const bands = [
    { range: "0–19", min: 0, max: 20, color: "bg-error" },
    { range: "20–39", min: 20, max: 40, color: "bg-warning" },
    { range: "40–59", min: 40, max: 60, color: "bg-info-medium" },
    { range: "60–79", min: 60, max: 80, color: "bg-info" },
    { range: "80–100", min: 80, max: 101, color: "bg-success" },
  ];
  return bands.map((band) => ({
    range: band.range,
    count: jobs.filter((j) => {
      const s = j.match_score ?? 0;
      return s >= band.min && s < band.max;
    }).length,
    color: band.color,
  }));
}

function MiniBarChart({ data }: { data: DayBucket[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex h-32 items-end gap-0.5 sm:gap-1" aria-hidden>
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm bg-accent transition-all"
            style={{ height: `${Math.max(2, (d.count / max) * 100)}%`, opacity: d.count === 0 ? 0.2 : 1 }}
          />
          {i % 3 === 0 && (
            <span className="hidden text-[9px] text-text-muted sm:block truncate">{d.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ScoreDistributionBars({
  data,
}: {
  data: { range: string; count: number; color: string }[];
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((band) => (
        <div key={band.range} className="flex items-center gap-3">
          <span className="w-12 shrink-0 text-right text-xs text-text-muted">{band.range}</span>
          <div className="flex-1 h-5 rounded-full bg-surface-secondary overflow-hidden">
            <div
              className={`h-full rounded-full ${band.color} transition-all duration-500`}
              style={{ width: `${Math.max(2, (band.count / max) * 100)}%`, opacity: band.count === 0 ? 0.2 : 1 }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs font-semibold text-text-primary">
            {band.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsPage({ jobs, now }: Props) {
  const scoredJobs = jobs.filter((j) => j.match_score !== null);
  const avgScore =
    scoredJobs.length > 0
      ? Math.round(scoredJobs.reduce((s, j) => s + (j.match_score ?? 0), 0) / scoredJobs.length)
      : null;
  const highMatches = jobs.filter((j) => (j.match_score ?? 0) >= 60).length;
  const researched = jobs.filter((j) => j.company_research !== null).length;
  const thisWeek = jobs.filter((j) => {
    if (!j.found_at) return false;
    return now - new Date(j.found_at).getTime() < 7 * 86_400_000;
  }).length;

  const overTimeData = buildJobsOverTime(jobs);
  const distributionData = buildScoreDistribution(jobs);
  const isEmpty = jobs.length === 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-accent" />
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Analytics</h1>
        </div>
        <p className="text-sm text-text-secondary">
          Track job discovery, match quality and research activity across your account.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Roles", value: String(jobs.length), icon: Sparkles, color: "text-accent", bg: "bg-accent-muted" },
          { label: "Avg Match", value: avgScore !== null ? `${avgScore}%` : "—", icon: TrendingUp, color: "text-success", bg: "bg-success-lightest" },
          { label: "High Matches (≥60%)", value: String(highMatches), icon: Calendar, color: "text-info-medium", bg: "bg-surface-secondary" },
          { label: "Researched", value: String(researched), icon: Building2, color: "text-warning", bg: "bg-surface-secondary" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted truncate">{kpi.label}</span>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-text-primary">{kpi.value}</p>
            <p className="mt-0.5 text-xs text-text-muted">This week: {thisWeek} new</p>
          </div>
        ))}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface px-6 py-16 text-center shadow-card">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-secondary">
            <BarChart2 className="h-7 w-7 text-text-muted" />
          </div>
          <p className="mt-5 text-sm font-semibold text-text-primary">No data yet</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">
            Run a job search and analytics will start populating here — match trends, score distributions, and research activity.
          </p>
          <Button asChild size="sm" className="mt-5 rounded-full font-semibold">
            <Link href="/jobs">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Find your first roles
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Jobs over time */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-primary">Jobs Found Over Time</p>
                <p className="text-xs text-text-muted">Last 14 days</p>
              </div>
              <span className="rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-medium text-accent">
                {thisWeek} this week
              </span>
            </div>
            <MiniBarChart data={overTimeData} />
            <div className="mt-4 flex justify-between text-[10px] text-text-muted">
              <span>{overTimeData[0]?.label}</span>
              <span>{overTimeData[overTimeData.length - 1]?.label}</span>
            </div>
          </div>

          {/* Match score distribution */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-primary">Match Score Distribution</p>
                <p className="text-xs text-text-muted">{scoredJobs.length} scored roles</p>
              </div>
              {avgScore !== null && (
                <span className="rounded-full bg-success-lightest px-2.5 py-0.5 text-xs font-medium text-success">
                  Avg {avgScore}%
                </span>
              )}
            </div>
            <ScoreDistributionBars data={distributionData} />
          </div>

          {/* Research coverage */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-primary">Company Research Coverage</p>
                <p className="text-xs text-text-muted">
                  {researched} of {jobs.length} roles have dossiers
                </p>
              </div>
              <Link href="/company-research" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-secondary">
              <div
                className="h-full rounded-full bg-accent transition-all duration-700"
                style={{ width: `${jobs.length > 0 ? (researched / jobs.length) * 100 : 0}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-6 text-xs text-text-muted">
              <span><span className="font-semibold text-text-primary">{researched}</span> researched</span>
              <span><span className="font-semibold text-text-primary">{jobs.length - researched}</span> pending</span>
              <span><span className="font-semibold text-text-primary">{jobs.length > 0 ? Math.round((researched / jobs.length) * 100) : 0}%</span> coverage</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
