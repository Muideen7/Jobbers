"use client";

import { useState } from "react";
import { getInitials } from "@/lib/utils";

export type UserAvatarProps = {
  user: {
    name?: string | null | undefined;
    email?: string | null | undefined;
    image?: string | null | undefined;
  };
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const SIZE_STYLES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function UserAvatar({
  user,
  size = "sm",
  className = "",
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const initials = getInitials(user.name ?? user.email);
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.sm;

  if (user.image && !hasError) {
    return (
      <img
        src={user.image}
        alt={user.name || user.email || "User profile photo"}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`shrink-0 rounded-full object-cover ring-1 ring-border/80 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={user.name || user.email || "User initials avatar"}
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent-muted font-bold text-accent select-none ${sizeClass} ${className}`}
    >
      {initials}
    </div>
  );
}
