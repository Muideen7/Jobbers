"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useTransition } from "react";

function NavigationProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [, startTransition] = useTransition();

  const startProgress = (targetHref?: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    setIsVisible(true);
    setProgress(20);

    if (typeof window !== "undefined" && targetHref) {
      window.dispatchEvent(
        new CustomEvent("jobbers-navigation-pending", { detail: { href: targetHref, pending: true } }),
      );
    }

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 65) return prev + Math.random() * 14 + 6;
        if (prev < 88) return prev + Math.random() * 4 + 1;
        return prev;
      });
    }, 180);
  };

  const completeProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("jobbers-navigation-pending", { detail: { pending: false } }),
      );
    }

    fadeTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 280);
  };

  // Complete progress whenever the route or search parameters finish changing
  useEffect(() => {
    completeProgress();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [pathname, searchParams]);

  // Intercept internal link clicks for immediate feedback
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Ignore modified clicks (cmd, ctrl, shift, alt) or non-primary clicks
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore hash links, external links, mailto, tel, downloads, or target="_blank"
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank" ||
        target.hasAttribute("download")
      ) {
        return;
      }

      // Check origin
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;

        // If clicking exactly the current URL, don't show loading
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return;
        }

        startTransition(() => {
          startProgress(url.pathname + url.search);
        });
      } catch {
        // Fallback: ignore invalid URLs
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 right-0 z-[9999] h-[3px] w-full overflow-hidden transition-opacity duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {/* Background track subtle tint */}
      <div className="absolute inset-0 bg-accent/15" />

      {/* Main glowing progress bar */}
      <div
        className="relative h-full bg-accent transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      >
        {/* Glow head */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2.5 w-24 rounded-full bg-violet-glow blur-xs shadow-[0_0_12px_var(--color-accent)]" />
      </div>
    </div>
  );
}

/**
 * Global Navigation Progress Bar
 *
 * Wrapped in Suspense to satisfy Next.js CSR bailout requirements during
 * static page generation (e.g. /_not-found, /404).
 */
export function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBarInner />
    </Suspense>
  );
}
