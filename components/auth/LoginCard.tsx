"use client";

import Image from "next/image";
import { CheckCircle2, Sparkles, Star } from "lucide-react";

import { CompanyLogo, JobbersIcon } from "@/components/homepage/Logos";

const errorMessages: Record<string, string> = {
  callback: "We could not finish signing you in. Please try again.",
  oauth: "We could not start that sign-in method. Please try again.",
  provider: "That sign-in method is not available.",
};

type Props = {
  error?: string | undefined;
};

export function LoginCard({ error }: Props) {
  const message = error ? errorMessages[error] : null;

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1440px] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-border bg-surface shadow-2xl lg:grid-cols-[1fr_1.1fr]">
        {/* Left Column: Auth & One-Click OAuth */}
        <div className="flex flex-col justify-between p-8 sm:p-12">
          {/* Centered Brand Emblem */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-sm">
              <JobbersIcon className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
              Start with Jobbers
            </h1>
            <p className="mt-1.5 max-w-sm text-xs text-text-secondary sm:text-sm">
              One click to access your smart job search workspace, matched roles, and tailored resumes.
            </p>
          </div>

          {/* Error Notice */}
          {message && (
            <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-center text-xs font-medium text-destructive">
              {message}
            </div>
          )}

          {/* Social OAuth Buttons */}
          {/* Plain <a> tags rather than <form> or <Link> to maintain CSP compliance without prefetch-burning PKCE */}
          <div className="my-8 flex flex-col gap-3">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/auth/oauth/google"
              className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-text-primary shadow-xs transition-all hover:border-border-muted hover:bg-surface-secondary cursor-pointer"
            >
              <CompanyLogo type="google" className="h-4 w-4 shrink-0" />
              Sign up with Google
            </a>

            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/auth/oauth/github"
              className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-text-primary shadow-xs transition-all hover:border-border-muted hover:bg-surface-secondary cursor-pointer"
            >
              <CompanyLogo type="github" className="h-4 w-4 shrink-0" />
              Sign up with GitHub
            </a>
          </div>

          {/* Value Prop Highlights */}
          <div className="rounded-2xl border border-border/70 bg-surface-secondary/40 p-4 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-text-secondary">
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
              <span>Multi-board job discovery across 10+ sources</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-text-secondary">
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
              <span>AI profile match scoring (0–100%)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-text-secondary">
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
              <span>1-click tailored resume generation & PDF export</span>
            </div>
          </div>

          {/* Terms Footer */}
          <p className="mt-8 text-center text-[11px] text-text-muted">
            By signing up, you agree to our{" "}
            <a href="/terms" className="font-medium text-accent hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="font-medium text-accent hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        {/* Right Column: Showcase & Testimonial */}
        <div className="relative flex flex-col justify-between overflow-hidden border-t border-border/70 bg-surface-secondary/50 p-8 sm:p-12 lg:border-l lg:border-t-0">
          {/* Subtle Ambient Brand Glow */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-3xl"
            style={{ backgroundColor: "var(--color-pastel-blue)" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full opacity-35 blur-3xl"
            style={{ backgroundColor: "var(--color-pastel-pink)" }}
            aria-hidden="true"
          />

          {/* Top Floating App Preview Card */}
          <div className="relative mx-auto w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-card transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-[11px] font-semibold text-text-primary">
                  Jobbers Match Agent
                </span>
              </div>
              <span className="rounded-full bg-accent-muted px-2 py-0.5 text-[10px] font-medium text-accent">
                Active
              </span>
            </div>

            {/* Glowing Center Graphic */}
            <div className="my-5 flex flex-col items-center text-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner transition-transform hover:scale-105"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-pastel-blue) 0%, var(--color-pastel-pink) 50%, var(--color-pastel-mint) 100%)",
                }}
              >
                <Sparkles className="h-7 w-7 text-text-primary" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-text-primary">
                Top 10 High Match Roles
              </h3>
              <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-text-secondary">
                Matched against your target roles and experience. Ready for instant resume tailoring.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="rounded-full bg-surface-secondary px-2.5 py-1 text-[11px] font-medium text-text-secondary">
                Remote only
              </span>
              <span className="rounded-full bg-surface-secondary px-2.5 py-1 text-[11px] font-medium text-text-secondary">
                Full-time
              </span>
              <span className="rounded-full bg-accent text-accent-foreground px-2.5 py-1 text-[11px] font-semibold">
                94% Match
              </span>
            </div>
          </div>

          {/* Bottom Testimonial Section */}
          <div className="relative mt-8 flex flex-col items-center text-center">
            {/* Bold Brand Quote Marks */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-accent font-serif text-2xl font-bold">
              &ldquo;
            </div>

            {/* Testimonial Quote */}
            <blockquote className="mt-4 max-w-md text-sm sm:text-base font-semibold leading-relaxed text-text-primary">
              &ldquo;Jobbers cut my application search time in half. The instant role scoring and tailored resumes got me 4 interview callbacks within my first two weeks.&rdquo;
            </blockquote>

            {/* 5.0 Rating with Laurel Effect */}
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-text-primary">
              <span className="text-text-muted">⟨</span>
              <div className="flex items-center gap-1 text-amber">
                <Star className="h-3.5 w-3.5 fill-current" />
              </div>
              <span>5.0</span>
              <span className="text-text-muted">⟩</span>
            </div>

            {/* Author Profile */}
            <div className="mt-4 flex flex-col items-center">
              <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-surface shadow-xs">
                <Image
                  src="/landing/testimonial_elena.jpg"
                  alt="Elena Rostova"
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>
              <p className="mt-2 text-xs font-bold text-text-primary">Elena Rostova</p>
              <p className="text-[11px] text-text-secondary">Senior Frontend Engineer, Berlin</p>
            </div>

            {/* Carousel Pagination Dots */}
            <div className="mt-5 flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-6 rounded-full bg-accent" />
              <span className="h-1.5 w-1.5 rounded-full bg-border" />
              <span className="h-1.5 w-1.5 rounded-full bg-border" />
              <span className="h-1.5 w-1.5 rounded-full bg-border" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
