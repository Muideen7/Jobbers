"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { JobbersIcon } from "@/components/homepage/Logos";

const navLinks: ReadonlyArray<{ href: string; label: string }> = [
  { href: "#live-opportunities", label: "Find work" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#ai-matcher", label: "AI matcher" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the panel if the viewport grows to the desktop layout.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");

    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMenuOpen(false);
      }
    };

    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  // Lock page scroll while the panel is open.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-md border-b border-border-light">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 sm:h-20 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 cursor-pointer"
            onClick={() => setMenuOpen(false)}
            aria-label="Jobbers — go to top of page"
          >
            <span className="text-text-primary flex">
              <JobbersIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </span>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-text-primary">
              Jobbers
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 lg:gap-9" aria-label="Primary">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="cursor-pointer rounded-md text-sm font-medium text-text-strong transition-colors duration-200 hover:text-text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="cursor-pointer rounded-md px-4 py-2.5 text-sm font-medium text-text-strong transition-colors duration-200 hover:text-text-primary"
            >
              Sign in
            </Link>
            <Link href="/login" className="btn btn-primary btn-sm cursor-pointer">
              Get started
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <Link href="/login" className="btn btn-primary btn-sm cursor-pointer">
              Get started
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((previous) => !previous)}
              className="-mr-1 cursor-pointer rounded-lg p-2 text-text-dark transition-colors duration-200 hover:bg-surface-secondary hover:text-text-primary"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
      </header>

      {/* Full-screen left drawer. Rendered outside <header> because the header's
          backdrop-blur would otherwise become the containing block for fixed children. */}
      <div
        className={[
          "md:hidden fixed inset-0 z-[60]",
          menuOpen ? "" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!menuOpen}
      >
        {/* Scrim fades in behind the panel. */}
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation menu"
          className={[
            "absolute inset-0 w-full h-full cursor-default bg-ink/40 backdrop-blur-[2px]",
            "transition-opacity duration-300 ease-out motion-reduce:transition-none",
            menuOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        {/* Panel slides in from the left edge. */}
        <nav
          id="landing-mobile-menu"
          aria-label="Mobile"
          className={[
            "absolute inset-y-0 left-0 flex w-full max-w-sm flex-col bg-surface shadow-2xl",
            "transition-transform duration-300 ease-out motion-reduce:transition-none",
            "motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)]",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-3 h-16 sm:h-20 px-4 sm:px-6 border-b border-border-light shrink-0">
            <span className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-text-primary">
              <span className="text-text-primary flex">
                <JobbersIcon className="w-6 h-6" />
              </span>
              Menu
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
              className="-mr-1 cursor-pointer rounded-lg p-2 text-text-dark transition-colors duration-200 hover:bg-surface-secondary hover:text-text-primary"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-1 overflow-y-auto px-4 sm:px-6 py-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                tabIndex={menuOpen ? 0 : -1}
                className="cursor-pointer rounded-xl px-4 py-3.5 text-center text-base font-semibold text-text-darkest transition-colors duration-200 hover:bg-surface-secondary hover:text-text-primary"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="shrink-0 border-t border-border-light p-4 sm:p-6 space-y-2.5">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
              className="btn btn-primary w-full cursor-pointer"
            >
              Get started
            </Link>
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
              className="btn btn-secondary w-full cursor-pointer"
            >
              Sign in
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
