"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SidebarSummary } from "@/lib/workspace/types";

const SIDEBAR_URL = "/api/sidebar-summary";
const REFRESH_MS = 60_000;

type ApiResponse = { success: boolean; summary?: SidebarSummary };

/**
 * Loads `/api/sidebar-summary` for the global sidebar. Revalidates on window
 * focus and every 60 seconds so badges and "Coming up" stay current without a
 * full page reload. Never throws — a failed fetch leaves `summary` as-is
 * (null on first load, so the sidebar shows its skeletons).
 */
export function useSidebarSummary() {
  const [summary, setSummary] = useState<SidebarSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const apply = useCallback((json: ApiResponse) => {
    if (json.success && json.summary) {
      setSummary(json.summary);
      setError(null);
    } else {
      setError("Could not load sidebar data");
    }
  }, []);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch(SIDEBAR_URL, { cache: "no-store" });
      apply((await res.json()) as ApiResponse);
    } catch {
      setError("Could not load sidebar data");
    } finally {
      inFlight.current = false;
    }
  }, [apply]);

  useEffect(() => {
    let cancelled = false;

    // Initial load runs as a promise chain so the effect body never calls
    // setState synchronously (which the React compiler lint rule forbids).
    fetch(SIDEBAR_URL, { cache: "no-store" })
      .then((res) => res.json() as Promise<ApiResponse>)
      .then((json) => {
        if (!cancelled) apply(json);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load sidebar data");
      });

    const onFocus = () => void refresh();
    const interval = window.setInterval(() => void refresh(), REFRESH_MS);
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [apply, refresh]);

  return { summary, error, isLoading: summary === null, refresh };
}