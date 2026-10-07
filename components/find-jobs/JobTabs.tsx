"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FlaskConical } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DEFAULT_JOBS_TAB,
  JOBS_TABS,
  JOBS_TAB_LABELS,
  type JobsTab,
} from "@/lib/workspace/jobs-tab";

type Props = {
  activeTab: JobsTab;
  researched: boolean;
};

/**
 * View switcher for /jobs. State lives in the URL (`?tab=`, `?researched=1`)
 * so every view is deep-linkable and survives a reload; this component only
 * rewrites the query string and lets the server component re-render the feed.
 *
 * The tab row scrolls horizontally on mobile rather than wrapping, so the
 * three labels stay on one line at 320px.
 */
export function JobTabs({ activeTab, researched }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function navigate(nextTab: JobsTab, nextResearched: boolean) {
    if (nextTab === activeTab && nextResearched === researched) return;

    const params = new URLSearchParams(searchParams);
    if (nextTab === DEFAULT_JOBS_TAB) {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }
    if (nextResearched) {
      params.set("researched", "1");
    } else {
      params.delete("researched");
    }

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/jobs?${query}` : "/jobs");
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* A nav, not a tablist: each button navigates to a URL, and there is no
          tabpanel element to pair with `role="tab"` — claiming the pattern we do
          not implement would just make screen readers announce a dead tab. */}
      <nav
        aria-label="Job views"
        className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5"
      >
        {JOBS_TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              aria-current={active ? "page" : undefined}
              disabled={isPending}
              onClick={() => navigate(tab, researched)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent",
                "disabled:cursor-default disabled:opacity-70",
                active
                  ? "bg-ink text-accent-foreground shadow-xs"
                  : "border border-border bg-surface text-text-secondary hover:border-border-muted hover:text-text-primary",
              )}
            >
              {JOBS_TAB_LABELS[tab]}
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        aria-pressed={researched}
        disabled={isPending}
        onClick={() => navigate(activeTab, !researched)}
        title="Only show roles you have run company research for"
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
          "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent",
          "disabled:cursor-default disabled:opacity-70",
          researched
            ? "bg-accent-light text-accent shadow-xs"
            : "border border-border bg-surface text-text-secondary hover:border-border-muted hover:text-text-primary",
        )}
      >
        <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
        Researched
      </button>
    </div>
  );
}
