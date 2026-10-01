"use client";

import { useEffect } from "react";

import { initPostHog } from "@/lib/posthog-client";

/**
 * Starts PostHog once on the client. Rendered from the root layout so that
 * identify/reset calls made during auth flows always hit an initialized instance.
 */
export function PostHogProvider() {
  useEffect(() => {
    initPostHog();
  }, []);

  return null;
}
