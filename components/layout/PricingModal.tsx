"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobbersIcon } from "@/components/homepage/Logos";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type BillingCycle = "monthly" | "quarterly" | "annual";

export function PricingModal({ open, onOpenChange }: Props) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-md transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />

      {/* Pricing Modal Box — matching Image 2 */}
      <div className="relative w-full max-w-5xl overflow-y-auto max-h-[90vh] rounded-[32px] border border-border bg-surface p-6 shadow-2xl transition-all sm:p-10 flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close pricing modal"
          className="absolute right-5 top-5 rounded-full p-2 text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Top Jobbers Icon Squircle (Black background) */}
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-accent-foreground shadow-lg">
          <JobbersIcon className="h-8 w-8 text-accent-foreground" />
        </div>

        {/* Header */}
        <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          Upgrade your plan
        </h2>
        <p className="mt-1.5 max-w-md text-sm text-text-secondary leading-relaxed">
          Choose a plan that works for you. Let Jobbers handle the manual work.
        </p>

        {/* Billing Cycle Pill Toggle */}
        <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-border bg-surface-secondary p-1">
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            className={`rounded-full px-5 py-1.5 text-xs font-medium transition-all ${
              cycle === "monthly"
                ? "bg-ink text-accent-foreground font-semibold shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setCycle("quarterly")}
            className={`rounded-full px-5 py-1.5 text-xs font-medium transition-all ${
              cycle === "quarterly"
                ? "bg-ink text-accent-foreground font-semibold shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Quarterly
          </button>
          <button
            type="button"
            onClick={() => setCycle("annual")}
            className={`flex items-center gap-1 rounded-full px-5 py-1.5 text-xs font-medium transition-all ${
              cycle === "annual"
                ? "bg-ink text-accent-foreground font-semibold shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <span>Annual</span>
            <span className="text-[10px] font-bold text-success">2 months free</span>
          </button>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3 w-full items-stretch text-left">
          {/* 1. PRO CARD */}
          <div className="flex flex-col rounded-3xl border border-border bg-surface-tertiary/60 p-6 shadow-card hover:border-border-muted transition-colors justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-surface-secondary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                ⚡ PRO
              </span>
              <p className="text-xs text-text-muted mb-4">
                For casual job seekers exploring the market
              </p>

              {/* Inner Price Box */}
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">
                    Early Bird Offer
                  </span>
                  <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-lime-800">
                    33% OFF
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-text-primary">
                    ₦10,000
                  </span>
                  <span className="text-xs text-text-muted">/ month</span>
                </div>
                <span className="text-xs text-text-muted line-through">
                  ₦15,000 / month
                </span>

                <Button variant="outline" className="mt-3 w-full rounded-full font-medium" disabled>
                  Choose Pro
                </Button>
              </div>

              {/* Feature List */}
              <ul className="flex flex-col gap-2.5 text-xs text-text-secondary">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>300 AI credits a month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>50 autofills</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>50 auto-apply runs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>5 resume profiles</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>300 lead searches</span>
                </li>
              </ul>
            </div>
            <button type="button" className="mt-4 text-xs font-semibold text-text-muted hover:underline">
              View all
            </button>
          </div>

          {/* 2. MAX CARD (Primary Highlighted) */}
          <div className="flex flex-col rounded-3xl border-2 border-accent bg-accent text-accent-foreground p-6 shadow-xl relative md:-translate-y-1 justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink mb-2">
                ⚡ MAX
              </span>
              <p className="text-xs text-accent-light mb-4">
                For when job hunting is your full-time job
              </p>

              {/* Inner White Price Box */}
              <div className="rounded-2xl border border-border bg-surface text-text-primary p-5 shadow-md flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">
                    Early Bird Offer
                  </span>
                  <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-lime-800">
                    20% OFF
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-text-primary">
                    ₦20,000
                  </span>
                  <span className="text-xs text-text-muted">/ month</span>
                </div>
                <span className="text-xs text-text-muted line-through">
                  ₦25,000 / month
                </span>

                <Button className="mt-3 w-full rounded-full bg-accent text-accent-foreground hover:bg-accent-dark font-semibold" disabled>
                  Choose Max
                </Button>
              </div>

              {/* Feature List */}
              <ul className="flex flex-col gap-2.5 text-xs text-accent-light">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent-light shrink-0" />
                  <span>700 AI credits a month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent-light shrink-0" />
                  <span>150 autofills</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent-light shrink-0" />
                  <span>100 auto-apply runs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent-light shrink-0" />
                  <span>10 resume profiles</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent-light shrink-0" />
                  <span>500 lead searches</span>
                </li>
              </ul>
            </div>
            <button type="button" className="mt-4 text-xs font-semibold text-accent-light hover:underline">
              View all
            </button>
          </div>

          {/* 3. ULTRA CARD */}
          <div className="flex flex-col rounded-3xl border border-border bg-surface-tertiary/60 p-6 shadow-card hover:border-border-muted transition-colors justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-surface-secondary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                ⚡ ULTRA
              </span>
              <p className="text-xs text-text-muted mb-4">
                For job seekers ready to go all out to land an offer
              </p>

              {/* Inner Price Box */}
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-text-secondary uppercase">
                    Early Bird Offer
                  </span>
                  <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-lime-800">
                    11% OFF
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-text-primary">
                    ₦40,000
                  </span>
                  <span className="text-xs text-text-muted">/ month</span>
                </div>
                <span className="text-xs text-text-muted line-through">
                  ₦45,000 / month
                </span>

                <Button variant="outline" className="mt-3 w-full rounded-full font-medium" disabled>
                  Choose Ultra
                </Button>
              </div>

              {/* Feature List */}
              <ul className="flex flex-col gap-2.5 text-xs text-text-secondary">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>1,500 AI credits a month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>300 autofills</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>300 auto-apply runs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>20 resume profiles</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>Unlimited lead searches</span>
                </li>
              </ul>
            </div>
            <button type="button" className="mt-4 text-xs font-semibold text-text-muted hover:underline">
              View all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
