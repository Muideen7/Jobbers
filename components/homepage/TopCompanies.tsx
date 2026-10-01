import { Check, TrendingUp } from "lucide-react";

import { CompanyLogo, JobbersIcon } from "@/components/homepage/Logos";
import { companyPillsRowOne, companyPillsRowTwo } from "@/components/homepage/data";

export function TopCompanies() {
  return (
    <section id="top-companies" className="w-full py-16 md:py-24 relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-semibold text-text-secondary tracking-wide uppercase">
          Trusted by 40,000+ job seekers
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all duration-300 text-text-primary">
          {/*
            Documented exception to the no-hardcoded-hex rule: third-party
            brand wordmark colours. HubSpot orange (#ff7a59) and the Rareburg
            mark green (#70c922) are brand identities, not design-system
            surfaces, so they stay literal. Every colour that IS ours
            (crisp -> text-info, Rareburg navy -> text-brand-navy, the star ->
            text-amber, the trend arrow -> text-orange) is a token.
          */}
          <span className="text-xl font-bold tracking-tight">ripple</span>
          <span className="text-xl font-extrabold tracking-tight text-[#ff7a59]">HubSpot</span>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.5045 4.5045 0 0 1-4.4945 4.4947z" />
            </svg>
            <span className="text-xl font-bold tracking-tight">OpenAI</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-4 bg-info rounded-tl-lg rounded-tr-lg rounded-br-lg inline-block" />
            <span className="text-xl font-bold tracking-tight text-info">crisp</span>
          </span>
          <span className="text-xl font-extrabold tracking-tight text-brand-navy">Rareburg</span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#70c922] text-accent-foreground flex items-center justify-center font-bold text-xs">
              iD
            </span>
            <span className="text-xl font-bold tracking-tight">inDrive</span>
          </span>
          <span className="flex items-center gap-1 text-text-muted">
            <span className="text-xl font-bold tracking-tight text-text-strong">Walmart</span>
            <span className="text-amber font-bold text-lg">✻</span>
          </span>
        </div>

        <div className="mt-16 md:mt-24 relative max-w-4xl mx-auto px-4 pt-12 pb-8">
          <div className="relative w-full h-[280px] sm:h-[340px] md:h-[380px] flex items-center justify-center">
            <svg
              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
              viewBox="0 0 800 420"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M 60 400 C 120 120, 680 120, 740 400"
                style={{ stroke: "var(--color-art-line)" }}
                strokeWidth="2.5"
                strokeDasharray="6 6"
              />
              <path
                d="M 60 400 C 120 120, 680 120, 740 400"
                stroke="url(#topCompaniesArc)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path d="M 160 400 C 220 200, 580 200, 640 400" style={{ stroke: "var(--color-art-line)" }} strokeWidth="2" />
              <defs>
                <linearGradient id="topCompaniesArc" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: "var(--color-art-fill)" }} stopOpacity="0.3" />
                  <stop offset="50%" style={{ stopColor: "var(--color-art-fill-strong)" }} stopOpacity="0.9" />
                  <stop offset="100%" style={{ stopColor: "var(--color-art-fill)" }} stopOpacity="0.3" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-surface rounded-full px-5 py-2 shadow-lg border border-border/80 flex items-center gap-2">
                <JobbersIcon className="w-5 h-5 text-text-primary" />
                <span className="font-bold text-sm text-text-primary">Jobbers</span>
              </div>
            </div>

            <div className="absolute top-8 sm:top-12 right-[18%] sm:right-[24%] z-20 hidden sm:flex">
              <div className="bg-accent-muted border border-violet-border rounded-full px-3.5 py-1.5 shadow-sm flex items-center gap-1.5 text-xs font-semibold text-accent">
                <span className="w-4 h-4 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </span>
                <span>Application tailored</span>
              </div>
            </div>

            <div className="absolute top-[32%] sm:top-[28%] left-[22%] sm:left-[26%] z-20 hidden sm:flex">
              <div className="bg-pastel-cream border border-peach-line rounded-full px-3 py-1 shadow-sm flex items-center gap-1.5 text-xs font-semibold text-orange">
                <TrendingUp className="w-3.5 h-3.5 text-orange" />
                <span>Match score 94</span>
              </div>
            </div>

            <div className="absolute top-10 sm:top-14 left-[34%] sm:left-[36%] z-10 bg-surface p-2.5 rounded-full shadow-md border border-border-light text-text-dark">
              <CompanyLogo type="gitlab" className="w-5 h-5" />
            </div>
            <div className="absolute top-[32%] left-[10%] sm:left-[14%] z-10 bg-surface p-2.5 rounded-full shadow-md border border-border-light text-text-dark">
              <CompanyLogo type="x" className="w-4 h-4" />
            </div>
            <div className="absolute bottom-[20%] left-[16%] sm:left-[20%] z-10 bg-surface p-2.5 rounded-full shadow-md border border-border-light text-text-dark">
              <CompanyLogo type="meta" className="w-5 h-5" />
            </div>
            <div className="absolute top-[28%] left-[45%] sm:left-[47%] z-10 bg-surface p-2.5 rounded-full shadow-md border border-border-light text-text-dark">
              <CompanyLogo type="google" className="w-5 h-5" />
            </div>
            <div className="absolute top-[34%] right-[38%] sm:right-[40%] z-10 bg-surface p-2.5 rounded-full shadow-md border border-border-light text-text-dark">
              <CompanyLogo type="microsoft" className="w-5 h-5" />
            </div>
            <div className="absolute top-[28%] right-[24%] sm:right-[28%] z-10 bg-surface p-2.5 rounded-full shadow-md border border-border-light text-text-dark">
              <CompanyLogo type="github" className="w-5 h-5" />
            </div>
            <div className="absolute bottom-[22%] right-[22%] sm:right-[26%] z-10 bg-surface p-2.5 rounded-full shadow-md border border-border-light text-text-dark">
              <CompanyLogo type="amazon" className="w-5 h-5" />
            </div>

            <div className="relative z-10 pt-16 sm:pt-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight leading-tight">
                Where people
                <br />
                are hiring now
              </h2>
            </div>
          </div>

          <div className="mt-8 space-y-2.5">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {companyPillsRowOne.map((tag) => (
                <span
                  key={tag}
                  className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-text-dark bg-surface-tertiary border border-border/70 hover:bg-surface-secondary hover:text-text-primary transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {companyPillsRowTwo.map((tag) => (
                <span
                  key={tag}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    tag === "1,200 more"
                      ? "bg-ink text-accent-foreground font-semibold"
                      : "text-text-dark bg-surface-tertiary border border-border/70 hover:bg-surface-secondary"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
