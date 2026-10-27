import type { ReactNode } from "react";
import Link from "next/link";

import { JobbersIcon } from "@/components/homepage/Logos";

const productLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#ai-matcher", label: "AI matcher" },
  { href: "#live-opportunities", label: "Live opportunities" },
  { href: "#wall-of-love", label: "Success stories" },
  { href: "#faq", label: "FAQ" },
] as const;

const jobSeekerLinks = [
  { href: "/profile", label: "Build your profile" },
  { href: "/profile", label: "Resume & cover letters" },
  { href: "/jobs", label: "Browse matched jobs" },
  { href: "/jobs", label: "Company research" },
  { href: "/login?mode=signup", label: "Get started" },
] as const;

const accountLinks = [
  { href: "/home", label: "Dashboard" },
  { href: "/profile", label: "Profile settings" },
  { href: "/jobs", label: "Saved matches" },
  { href: "/login?mode=signin", label: "Sign in" },
] as const;

const socialLinks = [
  { href: "https://www.linkedin.com/in/muideen7", label: "LinkedIn" },
  { href: "https://github.com/muideen7", label: "GitHub" },
  { href: "https://x.com/OlayeyeMuideen", label: "X" },
] as const;

type SocialLabel = (typeof socialLinks)[number]["label"];

const socialIcons: Record<SocialLabel, ReactNode> = {
  LinkedIn: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  ),
  GitHub: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.5 11.5 0 0 1 3-.405c1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12Z" />
    </svg>
  ),
  X: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.933Zm-1.29 19.49h2.04L6.487 3.24H4.298l13.313 17.404Z" />
    </svg>
  ),
};

export function LandingFooter() {
  return (
    <footer className="w-full bg-ink text-inverse-foreground pt-24 sm:pt-36 md:pt-48 relative overflow-hidden flex flex-col justify-between">
      {/* Subtle center spotlight glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-surface/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Top CTA Hero Section */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pb-24 sm:pb-32 md:pb-40">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-bold tracking-tight text-inverse-foreground leading-[1.12]">
            Your next opportunity
            <br />
            is already here.
          </h2>

          <p className="text-inverse-muted text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Build your profile, upload your resume, and start seeing scored matches in minutes.
            Nothing is ever applied to on your behalf without you.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center justify-center px-7 py-3 text-sm font-medium rounded-full bg-surface/10 border border-inverse-muted/20 text-inverse-foreground shadow-sm transition duration-200 hover:bg-surface/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Start for Free
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center px-7 py-3 text-sm font-medium rounded-full bg-surface text-text-primary shadow-sm transition duration-200 hover:bg-surface-secondary hover:scale-[1.02] active:scale-[0.98]"
            >
              See live matches
            </Link>
          </div>
        </div>
      </div>

      {/* Inner white card with 10px (mobile) to 14px (desktop) margin on left, right, and bottom to the outer black container */}
      <div className="w-full px-2.5 pb-2.5 sm:px-3.5 sm:pb-3.5 flex-1 flex flex-col">
        <div className="w-full bg-surface text-text-primary rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] shadow-2xl flex flex-col justify-between overflow-hidden min-h-[500px] sm:min-h-[560px] md:min-h-[620px]">
          {/* Main Content Area (Brand & Links) - Spaced across the white inner container as before with proper top padding */}
          <div className="w-full px-6 sm:px-10 lg:px-14 pt-20 sm:pt-24 md:pt-28 pb-16 sm:pb-24 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Column 1 (Span 4 / Brand) */}
              <div className="md:col-span-4 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-text-primary flex">
                    <JobbersIcon className="w-6 h-6" />
                  </span>
                  <span className="text-xl font-bold tracking-tight text-text-primary">
                    Jobbers
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-sm">
                  The AI that reads every listing so you only read the ones that matter. Stop applying
                  into the void.
                </p>

                <div className="flex items-center gap-2.5 pt-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-ink text-accent-foreground shadow-xs transition duration-200 hover:bg-ink-hover hover:scale-105 active:scale-95"
                      aria-label={social.label}
                    >
                      {socialIcons[social.label]}
                    </a>
                  ))}
                </div>
              </div>

              {/* Link columns wrapper — Y-shape on mobile, flat row on md+ */}
              <div className="grid grid-cols-2 md:contents gap-8">
                {/* Column 2 (Span 2 / Product) */}
                <div className="md:col-span-2 space-y-3.5">
                  <h3 className="text-sm font-semibold text-text-primary tracking-normal">
                    Product
                  </h3>
                  <ul className="space-y-2.5 text-sm text-text-secondary">
                    {productLinks.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="inline-block cursor-pointer hover:text-text-primary transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 3 (Span 3 / For job seekers) */}
                <div className="md:col-span-3 space-y-3.5">
                  <h3 className="text-sm font-semibold text-text-primary tracking-normal">
                    For job seekers
                  </h3>
                  <ul className="space-y-2.5 text-sm text-text-secondary">
                    {jobSeekerLinks.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="inline-block cursor-pointer hover:text-text-primary transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 4 (Span 3 / Your account) — centered below on mobile */}
                <div className="col-span-2 md:col-span-3">
                  <div className="space-y-3.5">
                    <h3 className="text-sm font-semibold text-text-primary tracking-normal">
                      Your account
                    </h3>
                    <ul className="space-y-2.5 text-sm text-text-secondary">
                      {accountLinks.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            className="inline-block cursor-pointer hover:text-text-primary transition-colors"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Divider & Copyright - Anchored at the bottom of the white inner container */}
          <div className="w-full border-t border-border mt-auto">
            <div className="w-full px-6 sm:px-10 lg:px-14 py-5 sm:py-6 text-center text-xs text-text-muted">
              &copy; 2026 by Jobbers. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
