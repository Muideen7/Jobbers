"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  isSearching: boolean;
  message: string | null;
  onSearch: (query: string) => void;
};

/**
 * Compact discovery header for the dashboard feed.
 * Allows triggering a live multi-source search (POST /api/agent/find) with AI scoring
 * without consuming excessive vertical space.
 */
export function FeedHero({ isSearching, message, onSearch }: Props) {
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (!q || isSearching) return;
    onSearch(q);
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-lavender/40 via-surface to-peach-soft/30 p-4 sm:p-5 shadow-card">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-5 items-center gap-1 rounded-full bg-accent-muted px-2 text-[11px] font-semibold text-accent">
              <Sparkles className="h-3 w-3" />
              Live Discovery
            </span>
          </div>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-text-primary sm:text-xl">
            Discover & Score Live Roles
          </h1>
          <p className="text-xs text-text-secondary sm:text-sm">
            Fetch real-time openings and let Gemini rank them against your profile.
          </p>
        </div>

        <form
          role="search"
          onSubmit={handleSubmit}
          className="flex w-full max-w-md items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Frontend Engineer, React, Staff…"
              aria-label="Search live job sources"
              className="w-full rounded-full border border-border bg-surface py-2 pl-9 pr-4 text-xs text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={isSearching || !query.trim()}
            className="rounded-full px-4 text-xs shrink-0"
          >
            {isSearching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isSearching ? "Searching…" : "Search live"}
          </Button>
        </form>
      </div>

      {message && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface/90 border border-border/80 px-3 py-1.5 text-xs text-text-primary">
          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
          <span className="truncate">{message}</span>
        </div>
      )}
    </section>
  );
}