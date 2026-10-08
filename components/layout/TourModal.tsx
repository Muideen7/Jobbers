"use client";

import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { JobbersIcon } from "@/components/homepage/Logos";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TOUR_STEPS = [
  {
    title: "Welcome",
    subtitle: "Here's a quick look at everything Jobbers can do for you.",
  },
  {
    title: "Multi-Source Job Discovery",
    subtitle:
      "Find live openings aggregated from 5+ job networks (JSearch, Arbeitnow, RemoteOK, Remotive & Jobicy) scored against your candidate profile.",
  },
  {
    title: "Applications Pipeline",
    subtitle:
      "Track your active applications across Saved, Applied, Interview, and Offer stages with one-click status transitions.",
  },
  {
    title: "AI Resumes & PDF Builder",
    subtitle:
      "Extract experience from your uploaded resume and generate polished, publication-ready PDF resumes using Gemini AI.",
  },
  {
    title: "Company Research & Dossiers",
    subtitle:
      "Access in-depth company dossiers before interviews so you walk into every application fully informed and prepared.",
  },
];

export function TourModal({ open, onOpenChange }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!open) return null;

  const isLast = currentStep === TOUR_STEPS.length - 1;
  const step = TOUR_STEPS[currentStep]!;

  function handleNext() {
    if (isLast) {
      onOpenChange(false);
      setCurrentStep(0);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      {/* Soft backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />

      {/* Modal Box — matching Payment Modal dimensions (max-w-5xl) */}
      <div className="relative w-full max-w-5xl overflow-y-auto max-h-[90vh] min-h-[500px] rounded-[32px] border border-border/80 bg-gradient-to-b from-surface via-surface-tertiary to-surface-secondary/40 p-8 sm:p-12 shadow-2xl transition-all duration-300 transform scale-100 flex flex-col items-center justify-between text-center animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close tour"
          className="absolute right-5 top-5 rounded-full p-2 text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Center Icon Squircle */}
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-surface shadow-lg transition-transform hover:scale-105">
          <JobbersIcon className="h-8 w-8 text-accent-foreground" />
        </div>

        {/* Step Indicator Dots */}
        <div className="mb-6 flex items-center gap-1.5">
          {TOUR_STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              aria-label={`Go to step ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentStep
                  ? "w-6 bg-ink"
                  : "w-1.5 bg-border hover:bg-border-muted"
              }`}
            />
          ))}
        </div>

        {/* Animated content wrapper */}
        <div
          key={currentStep}
          className="flex flex-col items-center text-center transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-forwards"
        >
          {/* Title */}
          <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            {step.title}
          </h2>

          {/* Subtitle */}
          <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
            {step.subtitle}
          </p>
        </div>

        {/* Bottom Pill Action Button */}
        <button
          type="button"
          onClick={handleNext}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-accent-foreground shadow-md transition-all hover:bg-ink-hover active:scale-95 cursor-pointer"
        >
          <span>{isLast ? "Get Started" : "Next"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
