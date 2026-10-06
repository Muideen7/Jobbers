"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Search, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { PostHogLogoutLink } from "@/components/analytics/PostHogLogoutLink";
import { Logo } from "@/components/layout/Logo";
import { formatDate, getInitials } from "@/lib/utils";

/**
 * Full workspace navigation used by /dashboard and the workspace pages
 * (inventory, ai-resume, company-research, applications, profile).
 *
 * - Center search submits to /dashboard?q=… — on the dashboard the feed
 *   filters instantly; from other pages it jumps to the filtered feed.
 * - The bell loads recent activity from /api/notifications (shared by every
 *   page, so unread counts are identical everywhere).
 * - The green InsForge chip is the signed-in auth indicator.
 */

type NotificationItem = {
  id: string;
  text: string;
  href: string;
  createdAt: string;
};

type Props = {
  user: { name: string | null; email: string | null };
  initialQuery?: string;
};

const NAV_ITEMS = [
  { href: "/find-jobs", label: "Find Jobs" },
  { href: "/inventory", label: "Inventory" },
  { href: "/ai-resume", label: "AI Resume" },
  { href: "/company-research", label: "Company Research" },
  { href: "/applications", label: "Applications" },
  { href: "/profile", label: "Profile" },
];

const inputClasses =
  "w-full rounded-full border border-ink bg-surface py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface";

export function DashboardNav({ user, initialQuery = "" }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [previousInitialQuery, setPreviousInitialQuery] = useState(initialQuery);
  const [openMenu, setOpenMenu] = useState<"notifications" | "account" | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Adjust state during render (sanctioned React pattern) so the search input
  // follows deep-links (?q=…) without a setState-in-effect.
  if (previousInitialQuery !== initialQuery) {
    setPreviousInitialQuery(initialQuery);
    setQuery(initialQuery);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) {
          const items = json.items as NotificationItem[];
          setNotifications(items);
          setUnreadCount(
            items.filter(
              (n) => new Date(n.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000,
            ).length,
          );
        }
      })
      .catch(() => {
        // bell stays empty on network errors
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (openMenu === null && !drawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu, drawerOpen]);

  const isItemActive = (href: string) =>
    href === "/find-jobs" ? pathname.startsWith("/find-jobs") : pathname === href;

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/dashboard?q=${encodeURIComponent(q)}` : "/dashboard");
  }

  const initials = getInitials(user.name ?? user.email);
  const displayName = user.name ?? user.email ?? "Jobber";

  const searchField = (
    <form role="search" onSubmit={handleSearchSubmit} className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search title, skill, or company…"
        aria-label="Search jobs"
        className={inputClasses}
      />
    </form>
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/dashboard" aria-label="Jobbers dashboard">
              <Logo />
            </Link>
            <nav className="hidden items-center gap-6 xl:flex" aria-label="Primary">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-200",
                    isItemActive(item.href)
                      ? "text-accent"
                      : "text-text-dark hover:text-text-primary",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mx-auto hidden w-full max-w-xl md:block">{searchField}</div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <span className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary lg:inline-flex">
              <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
              InsForge
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenMenu(openMenu === "notifications" ? null : "notifications")
                }
                aria-label="Notifications"
                aria-expanded={openMenu === "notifications"}
                className="rounded-full p-2 text-text-dark transition-colors hover:bg-surface-secondary hover:text-text-primary"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                    {unreadCount}
                  </span>
                )}
              </button>

              {openMenu === "notifications" && (
                <>
                  <button
                    type="button"
                    aria-label="Close notifications"
                    tabIndex={-1}
                    onClick={() => setOpenMenu(null)}
                    className="fixed inset-0 z-40 cursor-default bg-transparent"
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-border bg-surface p-4 shadow-xl">
                    <p className="text-sm font-semibold text-text-primary">Notifications</p>
                    <div className="mt-3 flex flex-col gap-1">
                      {notifications.length === 0 ? (
                        <p className="py-2 text-sm text-text-muted">No notifications yet.</p>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n.id}
                            href={n.href}
                            onClick={() => setOpenMenu(null)}
                            className="rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-secondary"
                          >
                            <span className="block text-sm font-medium leading-5 text-text-primary">
                              {n.text}
                            </span>
                            <span className="mt-0.5 block text-xs text-text-muted">
                              {formatDate(n.createdAt)}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === "account" ? null : "account")}
                aria-label={`Account menu for ${displayName}`}
                aria-expanded={openMenu === "account"}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-accent-foreground transition-transform hover:scale-105"
              >
                {initials}
              </button>

              {openMenu === "account" && (
                <>
                  <button
                    type="button"
                    aria-label="Close account menu"
                    tabIndex={-1}
                    onClick={() => setOpenMenu(null)}
                    className="fixed inset-0 z-40 cursor-default bg-transparent"
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-border bg-surface p-2 shadow-xl">
                    <div className="border-b border-border px-3 py-3">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {displayName}
                      </p>
                      {user.email && (
                        <p className="truncate text-xs text-text-muted">{user.email}</p>
                      )}
                    </div>
                    <div className="mt-1 flex flex-col">
                      <Link
                        href="/profile"
                        onClick={() => setOpenMenu(null)}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-text-dark transition-colors hover:bg-surface-secondary hover:text-text-primary"
                      >
                        Profile
                      </Link>
                      <PostHogLogoutLink
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </PostHogLogoutLink>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="-mr-1 rounded-lg p-2 text-text-dark transition-colors duration-200 hover:bg-surface-secondary hover:text-text-primary lg:hidden xl:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer — rendered outside <header> so the header's backdrop-blur
          does not become the containing block for its fixed children. */}
      <div
        className={[
          "fixed inset-0 z-[60] lg:hidden xl:hidden",
          drawerOpen ? "" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          tabIndex={drawerOpen ? 0 : -1}
          onClick={() => setDrawerOpen(false)}
          className={[
            "absolute inset-0 w-full bg-ink/40 transition-opacity duration-300",
            drawerOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          aria-label="Close navigation menu"
        />
        <nav
          className={[
            "absolute left-0 top-0 flex h-full w-[min(20rem,85vw)] flex-col gap-6 bg-surface p-6 shadow-xl",
            "transition-all duration-300 ease-out",
            drawerOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0",
          ].join(" ")}
          aria-label="Mobile"
        >
          <div className="flex items-center justify-between">
            <Link href="/dashboard" onClick={() => setDrawerOpen(false)} aria-label="Jobbers dashboard">
              <Logo />
            </Link>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              tabIndex={drawerOpen ? 0 : -1}
              className="-mr-1 rounded-lg p-2 text-text-dark transition-colors hover:bg-surface-secondary"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setDrawerOpen(false);
              const q = query.trim();
              router.push(q ? `/dashboard?q=${encodeURIComponent(q)}` : "/dashboard");
            }}
            className="relative"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, skill, or company…"
              aria-label="Search jobs"
              className={inputClasses}
            />
          </form>

          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                tabIndex={drawerOpen ? 0 : -1}
                onClick={() => setDrawerOpen(false)}
                className={[
                  "rounded-lg px-3 py-2.5 text-base font-medium transition-colors",
                  isItemActive(item.href)
                    ? "bg-accent-light text-accent"
                    : "text-text-dark hover:bg-surface-secondary hover:text-text-primary",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <PostHogLogoutLink className="mt-auto inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary">
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </PostHogLogoutLink>
        </nav>
      </div>
    </>
  );
}