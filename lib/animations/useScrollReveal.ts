"use client";

import { useEffect, useRef, useState } from "react";

type ScrollRevealOptions = {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  staggerChildren?: boolean;
  staggerMs?: number;
};

/**
 * useScrollReveal hook
 *
 * Automatically tracks when an element enters the viewport using IntersectionObserver.
 * Also supports automatically finding child elements marked with `.reveal-init` and applying
 * staggered `.reveal-in` classes.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {},
) {
  const {
    threshold = 0.15,
    rootMargin = "0px 0px -40px 0px",
    triggerOnce = true,
    staggerChildren = true,
    staggerMs = 90,
  } = options;

  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);

            if (staggerChildren) {
              const children = element.querySelectorAll<HTMLElement>(".reveal-init, .reveal-scale-init");
              children.forEach((child, index) => {
                child.style.transitionDelay = `${index * staggerMs}ms`;
                child.classList.add("reveal-in");
              });
            }

            if (triggerOnce) {
              observer.unobserve(element);
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
            if (staggerChildren) {
              const children = element.querySelectorAll<HTMLElement>(".reveal-init, .reveal-scale-init");
              children.forEach((child) => {
                child.classList.remove("reveal-in");
              });
            }
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, staggerChildren, staggerMs]);

  return { ref, isVisible };
}
