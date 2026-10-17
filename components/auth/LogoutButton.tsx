"use client";

import { useState, type ReactNode } from "react";
import { authClient } from "@/lib/authClient";

type Props = {
  children: ReactNode;
  className: string;
  onClick?: () => void;
};

export function LogoutButton({ children, className, onClick }: Props) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      onClick?.();
    } catch {
      // ignore transient click error
    }

    try {
      await authClient.signOut();
    } catch (err) {
      console.error("[logout] Better Auth signOut error", err);
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
