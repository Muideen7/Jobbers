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
          <rect x="0" y="0" width="46" height="24" rx="12" strokeWidth="2" style={{ fill: "var(--color-surface)", stroke: "var(--color-text-slate)" }} />
          <text
            x="23"
            y="16"
           
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="inherit" style={{ fill: "var(--color-text-slate)" }}>
            94%
          </text>
        </g>
        <g transform="translate(30, 96)">
          <line x1="0" y1="0" x2="26" y2="0" strokeWidth="3.5" strokeLinecap="round" style={{ stroke: "var(--color-surface)" }} />
          <line x1="0" y1="8" x2="16" y2="8" strokeWidth="3.5" strokeLinecap="round" style={{ stroke: "var(--color-surface)" }} />
          <line x1="0" y1="16" x2="22" y2="16" strokeWidth="3.5" strokeLinecap="round" style={{ stroke: "var(--color-surface)" }} />
        </g>
        <g transform="translate(182, 88)">
          <rect x="0" y="14" width="5.5" height="12" rx="1.5" style={{ fill: "var(--color-surface)" }} />
          <rect x="8" y="7" width="5.5" height="19" rx="1.5" style={{ fill: "var(--color-surface)" }} />
          <rect x="16" y="0" width="5.5" height="26" rx="1.5" style={{ fill: "var(--color-surface)" }} />
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
        <g transform="translate(24, 20)">
          <circle cx="12" cy="12" r="13" strokeWidth="2.5" style={{ fill: "var(--color-surface)", stroke: "var(--color-text-slate)" }} />
          <path d="M 7 12 L 11 16 L 18 8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--color-text-slate)" }} />
        </g>
        <g transform="translate(42, 34)">
          <rect x="0" y="0" width="164" height="78" rx="8" strokeWidth="2.5" style={{ fill: "var(--color-surface)", stroke: "var(--color-text-slate)" }} />
          <rect x="10" y="8" width="14" height="14" rx="2" fill="none" strokeWidth="2" style={{ stroke: "var(--color-text-slate)" }} />
          <path d="M 13 11 L 21 19 M 21 11 L 13 19" strokeWidth="1.8" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <line x1="32" y1="12" x2="88" y2="12" strokeWidth="2.5" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <line x1="32" y1="18" x2="68" y2="18" strokeWidth="2" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <rect x="10" y="28" width="86" height="12" rx="4" fill="none" strokeWidth="2" style={{ stroke: "var(--color-text-slate)" }} />
          <line x1="10" y1="48" x2="64" y2="48" strokeWidth="2.5" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
          <g transform="translate(130, 20)">
            <circle cx="10" cy="10" r="9" fill="none" strokeWidth="2" style={{ stroke: "var(--color-text-slate)" }} />
            <circle cx="10" cy="10" r="3" style={{ fill: "var(--color-text-slate)" }} />
            <line x1="-3" y1="10" x2="23" y2="10" strokeWidth="1.5" style={{ stroke: "var(--color-text-slate)" }} />
          </g>
          <g transform="translate(94, 44)">
            <rect x="0" y="0" width="60" height="24" rx="12" style={{ fill: "var(--color-text-primary)" }} />
            <text
              x="30"
              y="16"
             
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="inherit" style={{ fill: "var(--color-surface)" }}>
              Apply
            </text>
          </g>
        </g>
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
      <g transform="translate(18, 38)">
        <path
          d="M 16 0 L 32 8 V 24 C 32 38, 16 48, 16 48 C 16 48, 0 38, 0 24 V 8 L 16 0 Z"
         
         
          strokeWidth="2.5" style={{ fill: "var(--color-surface)", stroke: "var(--color-text-slate)" }} />
        <path
          d="M 16 6 L 26 12 V 22 C 26 31, 16 38, 16 38 C 16 38, 6 31, 6 22 V 12 L 16 6 Z" style={{ fill: "var(--color-surface-secondary)" }} />
      </g>
      <g transform="translate(48, 30)">
        <rect x="0" y="0" width="144" height="84" rx="8" strokeWidth="2.5" style={{ fill: "var(--color-surface)", stroke: "var(--color-text-slate)" }} />
        <circle cx="8" cy="8" r="2" style={{ fill: "var(--color-text-slate)" }} />
        <circle cx="14" cy="8" r="2" style={{ fill: "var(--color-text-slate)" }} />
        <line x1="22" y1="8" x2="48" y2="8" strokeWidth="1.5" strokeLinecap="round" style={{ stroke: "var(--color-text-slate)" }} />
        <rect x="6" y="16" width="132" height="28" rx="4" strokeWidth="1.5" style={{ fill: "var(--color-surface)", stroke: "var(--color-text-slate)" }} />
        <line x1="50" y1="16" x2="50" y2="44" strokeWidth="1.5" style={{ stroke: "var(--color-text-slate)" }} />
        <line x1="94" y1="16" x2="94" y2="44" strokeWidth="1.5" style={{ stroke: "var(--color-text-slate)" }} />
        <text x="28" y="27" fontSize="6.5" fontWeight="600" textAnchor="middle" fontFamily="inherit" style={{ fill: "var(--color-text-slate-medium)" }}>
          Skills
        </text>
        <text x="28" y="38" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="inherit" style={{ fill: "var(--color-text-primary)" }}>
          92%
        </text>
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
  return (
    <section
      id="how-it-works"
      className="w-full text-inverse-foreground py-16 sm:py-24 relative overflow-hidden rounded-b-[20px] bg-inverse"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-surface/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface text-text-primary text-xs sm:text-sm font-semibold shadow-xs">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="4.5" style={{ fill: "var(--color-orange)" }} />
              <circle cx="16" cy="8" r="4.5" style={{ fill: "var(--color-accent)" }} />
              <circle cx="8" cy="16" r="4.5" style={{ fill: "var(--color-skill-sky)" }} />
              <circle cx="16" cy="16" r="4.5" style={{ fill: "var(--color-success)" }} />
            </svg>
            <span>How it works</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight text-inverse-foreground leading-[1.12]">
            Keep your day job.
            <br />
            <span className="text-inverse-foreground">Jobbers does the searching.</span>
          </h2>
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-stretch">
          {steps.map((item, index) => (
            <div
              key={item.title}
              className="bg-inverse-deep border border-inverse-foreground/10 hover:border-inverse-foreground/20 rounded-3xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between h-full transition-all duration-200 group"
            >
              <div className="space-y-3.5">
                <div>
                  <span className="inline-block px-3.5 py-1 rounded-full bg-surface text-xs font-bold text-text-primary shadow-xs">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-inverse-foreground tracking-tight">{item.title}</h3>
                <p className="text-xs sm:text-sm text-inverse-muted leading-relaxed">{item.description}</p>
              </div>

              <div className="mt-6 sm:mt-8 pt-2 sm:pt-4">
                <div className="bg-inverse-sunken rounded-2xl p-3 sm:p-4 border border-inverse-foreground/5 h-36 sm:h-40 lg:h-44 w-full flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform">
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
