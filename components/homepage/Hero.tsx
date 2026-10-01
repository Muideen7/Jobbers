import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { CompanyLogo, JobbersIcon } from "@/components/homepage/Logos";
import { HERO_AVATAR } from "@/components/homepage/data";

export function Hero() {
  return (
    <section id="hero" className="w-full pt-10 pb-16 md:pt-14 md:pb-24 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-bold text-text-primary tracking-tight leading-[1.08]">
            Stop scrolling job boards.
            <br />
            <span className="text-text-primary">Start landing interviews.</span>
          </h1>
          <p className="text-base sm:text-lg text-text-strong max-w-2xl mx-auto leading-relaxed pt-2">
            Jobbers reads your profile, scores every open role against it, and surfaces only the
            jobs that actually fit — with a tailored resume, cover letter and company research ready
            before you apply.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href="/login"
              className="btn btn-primary"
            >
              Get started
            </Link>
            <Link
              href="/find-jobs"
              className="btn btn-secondary"
            >
              See live matches
            </Link>
          </div>
        </div>

        <div className="mt-14 lg:mt-18 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          <div className="col-span-1 md:col-span-4 lg:col-span-4 bg-peach rounded-[32px] sm:rounded-[36px] overflow-hidden relative flex flex-col justify-end min-h-[480px] sm:min-h-[520px] md:min-h-full p-4 sm:p-5 shadow-2xs border border-amber-deep/5 group">
            <div className="absolute inset-0 bg-radial from-transparent via-peach-soft/20 to-peach-deep/40 pointer-events-none" />

            <div className="absolute inset-x-0 bottom-0 top-4 sm:top-6 flex items-end justify-center pointer-events-none">
              <Image
                src={HERO_AVATAR}
                alt="Thomas Adam, senior software engineer"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 33vw"
                className="w-full h-full object-cover object-top contrast-[1.02] group-hover:scale-[1.02] transition-transform duration-500 ease-out"
              />
            </div>

            <div className="relative z-10 bg-surface rounded-2xl p-4 shadow-lg border border-ink/[0.04] inline-flex items-center justify-between gap-3 max-w-[280px]">
              <div className="pr-1">
                <h3 className="font-bold text-text-primary text-sm sm:text-base tracking-tight leading-tight">
                  Thomas Adam
                </h3>
                <p className="text-xs text-text-secondary font-normal mt-0.5">
                  Senior Software Engineer
                </p>
              </div>
              <div className="flex flex-col items-center justify-center pl-3 border-l border-border-light shrink-0">
                <Star className="w-4 h-4 fill-amber text-amber" />
                <span className="text-xs font-bold text-text-primary mt-0.5 leading-none">4.9</span>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-8 lg:col-span-5 flex flex-col justify-between gap-5">
            <div className="bg-gradient-to-tr from-lavender via-lavender-soft to-peach rounded-[32px] p-6 sm:p-7 border border-border/60 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[240px] flex-1">
              <div>
                <h3 className="font-bold text-text-primary text-xl tracking-tight">
                  Zero-Effort Matching
                </h3>
              </div>

              <div className="relative h-32 my-auto flex items-center justify-center overflow-visible">
                <svg
                  className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                  viewBox="0 0 360 120"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M 30 110 C 110 100, 210 50, 330 15" style={{ stroke: "var(--color-border-muted)" }} strokeWidth="1.5" />
                  <path
                    d="M 100 115 C 180 110, 240 85, 340 55"
                    style={{ stroke: "var(--color-border)" }}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                </svg>

                <div className="absolute left-[10%] bottom-1 bg-surface p-2 rounded-full shadow-md border border-border-light/80 text-text-dark">
                  <CompanyLogo type="meta" className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="absolute left-[36%] top-9 bg-surface p-2 rounded-full shadow-md border border-border-light/80 text-text-dark">
                  <CompanyLogo type="gitlab" className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="absolute left-[62%] top-2 bg-surface p-2 rounded-full shadow-md border border-border-light/80 text-text-dark">
                  <CompanyLogo type="google" className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="absolute right-[6%] -top-1 bg-surface p-2 rounded-xl shadow-md border border-border-light/80 text-text-dark">
                  <CompanyLogo type="microsoft" className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                <div className="absolute right-[22%] bottom-1 bg-ink p-3 rounded-full shadow-xl ring-4 ring-violet-glow/60">
                  <JobbersIcon className="w-5 h-5 text-accent-foreground" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1">
              <div className="bg-violet-panel rounded-[32px] p-6 sm:p-7 flex flex-col justify-between min-h-[210px] hover:shadow-xs transition border border-violet-border/30">
                <div className="space-y-2">
                  <h3 className="font-bold text-text-primary text-xl tracking-tight">
                    Tailored every time
                  </h3>
                  <p className="text-xs sm:text-sm text-text-strong font-normal leading-relaxed">
                    A resume and cover letter rewritten for the specific role, in one click.
                  </p>
                </div>
              </div>

              <div className="bg-ink text-accent-foreground rounded-[32px] p-6 sm:p-7 flex flex-col justify-between min-h-[210px] shadow-sm relative overflow-hidden group border border-inverse-foreground/5">
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shadow-xs">
                  <JobbersIcon className="w-5 h-5 text-accent" />
                </div>
                <div className="space-y-1.5 pt-4">
                  <div className="text-3xl sm:text-4xl font-bold tracking-tight text-accent-foreground">
                    1.2M+
                  </div>
                  <p className="text-xs sm:text-sm text-text-muted font-normal leading-relaxed">
                    Roles scored against real profiles every week.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-12 lg:col-span-3 flex flex-col justify-between gap-5">
            <div className="bg-surface-tertiary rounded-[32px] p-6 sm:p-7 border border-border/70 shadow-2xs flex flex-col justify-between min-h-[240px] flex-1">
              <div className="space-y-2">
                <h3 className="font-bold text-text-primary text-xl tracking-tight">
                  Company research
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary font-normal leading-relaxed">
                  Know what they build and what to ask before the interview starts.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <div className="w-11 h-11 rounded-2xl bg-surface shadow-2xs border border-border-light flex items-center justify-center text-text-dark">
                  <CompanyLogo type="github" className="w-5 h-5" />
                </div>
                <div className="w-11 h-11 rounded-2xl bg-surface shadow-2xs border border-border-light flex items-center justify-center text-text-dark">
                  <CompanyLogo type="x" className="w-5 h-5" />
                </div>
                <div className="w-11 h-11 rounded-2xl bg-surface shadow-2xs border border-border-light flex items-center justify-center text-text-dark">
                  <CompanyLogo type="amazon" className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-surface-tertiary rounded-[32px] p-6 sm:p-7 border border-border/70 shadow-2xs flex flex-col justify-between min-h-[210px] flex-1">
              <div className="space-y-2 mt-auto">
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
                  94%
                </div>
                <p className="text-xs sm:text-sm text-text-secondary font-normal leading-relaxed">
                  of saved roles get a full tailored application.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
