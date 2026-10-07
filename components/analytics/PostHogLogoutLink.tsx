"use client";

import type { ReactNode } from "react";

import { resetPostHogUser } from "@/lib/posthog-client";

type Props = {
  children: ReactNode;
  className: string;
  /** Optional extra handler, run alongside the PostHog reset. */
  onClick?: () => void;
};

export function PostHogLogoutLink({ children, className, onClick }: Props) {
  return (
    // `contents` drops the form's own box so the button becomes the direct flex
    // item of whatever contains it — callers pass classes that mix layout
    // (`mt-auto`, `gap-2`) with visual styling, so they must stay on the button
    // to keep the desktop row and the mobile drawer laid out as before.
    <form action="/api/auth/logout" method="POST" className="contents">
      <button
        type="submit"
        aria-label="Sign out"
        className={className}
        onClick={() => {
          resetPostHogUser();
          onClick?.();
        }}
      >
        {children}
      </button>
    </form>
  );
}