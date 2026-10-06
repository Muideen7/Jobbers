"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  isSearching: boolean;
  message: string | null;
  onSearch: (query: string) => void;
};

/**
 * Gradient hero for the dashboard feed. The search here is a live multi-source
 * discovery run (POST /api/agent/find) — distinct from the instant client-side
 * filter that the navbar search applies.
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
    <section className="overflow-hidden rounded-2xl border border-ink bg-gradient-to-br from-lavender via-lavender-soft to-peach p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
        Find your match
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary sm:text-base">
        Search every live job source, then let Gemini score each role against
        your saved profile.
      </p>
      <form
        role="search"
        onSubmit={handleSubmit}
        className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Job title, skill, or company…"
          aria-label="Search job sources"
          className="flex-1 rounded-full border border-ink bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
        />
        <Button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="rounded-full px-6"
        >
          {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSearching ? "Searching…" : "Search live"}
        </Button>
      </form>
      {message && (
        <p className="mt-4 max-w-xl text-sm leading-6 text-text-darkest">
          {message}
        </p>
      )}
    </section>
  );
}