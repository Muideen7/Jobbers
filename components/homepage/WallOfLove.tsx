"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Heart, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

import { testimonials } from "@/components/homepage/data";

const AUTO_SCROLL_INTERVAL_MS = 4500;

export function WallOfLove() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

    // Compute approximate active card index
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 20 // 20px gap
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

  // Keyboard navigation when user is focused on or hovering the section
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

  // Auto-scroll loop
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      const el = scrollContainerRef.current;
      if (!el) return;

      const { scrollLeft, scrollWidth, clientWidth } = el;
      if (scrollLeft >= scrollWidth - clientWidth - 20) {
        // Rewind to beginning
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollTo("right");
      }
    }, AUTO_SCROLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isPaused, scrollTo]);

  // Track scroll position for arrow disabled states
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
      className="w-full py-14 md:py-24 overflow-hidden"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      aria-label="Testimonials Wall of Love"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-soft text-xs font-semibold text-rose border border-rose/30 shadow-2xs">
              <Heart className="w-3.5 h-3.5 fill-rose" />
              <span>Wall of love</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight leading-[1.12]">
              Trusted by job seekers
              <br />
              across 6 continents
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
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-primary shadow-xs transition-all hover:bg-surface-secondary active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollTo("right")}
                disabled={!canScrollRight}
                aria-label="Next testimonial"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-primary shadow-xs transition-all hover:bg-surface-secondary active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {testimonials.map((item) => (
            <figure
              key={item.id}
              className="relative shrink-0 w-[290px] sm:w-[320px] md:w-[340px] rounded-[28px] overflow-hidden min-h-[440px] sm:min-h-[480px] flex flex-col justify-end p-6 shadow-md snap-start group transition-transform duration-300 hover:-translate-y-1.5"
            >
              <div className="absolute inset-0 z-0">
                <Image
                  src={item.image}
                  alt={`${item.name}, ${item.role}`}
                  fill
                  sizes="(max-width: 640px) 290px, (max-width: 1024px) 320px, 340px"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-scrim/90 via-scrim/40 to-transparent" />
              </div>

              {/* Location Badge */}
              <div className="absolute top-5 left-5 z-10 inline-flex items-center gap-1.5 rounded-full bg-scrim/40 px-3 py-1 text-[11px] font-medium text-inverse-foreground backdrop-blur-md border border-inverse-foreground/20">
                <MapPin className="h-3 w-3 text-accent-light shrink-0" />
                <span className="truncate">{item.location}</span>
              </div>

              <figcaption className="relative z-10 space-y-3 text-inverse-foreground">
                <p className="text-sm sm:text-[15px] font-medium leading-relaxed tracking-tight text-inverse-foreground/95">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold text-inverse-foreground tracking-wide">
                    {item.name}
                  </p>
                  <p className="text-xs text-inverse-foreground/75 font-normal">
                    {item.role}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Indicator dots */}
        <div className="flex items-center justify-center gap-2 pt-6">
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
