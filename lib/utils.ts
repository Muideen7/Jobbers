import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const MATCH_THRESHOLD = 70;

/** Tailwind class merger used by the shadcn/ui primitives in components/ui. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** The surname (last word) of a display name; null when there is no name. */
export function getSurname(nameOrEmail: string | null | undefined): string | null {
  const value = (nameOrEmail ?? "").trim();
  if (!value) return null;
  const words = value.split(/\s+/).filter(Boolean);
  const last = words[words.length - 1];
  return last && last.length > 0 ? last : null;
}

/** Two-letter avatar initials from a display name or email address. */
export function getInitials(nameOrEmail: string | null | undefined): string {
  const value = (nameOrEmail ?? "").trim();
  if (!value) return "?";

  const localName = value.split("@")[0] ?? "";
  const words = localName.split(/[\s._-]+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return (words[0] ?? "").slice(0, 2).toUpperCase();

  return `${(words[0] ?? "")[0]}${(words[1] ?? "")[0]}`.toUpperCase();
}

export function getMatchScoreColor(score: number): string {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-info";
  return "bg-warning";
}

export function getMatchScoreTextColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-info-medium";
  return "text-warning";
}

/**
 * shadcn Badge variant for a match score, so the same green/info/orange
 * semantics hold across the dashboard cards, detail panel and inventory.
 */
export function getMatchBadgeVariant(
  score: number | null,
): "success" | "info" | "warning" | "secondary" {
  if (score === null) return "secondary";
  if (score >= MATCH_THRESHOLD) return "success";
  if (score >= 60) return "info";
  return "warning";
}

export function formatSalary(salary: string | null): string {
  return salary ?? "—";
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
