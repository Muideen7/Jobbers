"use client";

import { useScrollReveal } from "@/lib/animations/useScrollReveal";

const steps: ReadonlyArray<{ title: string; description: string }> = [
  {
    title: "Build your profile",
    description:
      "Upload your resume and Jobbers extracts your skills, roles and experience automatically. Takes under five minutes — and the AI starts scoring immediately.",
  },
  {
    title: "AI finds your matches",
    description:
      "Forget scrolling. Every open role is scored against your profile in the background, and only the highest-fit ones reach the top of your list.",
  },
  {
    title: "Tailor and apply",
    description:
      "Open a match to see exactly why it scored that way, generate a tailored resume and cover letter, then apply without rewriting anything twice.",
  },
  {
    title: "Research, then interview",
    description:
      "Before the call, read a one-minute dossier on the company: what they build, how they work and what to ask. Arrive already knowing the answer.",
  },
];

function StepIllustration({ step }: { step: number }) {
  if (step === 1) {
    return (
      <svg
        className="w-full h-full max-w-[220px] max-h-full"
        viewBox="0 0 240 140"
        fill="none"
        aria-hidden="true"
      >
        <g transform="translate(24, 18) rotate(-6)">
          <rect x="0" y="0" width="34" height="46" rx="3" strokeWidth="2" style={{ fill: "var(--color-surface)", stroke: "var(--color-text-slate)" }} />
          <line x1="6" y1="12" x2="28" y2="12" strokeWidth="2" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <line x1="6" y1="19" x2="28" y2="19" strokeWidth="2" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <line x1="6" y1="26" x2="22" y2="26" strokeWidth="2" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
        </g>
        <g transform="translate(32, 16) rotate(3)">
          <rect x="0" y="0" width="34" height="46" rx="3" strokeWidth="2" style={{ fill: "var(--color-surface)", stroke: "var(--color-text-slate)" }} />
          <line x1="6" y1="12" x2="28" y2="12" strokeWidth="2" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <line x1="6" y1="19" x2="28" y2="19" strokeWidth="2" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <line x1="6" y1="26" x2="22" y2="26" strokeWidth="2" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
        </g>
        <g transform="translate(42, 34)">
          <rect x="0" y="0" width="154" height="74" rx="8" strokeWidth="2.5" style={{ fill: "var(--color-surface)", stroke: "var(--color-text-slate)" }} />
          <circle cx="28" cy="30" r="16" strokeWidth="2" style={{ fill: "var(--color-surface-secondary)", stroke: "var(--color-text-slate)" }} />
          <circle cx="23" cy="28" r="1.5" style={{ fill: "var(--color-text-slate)" }} />
          <circle cx="33" cy="28" r="1.5" style={{ fill: "var(--color-text-slate)" }} />
          <path d="M 23 34 Q 28 39 33 34" strokeWidth="1.8" strokeLinecap="round" fill="none" style={{ stroke: "var(--color-text-slate)" }} />
          <line x1="54" y1="24" x2="136" y2="24" strokeWidth="3" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <line x1="54" y1="36" x2="114" y2="36" strokeWidth="2.5" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <rect x="12" y="56" width="130" height="9" rx="3" strokeWidth="1.5" style={{ fill: "var(--color-border)", stroke: "var(--color-text-slate)" }} />
          <g transform="translate(132, 54)">
            <circle cx="10" cy="10" r="11" strokeWidth="2.5" style={{ fill: "var(--color-surface)", stroke: "var(--color-text-slate)" }} />
            <path
              d="M 6 10.5 L 9 13.5 L 14.5 7.5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round" style={{ stroke: "var(--color-text-slate)" }} />
          </g>
        </g>
      </svg>
    );
  }

  if (step === 2) {
    return (
      <svg
        className="w-full h-full max-w-[220px] max-h-full"
        viewBox="0 0 240 140"
        fill="none"
        aria-hidden="true"
      >
        <g transform="translate(112, 70)">
          <circle cx="0" cy="0" r="44" strokeWidth="2" strokeDasharray="5 5" opacity="0.9" style={{ stroke: "var(--color-surface)" }} />
          <circle cx="0" cy="0" r="30" strokeWidth="2" opacity="0.9" style={{ stroke: "var(--color-surface)" }} />
          <circle cx="0" cy="0" r="14" style={{ fill: "var(--color-surface)" }} />
          <circle cx="0" cy="0" r="4.5" style={{ fill: "var(--color-text-slate)" }} />
          <line x1="0" y1="-14" x2="0" y2="-52" strokeWidth="2" strokeDasharray="3 3" style={{ stroke: "var(--color-surface)" }} />
          <line x1="-5" y1="-52" x2="5" y2="-52" strokeWidth="2.5" strokeLinecap="round" style={{ stroke: "var(--color-surface)" }} />
          <line x1="0" y1="14" x2="0" y2="52" strokeWidth="2" strokeDasharray="3 3" style={{ stroke: "var(--color-surface)" }} />
          <line x1="-5" y1="52" x2="5" y2="52" strokeWidth="2.5" strokeLinecap="round" style={{ stroke: "var(--color-surface)" }} />
          <line x1="-14" y1="0" x2="-52" y2="0" strokeWidth="2" strokeDasharray="3 3" style={{ stroke: "var(--color-surface)" }} />
          <line x1="-52" y1="-5" x2="-52" y2="5" strokeWidth="2.5" strokeLinecap="round" style={{ stroke: "var(--color-surface)" }} />
          <line x1="14" y1="0" x2="52" y2="0" strokeWidth="2" strokeDasharray="3 3" style={{ stroke: "var(--color-surface)" }} />
          <line x1="52" y1="-5" x2="52" y2="5" strokeWidth="2.5" strokeLinecap="round" style={{ stroke: "var(--color-surface)" }} />
        </g>
        <g transform="translate(148, 22)">
          <circle cx="10" cy="10" r="10" style={{ fill: "var(--color-surface)" }} />
          <path d="M 6 10 L 9 13 L 14 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--color-text-slate)" }} />
        </g>
      </svg>
    );
  }

  if (step === 3) {
    return (
      <svg
        className="w-full h-full max-w-[220px] max-h-full"
        viewBox="0 0 240 140"
        fill="none"
        aria-hidden="true"
      >
        <g transform="translate(36, 16)">
          <rect x="0" y="0" width="70" height="96" rx="6" strokeWidth="2" style={{ fill: "var(--color-surface)", stroke: "var(--color-text-slate)" }} />
          <line x1="10" y1="16" x2="48" y2="16" strokeWidth="2.5" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <line x1="10" y1="26" x2="60" y2="26" strokeWidth="1.5" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <line x1="10" y1="34" x2="56" y2="34" strokeWidth="1.5" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <line x1="10" y1="42" x2="58" y2="42" strokeWidth="1.5" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <rect x="10" y="56" width="50" height="26" rx="4" style={{ fill: "var(--color-accent-light)" }} />
          <line x1="16" y1="66" x2="44" y2="66" strokeWidth="2" strokeLinecap="round" style={{ stroke: "var(--color-accent)" }} />
          <line x1="16" y1="74" x2="38" y2="74" strokeWidth="1.5" strokeLinecap="round" style={{ stroke: "var(--color-accent)" }} />
        </g>
        <g transform="translate(134, 16)">
          <rect x="0" y="0" width="70" height="96" rx="6" strokeWidth="2" style={{ fill: "var(--color-surface)", stroke: "var(--color-text-slate)" }} />
          <line x1="10" y1="16" x2="44" y2="16" strokeWidth="2.5" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <line x1="10" y1="26" x2="60" y2="26" strokeWidth="1.5" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <line x1="10" y1="34" x2="54" y2="34" strokeWidth="1.5" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <line x1="10" y1="42" x2="58" y2="42" strokeWidth="1.5" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <line x1="10" y1="50" x2="50" y2="50" strokeWidth="1.5" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
        </g>
        <path d="M 112 60 L 126 60 M 122 56 L 126 60 L 122 64" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--color-accent-foreground)" }} />
      </svg>
    );
  }

  return (
    <svg
      className="w-full h-full max-w-[220px] max-h-full"
      viewBox="0 0 240 140"
      fill="none"
      aria-hidden="true"
    >
      <g transform="translate(44, 22)">
        <rect x="0" y="0" width="152" height="92" rx="10" strokeWidth="2" style={{ fill: "var(--color-surface)", stroke: "var(--color-text-slate)" }} />
        <rect x="12" y="14" width="36" height="28" rx="4" style={{ fill: "var(--color-surface-secondary)" }} />
        <text x="72" y="27" fontSize="6.5" fontWeight="600" textAnchor="middle" fontFamily="inherit" style={{ fill: "var(--color-text-slate-medium)" }}>
          Salary
        </text>
        <text x="72" y="38" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="inherit" style={{ fill: "var(--color-text-primary)" }}>
          $160k
        </text>
        <text x="116" y="27" fontSize="6.5" fontWeight="600" textAnchor="middle" fontFamily="inherit" style={{ fill: "var(--color-text-slate-medium)" }}>
          Roles
        </text>
        <text x="116" y="38" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="inherit" style={{ fill: "var(--color-text-primary)" }}>
          24 fit
        </text>
        <g transform="translate(12, 54)">
          <circle cx="8" cy="4" r="3.5" fill="none" strokeWidth="1.5" style={{ stroke: "var(--color-text-slate)" }} />
          <circle cx="48" cy="4" r="3.5" fill="none" strokeWidth="1.5" style={{ stroke: "var(--color-text-slate)" }} />
          <circle cx="88" cy="4" r="3.5" fill="none" strokeWidth="1.5" style={{ stroke: "var(--color-text-slate)" }} />
        </g>
        <rect x="6" y="74" width="46" height="4" rx="2" fill="none" strokeWidth="1" style={{ stroke: "var(--color-text-slate)" }} />
      </g>
      <g transform="translate(196, 42)">
        <path d="M 10 0 L 2 12 H 10 L 4 22 L 16 8 H 8 L 14 0 Z" strokeWidth="1.5" style={{ fill: "var(--color-surface)", stroke: "var(--color-text-slate)" }} />
      </g>
    </svg>
  );
}

export function HowItWorks() {
  const { ref: sectionRef } = useScrollReveal({ threshold: 0.1 });

  return (
    <section
      id="how-it-works"
      className="w-full text-inverse-foreground py-16 sm:py-24 relative overflow-hidden rounded-b-[20px] bg-inverse"
      ref={sectionRef}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-surface/5 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="reveal-init inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface text-text-primary text-xs sm:text-sm font-semibold shadow-xs">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="4.5" style={{ fill: "var(--color-orange)" }} />
              <circle cx="16" cy="8" r="4.5" style={{ fill: "var(--color-accent)" }} />
              <circle cx="8" cy="16" r="4.5" style={{ fill: "var(--color-skill-sky)" }} />
              <circle cx="16" cy="16" r="4.5" style={{ fill: "var(--color-success)" }} />
            </svg>
            <span>How it works</span>
          </div>

          <h2 className="reveal-init text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight text-inverse-foreground leading-[1.12]">
            Keep your day job.{" "}
            <span className="text-inverse-foreground bg-gradient-to-r from-inverse-foreground via-accent-light to-inverse-foreground bg-clip-text">
              Jobbers does the searching.
            </span>
          </h2>
        </div>

        {/* Progression Beam */}
        <div className="hidden lg:block relative mt-10 max-w-4xl mx-auto h-[2px]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-stretch">
          {steps.map((item, index) => (
            <div
              key={item.title}
              className="reveal-init bg-inverse-deep border border-inverse-foreground/10 hover:border-accent/40 rounded-3xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between h-full transition-all duration-300 group hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="inline-block px-3.5 py-1 rounded-full bg-surface text-xs font-bold text-text-primary shadow-xs group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    Step {index + 1}
                  </span>
                  <span className="text-xs font-semibold text-inverse-muted">0{index + 1}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-inverse-foreground tracking-tight">{item.title}</h3>
                <p className="text-xs sm:text-sm text-inverse-muted leading-relaxed">{item.description}</p>
              </div>

              <div className="mt-6 sm:mt-8 pt-2 sm:pt-4">
                <div className="bg-inverse-sunken rounded-2xl p-3 sm:p-4 border border-inverse-foreground/5 h-36 sm:h-40 lg:h-44 w-full flex items-center justify-center relative overflow-hidden group-hover:scale-[1.03] transition-transform">
                  <StepIllustration step={index + 1} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
