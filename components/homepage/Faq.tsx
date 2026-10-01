import Link from "next/link";
import { HelpCircle, ChevronDown } from "lucide-react";

import { faqs } from "@/components/homepage/data";

export function Faq() {
  return (
    <section id="faq" className="w-full py-14 md:py-24 relative">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-surface-secondary text-xs font-semibold text-text-darkest">
              <HelpCircle className="w-3.5 h-3.5 text-text-strong" />
              <span>FAQ</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight leading-[1.12]">
              Common
              <br />
              questions
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
                href="/login"
                className="btn btn-secondary btn-sm mt-2 cursor-pointer"
              >
                Get started
              </Link>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-3.5">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="group border border-border/80 rounded-2xl overflow-hidden bg-surface transition-[border-color,box-shadow] duration-300 hover:border-border-muted open:border-border-muted open:shadow-md"
              >
                <summary className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer list-none select-none focus:outline-hidden [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold text-text-primary text-sm sm:text-base">
                    {item.question}
                  </span>
                  <span className="grid place-items-center size-8 shrink-0 rounded-full bg-surface-secondary text-text-strong transition-[background-color,color,transform] duration-300 group-open:rotate-180 group-open:bg-ink group-open:text-accent-foreground">
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </summary>

                {/* 0fr -> 1fr keeps the panel mounted so it can animate its own height. */}
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
