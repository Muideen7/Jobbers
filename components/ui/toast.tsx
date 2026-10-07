"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  /** `null` hides the toast. Passing a new message restarts the timer. */
  message: string | null;
  onDismiss: () => void;
  /** Pass 0 to keep the toast up until it is dismissed by hand. */
  durationMs?: number;
  tone?: "error" | "success";
};

/**
 * Transient feedback pinned above the bottom edge. Announced through
 * `role="alert"` so a failed optimistic update is not only a visual rollback.
 *
 * `onDismiss` must be stable (useCallback) — the timer is re-armed on every
 * render otherwise.
 */
export function Toast({
  message,
  onDismiss,
  durationMs = 6000,
  tone = "error",
}: Props) {
  useEffect(() => {
    if (!message || durationMs <= 0) return;
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss, durationMs]);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-4 sm:justify-end sm:px-6 sm:pb-6">
      <div
        role={tone === "error" ? "alert" : "status"}
        className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-ink bg-surface px-4 py-3 shadow-card"
      >
        <AlertTriangle
          aria-hidden="true"
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            tone === "error" ? "text-error" : "text-success-dark",
          )}
        />
        <p className="flex-1 text-sm leading-5 text-text-primary">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="-mr-1.5 rounded-full p-1 text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
