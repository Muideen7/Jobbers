"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Heart, ChevronLeft, ChevronRight, MapPin, Star, Sparkles } from "lucide-react";

import { testimonials } from "@/components/homepage/data";
import { useScrollReveal } from "@/lib/animations/useScrollReveal";

const AUTO_SCROLL_INTERVAL_MS = 4500;

export function WallOfLove() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { ref: sectionRef } = useScrollReveal({ threshold: 0.1 });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScrollBounds = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 20
      : 320;
    const current = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(testimonials.length - 1, Math.max(0, current)));
  }, []);

  const scrollTo = useCallback((direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 20
      : 340;
    const delta = direction === "right" ? cardWidth : -cardWidth;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 20
      : 340;
    el.scrollTo({ left: index * cardWidth, behavior: "smooth" });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollTo("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollTo("right");
      }
    },
    [scrollTo],
  );

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      const el = scrollContainerRef.current;
      if (!el) return;

      const { scrollLeft, scrollWidth, clientWidth } = el;
      if (scrollLeft >= scrollWidth - clientWidth - 20) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollTo("right");
      }
    }, AUTO_SCROLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isPaused, scrollTo]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScrollBounds();
    el.addEventListener("scroll", checkScrollBounds, { passive: true });
    window.addEventListener("resize", checkScrollBounds);
    return () => {
      el.removeEventListener("scroll", checkScrollBounds);
      window.removeEventListener("resize", checkScrollBounds);
    };
  }, [checkScrollBounds]);

  return (
    <section
      id="wall-of-love"
      ref={sectionRef}
      className="w-full py-14 md:py-24 relative overflow-hidden"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      aria-label="Testimonials Wall of Love"
    >
      {/* Background ambient radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="reveal-init flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-soft text-xs font-semibold text-rose border border-rose/30 shadow-2xs">
              <Heart className="w-3.5 h-3.5 fill-rose" />
              <span>Wall of love</span>
              <Sparkles className="w-3 h-3 text-rose ml-1" />
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight leading-[1.12]">
              Trusted by job seekers across 6 continents
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:justify-end">
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm">
              From first-time applicants to staff engineers in Lagos, Paris, Tokyo, and Toronto.
            </p>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollTo("left")}
                disabled={!canScrollLeft}
                aria-label="Previous testimonial"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-primary shadow-xs transition-all hover:bg-surface-secondary hover:scale-105 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollTo("right")}
                disabled={!canScrollRight}
                aria-label="Next testimonial"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-primary shadow-xs transition-all hover:bg-surface-secondary hover:scale-105 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Container */}
        <div
          ref={scrollContainerRef}
          className="reveal-init flex gap-5 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-none scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {testimonials.map((item, idx) => (
            <figure
              key={item.id}
              className={`relative shrink-0 w-[290px] sm:w-[320px] md:w-[340px] rounded-[28px] overflow-hidden min-h-[440px] sm:min-h-[480px] flex flex-col justify-between p-6 shadow-md snap-start group transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                activeIndex === idx ? "ring-2 ring-accent/40 shadow-lg scale-[1.01]" : ""
              }`}
            >
              <div className="absolute inset-0 z-0">
                <Image
                  src={item.image}
                  alt={`${item.name}, ${item.role}`}
                  fill
                  sizes="(max-width: 640px) 290px, (max-width: 1024px) 320px, 340px"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-scrim/95 via-scrim/45 to-transparent" />
              </div>

              {/* Location & Star Rating Header */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-scrim/50 px-3 py-1 text-[11px] font-medium text-inverse-foreground backdrop-blur-md border border-inverse-foreground/20">
                  <MapPin className="h-3 w-3 text-accent-light shrink-0" />
                  <span className="truncate">{item.location}</span>
                </div>
                <div className="flex items-center gap-0.5 rounded-full bg-scrim/50 px-2 py-0.5 backdrop-blur-md border border-inverse-foreground/20">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-2.5 w-2.5 fill-amber text-amber" />
                  ))}
                </div>
              </div>

              <figcaption className="relative z-10 space-y-3 text-inverse-foreground">
                <p className="text-sm sm:text-[15px] font-medium leading-relaxed tracking-tight text-inverse-foreground/95">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div className="pt-1 border-t border-inverse-foreground/15 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-inverse-foreground tracking-wide">
                      {item.name}
                    </p>
                    <p className="text-xs text-inverse-foreground/75 font-normal">
                      {item.role}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent-light bg-accent/30 px-2 py-0.5 rounded-md">
                    Verified
                  </span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Indicator dots */}
        <div className="reveal-init flex items-center justify-center gap-2 pt-6">
          {testimonials.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToIndex(idx)}
              aria-label={`Go to testimonial ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === idx
                  ? "w-8 bg-accent"
                  : "w-2 bg-border hover:bg-border-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
