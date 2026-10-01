"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LogOut, Menu, UserCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Logo } from "@/components/layout/Logo";
import { PostHogLogoutLink } from "@/components/analytics/PostHogLogoutLink";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/find-jobs", label: "Find Jobs" },
  { href: "/profile", label: "Profile" },
];

type Props = {
  isAuthenticated?: boolean;
};

export function Navbar({ isAuthenticated = false }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const isItemActive = (href: string) =>
    href === "/find-jobs"
      ? pathname.startsWith("/find-jobs")
      : pathname === href;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />

          <nav className="hidden items-center gap-7 md:flex lg:gap-9" aria-label="Primary">
            {isAuthenticated &&
              navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-md text-sm font-medium transition-colors duration-200",
                    isItemActive(item.href)
                      ? "text-accent"
                      : "text-text-dark hover:text-text-primary",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              ))}
          </nav>

          {isAuthenticated ? (
            <div className="hidden items-center gap-6 md:flex">
              <UserCircle className="h-6 w-6 text-info-muted" />
              <PostHogLogoutLink className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </PostHogLogoutLink>
            </div>
          ) : (
            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to home</span>
              </Link>
              <Link href="/login" className="btn btn-primary btn-sm">
                Get started
              </Link>
            </div>
          )}

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen((previous) => !previous)}
              className="-mr-1 rounded-lg p-2 text-text-dark transition-colors duration-200 hover:bg-surface-secondary hover:text-text-primary"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="app-mobile-menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Rendered outside <header> because the header's backdrop-blur would
          otherwise become the containing block for fixed children. */}
      <div
        className={[
          "fixed inset-0 z-[60] md:hidden",
          menuOpen ? "" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          onClick={() => setMenuOpen(false)}
          className={[
            "absolute inset-0 w-full bg-ink/40 transition-opacity duration-300",
            menuOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          aria-label="Close navigation menu"
        />

        <nav
          id="app-mobile-menu"
          className={[
            "absolute left-0 top-0 flex h-full w-[min(20rem,85vw)] flex-col gap-6 bg-surface p-6 shadow-xl",
            "transition-all duration-300 ease-out",
            menuOpen
              ? "translate-x-0 opacity-100"
              : "-translate-x-full opacity-0",
          ].join(" ")}
          aria-label="Mobile"
        >
          <div className="flex items-center justify-between">
            <Logo />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
              className="-mr-1 rounded-lg p-2 text-text-dark transition-colors hover:bg-surface-secondary"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {isAuthenticated ? (
              navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  tabIndex={menuOpen ? 0 : -1}
                  onClick={() => setMenuOpen(false)}
                  className={[
                    "rounded-lg px-3 py-2.5 text-base font-medium transition-colors",
                    isItemActive(item.href)
                      ? "bg-accent-light text-accent"
                      : "text-text-dark hover:bg-surface-secondary hover:text-text-primary",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              ))
            ) : (
              <Link
                href="/"
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-text-dark transition-colors hover:bg-surface-secondary hover:text-text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Home</span>
              </Link>
            )}
          </div>

          {isAuthenticated ? (
            <PostHogLogoutLink className="mt-auto inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </PostHogLogoutLink>
          ) : (
            <Link
              href="/login"
              tabIndex={menuOpen ? 0 : -1}
              onClick={() => setMenuOpen(false)}
              className="btn btn-primary mt-auto"
            >
              Get started
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}