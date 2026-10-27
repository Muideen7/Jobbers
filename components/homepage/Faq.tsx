"use client";

import Link from "next/link";
import { HelpCircle, ChevronDown } from "lucide-react";

import { faqs } from "@/components/homepage/data";
import { useScrollReveal } from "@/lib/animations/useScrollReveal";

export function Faq() {
  const { ref: sectionRef } = useScrollReveal({ threshold: 0.1 });

  return (
    <section id="faq" className="w-full py-14 md:py-24 relative" ref={sectionRef}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="reveal-init lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-surface-secondary text-xs font-semibold text-text-darkest">
              <HelpCircle className="w-3.5 h-3.5 text-text-strong" />
              <span>FAQ</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight leading-[1.12]">
              Common questions
            </h2>

            <p className="text-text-secondary text-sm leading-relaxed">
              Everything you need to know about finding work with AI instead of a spreadsheet of
              tabs.
            </p>

            <div className="bg-surface-tertiary border border-border/80 rounded-2xl p-6 shadow-2xs space-y-3 mt-8">
              <h3 className="font-semibold text-text-primary text-sm">Still have questions?</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Build a profile and see your own match scores — it answers most questions faster
                than we can.
              </p>
              <Link
                href="/login?mode=signup"
                className="btn btn-secondary btn-sm mt-2 cursor-pointer hover:border-accent/40 transition-colors"
              >
                Get started
              </Link>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-3.5">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="reveal-init group border border-border/80 rounded-2xl overflow-hidden bg-surface transition-all duration-300 hover:border-accent/40 open:border-accent/40 open:shadow-md"
              >
                <summary className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer list-none select-none focus:outline-hidden [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold text-text-primary text-sm sm:text-base group-hover:text-accent transition-colors">
                    {item.question}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center shrink-0 group-hover:bg-accent-light transition-colors">
                    <ChevronDown className="w-4 h-4 text-text-secondary group-hover:text-accent transition-transform duration-300 group-open:rotate-180" />
                  </div>
                </summary>
                <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none group-open:grid-rows-[1fr]">
                  <div className="overflow-hidden">
                    <div className="mx-5 sm:mx-6 border-t border-border-light pt-4 pb-5 sm:pb-6 text-xs sm:text-sm text-text-strong leading-relaxed opacity-0 translate-y-1 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none group-open:opacity-100 group-open:translate-y-0">
                      {item.answer}
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
