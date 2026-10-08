"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BarChart2,
  Bell,
  Building2,
  Columns3,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings2,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";

import { PostHogLogoutLink } from "@/components/analytics/PostHogLogoutLink";
import { PricingModal } from "@/components/layout/PricingModal";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggler } from "@/components/layout/ThemeToggler";
import { useSidebarSummary } from "@/components/layout/useSidebarSummary";
import { Button } from "@/components/ui/button";
import { formatDate, getInitials } from "@/lib/utils";
import type { ApplicationStage } from "@/lib/workspace/constants";
import type { SidebarSummary } from "@/lib/workspace/types";

type NotificationItem = {
  id: string;
  text: string;
  href: string;
  createdAt: string;
};

type Props = {
  user: { name: string | null; email: string | null };
  children: React.ReactNode;
};

const NAV_GROUPS: {
  label: string;
  items: { href: string; label: string; icon: LucideIcon }[];
}[] = [
  {
    label: "Workspace",
    items: [
      { href: "/home", label: "Home", icon: LayoutDashboard },
      { href: "/jobs", label: "Jobs", icon: Search },
      { href: "/applications", label: "Applications", icon: Columns3 },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/resumes", label: "Resumes", icon: FileText },
      { href: "/analytics", label: "Analytics", icon: BarChart2 },
      { href: "/company-research", label: "Research", icon: Building2 },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/profile", label: "Profile", icon: User },
    ],
  },
];

const STAGE_ITEMS: { stage: ApplicationStage; label: string }[] = [
  { stage: "saved", label: "Saved" },
  { stage: "applied", label: "Applied" },
  { stage: "interview", label: "Interview" },
  { stage: "offer", label: "Offer" },
];

function formatBadge(count: number): string | null {
  if (count <= 0) return null;
  return count > 99 ? "99+" : String(count);
}

/**
 * Sidebar-collapsed preference as an external store, so the persisted value can
 * be read without a mount-effect `setState` (which React flags as a cascading
 * render). Writes broadcast on a same-tab custom event plus cross-tab `storage`.
 */
const COLLAPSE_KEY = "jobbers.sidebarCollapsed";
const COLLAPSE_EVENT = "jobbers:sidebar-collapsed";

function subscribeCollapsed(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(COLLAPSE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COLLAPSE_EVENT, onChange);
  };
}

function getCollapsedSnapshot() {
  return window.localStorage.getItem(COLLAPSE_KEY) === "1";
}

function getCollapsedServerSnapshot() {
  return false;
}

function setCollapsedPreference(next: boolean) {
  window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
}

function badgeFor(href: string, summary: SidebarSummary | null): number {
  if (!summary) return 0;
  if (href === "/home") return summary.dueCount;
  if (href === "/jobs") return summary.newMatches;
  if (href === "/applications") return summary.activeApplications;
  return 0;
}

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Small count pill for a nav row. Hidden at 0, "99+" above 99, dot when collapsed. */
function NavBadge({
  count,
  collapsed,
  loading,
}: {
  count: number;
  collapsed: boolean;
  loading: boolean;
}) {
  if (loading) {
    // `bg-muted` and `bg-surface-secondary` are both #f4f4f5 — invisible on the
    // white sidebar. `border-muted` (#d4d4d8) is the token that actually reads.
    return collapsed ? (
      <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-border-muted" aria-hidden />
    ) : (
      <span className="ml-auto h-4 w-8 animate-pulse rounded-full bg-border-muted" aria-hidden />
    );
  }

  const text = formatBadge(count);
  if (!text) return null;

  if (collapsed) {
    return <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />;
  }

  return (
    <span className="ml-auto rounded-full bg-accent px-1.5 text-[10px] font-bold leading-4 text-accent-foreground">
      {text}
    </span>
  );
}

export function AppShell({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { summary, isLoading } = useSidebarSummary();

  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"notifications" | "account" | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const activeStage = searchParams.get("stage");

  const closeTransientChrome = () => {
    setDrawerOpen(false);
    setOpenMenu(null);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        setOpenMenu(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications", { cache: "no-store" })
      .then((response) => response.json())
      .then((json: { success: boolean; items?: NotificationItem[] }) => {
        if (!cancelled && json.success && json.items) {
          setNotifications(json.items);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const userInitials = getInitials(user.name ?? user.email);

  const renderNav = (opts: { collapsed: boolean; onNavigate?: () => void }) => (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <nav key={group.label} aria-label={group.label}>
          {!opts.collapsed && (
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
              {group.label}
            </p>
          )}
          <ul className="flex flex-col gap-1">
            {group.items.map((item) => {
              const active = isItemActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    {...(opts.onNavigate ? { onClick: opts.onNavigate } : {})}
                    aria-current={active ? "page" : undefined}
                    title={opts.collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-accent-light text-accent"
                        : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    {!opts.collapsed && <span className="truncate">{item.label}</span>}
                    <NavBadge
                      count={badgeFor(item.href, summary)}
                      collapsed={opts.collapsed}
                      loading={isLoading}
                    />
                  </Link>

                  {/* Applications sub-nav: only while browsing that page. */}
                  {item.href === "/applications" && pathname === "/applications" && !opts.collapsed && (
                    <ul className="mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
                      {STAGE_ITEMS.map((stage) => {
                        const stageActive = activeStage === stage.stage;
                        const count = summary?.applicationsByStage[stage.stage] ?? 0;
                        return (
                          <li key={stage.stage}>
                            <Link
                              href={`/applications?stage=${stage.stage}`}
                              {...(opts.onNavigate ? { onClick: opts.onNavigate } : {})}
                              aria-current={stageActive ? "page" : undefined}
                              className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors ${
                                stageActive
                                  ? "text-accent"
                                  : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                              }`}
                            >
                              <span>{stage.label}</span>
                              {count > 0 && (
                                <span className="text-xs font-semibold text-text-muted">
                                  {count}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-surface lg:flex lg:flex-col ${
          collapsed ? "lg:w-[72px]" : "lg:w-[240px]"
        }`}
      >
        <div
          className={`flex h-16 items-center border-b border-border ${
            collapsed ? "justify-center" : "justify-between px-4"
          }`}
        >
          {!collapsed && <Logo href="/home" />}
          <button
            type="button"
            onClick={() => setCollapsedPreference(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        {renderNav({ collapsed, onNavigate: closeTransientChrome })}

        {/* Pro upgrade card — centered between Settings and Take the tour with balanced spacing */}
        {!collapsed && (
          <div className="mx-3 my-6 rounded-2xl border border-border bg-gradient-to-br from-accent-muted to-surface-secondary p-4 shadow-sm">
            <div className="flex items-center gap-2 text-accent">
              <ArrowRight className="h-4 w-4" aria-hidden />
              <p className="text-sm font-semibold text-text-primary">Unlock Jobbers Pro</p>
            </div>
            <p className="mt-1 text-xs leading-5 text-text-secondary">
              Unlimited matches, research and tailored resumes.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => setPricingOpen(true)}
              className="mt-3 w-full font-medium"
            >
              Upgrade
            </Button>
          </div>
        )}

        {/* Settings button — in place of Take the tour */}
        <div className="px-3 pb-4">
          <Link
            href="/settings"
            onClick={closeTransientChrome}
            title={collapsed ? "Settings" : undefined}
            aria-current={pathname === "/settings" ? "page" : undefined}
            className={`flex w-full items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold transition-all ${
              pathname === "/settings"
                ? "bg-accent-light text-accent border-accent/40"
                : "bg-surface-secondary text-text-primary hover:border-accent/50 hover:bg-surface hover:shadow-sm"
            } ${collapsed ? "justify-center px-2" : ""}`}
          >
            <Settings2 className="h-4 w-4 text-accent shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className={`flex min-h-screen flex-col ${collapsed ? "lg:pl-[72px]" : "lg:pl-[240px]"}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-secondary lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <span className="lg:hidden">
            <Logo href="/home" />
          </span>

          <form
            role="search"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const value = new FormData(event.currentTarget).get("q");
              const query = typeof value === "string" ? value.trim() : "";
              router.push(query ? `/jobs?q=${encodeURIComponent(query)}` : "/jobs");
            }}
            className="relative hidden max-w-md flex-1 lg:block"
          >
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <input
              type="search"
              name="q"
              placeholder="Search jobs, companies, roles…"
              className="w-full rounded-lg border border-border bg-surface-secondary py-2 pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </form>

          <div className="ml-auto">
            <ThemeToggler />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu((value) => (value === "notifications" ? null : "notifications"))}
              aria-label="Notifications"
              aria-haspopup="menu"
              aria-expanded={openMenu === "notifications"}
              className="relative rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" aria-hidden />
              )}
            </button>
            {openMenu === "notifications" && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} aria-hidden />
                <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-border bg-surface p-2 shadow-card">
                  {notifications.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-text-muted">
                      No activity yet.
                    </p>
                  ) : (
                    <ul className="flex flex-col">
                      {notifications.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            onClick={closeTransientChrome}
                            className="block rounded-lg px-3 py-2 transition-colors hover:bg-surface-secondary"
                          >
                            <span className="block text-sm text-text-primary">{item.text}</span>
                            <span className="text-xs text-text-muted">
                              {formatDate(item.createdAt)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpenMenu((value) => (value === "account" ? null : "account"))}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={openMenu === "account"}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-xs font-bold text-accent cursor-pointer"
          >
            {userInitials}
          </button>
          {openMenu === "account" && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} aria-hidden />
              <div className="absolute right-4 top-14 z-30 w-56 rounded-xl border border-border bg-surface p-1 shadow-card">
                <Link
                  href="/profile?tab=account"
                  onClick={closeTransientChrome}
                  className="block rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
                >
                  Account
                </Link>
                <Link
                  href="/profile?tab=preferences"
                  onClick={closeTransientChrome}
                  className="block rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
                >
                  Preferences
                </Link>
                <div className="my-1 border-t border-border" />
                <PostHogLogoutLink
                  onClick={closeTransientChrome}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-secondary hover:text-error cursor-pointer"
                >
                  <LogOut className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
                  <span>Sign out</span>
                </PostHogLogoutLink>
              </div>
            </>
          )}
        </header>

        <main className="flex-1">{children}</main>
      </div>

      {/* Mobile drawer (< lg) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-surface shadow-card">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Logo href="/home" onClick={() => setDrawerOpen(false)} />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNav({ collapsed: false, onNavigate: closeTransientChrome })}
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} />
    </div>
  );
}