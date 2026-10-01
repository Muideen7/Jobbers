import Link from "next/link";
import { Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";

import { CompanyLogo } from "@/components/homepage/Logos";
import { marketSkills } from "@/components/homepage/data";

const legend: ReadonlyArray<{ label: string; percent: string; dotClass: string }> = [
  { label: "Full stack", percent: "50%", dotClass: "bg-skill-slate" },
  { label: "Frontend", percent: "30%", dotClass: "bg-skill-lime" },
  { label: "Product design", percent: "10%", dotClass: "bg-skill-sky" },
  { label: "Everything else", percent: "10%", dotClass: "bg-border-muted" },
];

export function AiMatcher() {
  return (
    <section
      id="ai-matcher"
      className="w-full py-16 sm:py-24 relative overflow-hidden bg-surface-tertiary border-b border-border/60 rounded-b-[20px]"
    >
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-violet-glow/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-info-lightest/60 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-secondary text-xs font-semibold text-text-darkest">
              <Sparkles className="w-3.5 h-3.5 text-text-strong fill-current" />
              <span>AI analysis</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight leading-[1.12]">
              Your personal AI job matcher.
            </h2>

            <p className="text-text-strong text-sm sm:text-base leading-relaxed">
              While you sleep, Jobbers is scanning. While you work, it is scoring. Our AI reads
              every live listing against your skills, experience and target direction, then shows
              you only the roles worth your time — with a plain-English reason for each score. No
              more guessing which of the 400 tabs to open.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-2">
              {marketSkills.map((item) => (
                <div
                  key={item.name}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-border/80 bg-surface-tertiary/60 text-xs sm:text-sm font-medium text-text-darkest shadow-2xs hover:bg-surface transition"
                >
                  <span>{item.name}</span>
                  <span
                    className={`inline-flex items-center text-xs font-semibold ${
                      item.trend === "up" ? "text-success-dark" : "text-rose"
                    }`}
                  >
                    {item.trend === "up" ? (
                      <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                    )}
                    {item.change}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="btn btn-secondary"
              >
                Start matching
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-gradient-to-b from-surface-tertiary via-surface-tertiary to-pastel-lilac p-5 sm:p-7 rounded-[32px] border border-border-light shadow-xs space-y-4">
              <div className="bg-surface rounded-2xl p-5 shadow-xs border border-border-light">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-sm font-semibold text-text-primary">Your match today</span>
                  <span className="text-text-muted font-bold text-base">+</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-6 flex justify-center relative">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          style={{ stroke: "var(--color-skill-slate)" }}
                          strokeWidth="12"
                          strokeDasharray="119.38 238.76"
                          strokeDashoffset="0"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          style={{ stroke: "var(--color-skill-lime)" }}
                          strokeWidth="12"
                          strokeDasharray="71.63 238.76"
                          strokeDashoffset="-119.38"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          style={{ stroke: "var(--color-skill-sky)" }}
                          strokeWidth="12"
                          strokeDasharray="23.88 238.76"
                          strokeDashoffset="-191.01"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          style={{ stroke: "var(--color-border)" }}
                          strokeWidth="12"
                          strokeDasharray="23.88 238.76"
                          strokeDashoffset="-214.89"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-base font-bold text-text-primary tracking-tight">$120k</span>
                        <span className="text-[10px] text-text-muted font-medium">Total</span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-6 space-y-2 text-xs">
                    {legend.map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-text-dark">
                          <span className={`w-2 h-2 rounded-full ${item.dotClass}`} />
                          <span>{item.label}</span>
                        </div>
                        <span className="font-semibold text-text-primary tabular-nums">
                          {item.percent}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-2xl p-5 shadow-xs border border-border-light space-y-3">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>United Kingdom</span>
                  <span className="px-2 py-0.5 rounded-md bg-success-lightest text-success-foreground font-semibold">
                    94% match
                  </span>
                </div>

                <div>
                  <h4 className="text-xl font-bold text-text-primary tracking-tight">
                    Senior Frontend Engineer
                  </h4>
                  <p className="text-xs text-text-secondary mt-1">$140–$180k · London, UK</p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-surface-secondary text-text-dark">
                    Hybrid
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-surface-secondary text-text-dark">
                    Mid level
                  </span>
                </div>

                <div className="pt-2 border-t border-border-light flex items-center justify-between">
                  <div className="flex items-center gap-2 text-text-dark">
                    <CompanyLogo type="gitlab" className="w-5 h-5" />
                    <span className="text-xs font-semibold text-text-primary">GitLab</span>
                  </div>

                  <Link
                    href="/find-jobs"
                    className="btn btn-primary btn-sm"
                  >
                    View role
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
