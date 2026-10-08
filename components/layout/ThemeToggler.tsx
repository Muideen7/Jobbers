"use client";

import { Check, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/**
 * Theme preference as an external store (same pattern as the sidebar collapse
 * in AppShell): persisted to localStorage, broadcast on a same-tab custom event
 * plus cross-tab `storage`, and re-evaluated whenever the OS colour scheme
 * changes while "system" is selected. Writing happens in the click handler and
 * the DOM class mutation in an effect — never a cascading render setState.
 */
const THEME_KEY = "jobbers.theme";
const THEME_EVENT = "jobbers:theme";

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readPreference(): ThemePreference {
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function resolve(preference: ThemePreference): ResolvedTheme {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  return prefersDark() ? "dark" : "light";
}

function setPreference(next: ThemePreference) {
  window.localStorage.setItem(THEME_KEY, next);
  window.dispatchEvent(new Event(THEME_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_EVENT, onChange);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_EVENT, onChange);
    media.removeEventListener("change", onChange);
  };
}

function getPreferenceSnapshot(): ThemePreference {
  return readPreference();
}

function getPreferenceServerSnapshot(): ThemePreference {
  return "system";
}

function getResolvedSnapshot(): ResolvedTheme {
  return resolve(readPreference());
}

function getResolvedServerSnapshot(): ResolvedTheme {
  return "light";
}

const OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System default", icon: Monitor },
];

export function ThemeToggler() {
  const preference = useSyncExternalStore(
    subscribe,
    getPreferenceSnapshot,
    getPreferenceServerSnapshot,
  );
  const resolved = useSyncExternalStore(subscribe, getResolvedSnapshot, getResolvedServerSnapshot);
  const [open, setOpen] = useState(false);

  // Keeps the <html> class in sync with the resolved theme — including live OS
  // switches while "system" is selected (the media change re-renders us via the
  // external store; this effect only mutates the DOM, never state).
  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [resolved]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const CurrentIcon = resolved === "dark" ? Moon : Sun;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Theme"
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
      >
        <CurrentIcon className="h-5 w-5" aria-hidden />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            aria-label="Theme"
            className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-border bg-surface p-1 shadow-card"
          >
            <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Theme
            </p>
            {OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = preference === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setPreference(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "text-accent"
                      : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{option.label}</span>
                  {active && <Check className="ml-auto h-4 w-4 shrink-0 text-accent" aria-hidden />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}