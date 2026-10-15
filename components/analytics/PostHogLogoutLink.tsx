"use client";

import { useState, type ReactNode } from "react";

import { resetPostHogUser } from "@/lib/posthog-client";

type Props = {
  children: ReactNode;
  className: string;
  /** Optional extra handler, run alongside the PostHog reset. */
  onClick?: () => void;
};

export function PostHogLogoutLink({ children, className, onClick }: Props) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      resetPostHogUser();
    } catch {
      // ignore PostHog analytics reset errors
    }

    try {
      onClick?.();
    } catch {
      // ignore transient chrome closing errors
    }

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      });
    } catch (err) {
      console.error("[logout] fetch error", err);
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <button
      type="button"
      aria-label="Sign out"
      className={className}
      onClick={handleLogout}
      disabled={isSigningOut}
    >
      {children}
    </button>
  );
}