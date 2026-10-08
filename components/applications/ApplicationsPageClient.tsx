"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Send,
  CalendarCheck,
  Trophy,
  MapPin,
  Sparkles,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import type { ApplicationListItem } from "@/types";

type StageConfig = {
  key: "saved" | "applied" | "interview" | "offer";
  label: string;
  icon: typeof Bookmark;
  badgeClass: string;
  cardBg: string;
  headerBg: string;
  emptyText: string;
};

const STAGES: StageConfig[] = [
  {
    key: "saved",
    label: "Saved Roles",
    icon: Bookmark,
    badgeClass: "bg-surface text-info-medium border-border",
    cardBg: "bg-pastel-blue border-info-light hover:border-info-medium/60",
    headerBg: "bg-pastel-blue text-info-medium",
    emptyText: "No roles saved yet. Explore the Jobs feed to save promising opportunities.",
  },
  {
    key: "applied",
    label: "Applied",
    icon: Send,
    badgeClass: "bg-surface text-success-dark border-border",
    cardBg: "bg-pastel-mint border-success-light hover:border-success/60",
    headerBg: "bg-pastel-mint text-success-dark",
    emptyText: "No applications logged yet. Track jobs you've submitted to stay organized.",
  },
  {
    key: "interview",
    label: "Interviews",
    icon: CalendarCheck,
    badgeClass: "bg-surface text-rose-strong border-border",
    cardBg: "bg-pastel-pink border-rose-soft hover:border-rose/60",
    headerBg: "bg-pastel-pink text-rose-strong",
    emptyText: "No interviews scheduled yet. Keep applying to land your next round!",
  },
  {
    key: "offer",
    label: "Offers",
    icon: Trophy,
    badgeClass: "bg-surface text-accent-dark border-border",
    cardBg: "bg-pastel-lilac border-lavender hover:border-accent/60",
    headerBg: "bg-pastel-lilac text-accent-dark",
    emptyText: "No active offers yet. Your hard work will pay off!",
  },
];

type Props = {
  initialApplications: ApplicationListItem[];
};

export function ApplicationsPageClient({ initialApplications }: Props) {
  const [applications, setApplications] = useState<ApplicationListItem[]>(initialApplications);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleStatusChange(applicationId: string, newStatus: string) {
    setUpdatingId(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((item) =>
            item.id === applicationId
              ? { ...item, status: newStatus as ApplicationListItem["status"] }
              : item,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  const grouped = STAGES.map((stage) => ({
    ...stage,
    items: applications.filter((app) => app.status === stage.key),
  }));

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Applications Tracker
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Track your active job pipeline across every stage from save to offer.
            </p>
          </div>
          <Button asChild size="sm" className="rounded-full shrink-0 font-semibold">
            <Link href="/jobs">
              <Briefcase className="mr-1.5 h-4 w-4" /> Find More Roles
            </Link>
          </Button>
        </header>

        {/* Pipeline Summary Top Stat Cards — Reusing Shared StatCard Component with Pastel Themes */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {grouped.map((stage, idx) => (
            <StatCard
              key={stage.key}
              index={idx}
              title={stage.label}
              value={stage.items.length}
              subtitle="Active pipeline count"
              icon={stage.icon}
            />
          ))}
        </div>

        {/* Grouped Stage Sections with Coordinated Pastel Colors */}
        <div className="flex flex-col gap-8">
          {grouped.map((stage) => {
            const StageIcon = stage.icon;
            return (
              <section key={stage.key} className="flex flex-col gap-4">
                <div className="flex items-center gap-2.5 border-b border-border pb-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${stage.headerBg}`}>
                    <StageIcon className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    {stage.label}
                  </h2>
                  <span className={`ml-2 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stage.badgeClass}`}>
                    {stage.items.length}
                  </span>
                </div>

                {stage.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/40 p-8 text-center">
                    <p className="text-xs text-text-muted">{stage.emptyText}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {stage.items.map((item) => {
                      const job = item.job;
                      const title = job?.title ?? "Role";
                      const company = job?.company ?? "Company";
                      const location = job?.location ?? "Remote / Unspecified";
                      const matchScore = job?.match_score ?? null;

                      return (
                        <div
                          key={item.id}
                          className={`group flex flex-col justify-between rounded-2xl border p-5 shadow-card transition-all ${stage.cardBg}`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="line-clamp-2 text-base font-semibold text-text-primary">
                                {title}
                              </h3>
                              {matchScore !== null && matchScore > 0 && (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface/80 px-2 py-0.5 text-xs font-bold text-accent shadow-2xs">
                                  <Sparkles className="h-3 w-3" />
                                  {matchScore}%
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm font-medium text-text-secondary">
                              {company}
                            </p>

                            <div className="mt-2 flex items-center gap-1 text-xs text-text-muted">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{location}</span>
                            </div>
                          </div>

                          <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4">
                            {/* Stage move dropdown */}
                            <select
                              value={item.status}
                              disabled={updatingId === item.id}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              className="rounded-lg border border-border bg-surface/80 px-2.5 py-1 text-xs font-medium text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                            >
                              <option value="saved">Saved</option>
                              <option value="applied">Applied</option>
                              <option value="interview">Interview</option>
                              <option value="offer">Offer</option>
                            </select>

                            {job?.id ? (
                              <Link
                                href={`/jobs/${job.id}`}
                                className="inline-flex items-center text-xs font-semibold text-accent hover:underline"
                              >
                                View Details <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
