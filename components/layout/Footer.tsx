import Link from "next/link";

import { Logo } from "@/components/layout/Logo";

// This footer renders only on the auth page, so it must not advertise
// routes that require a session — /dashboard, /profile and /find-jobs all
// bounce an anonymous visitor straight back to /login. Privacy/Terms pages
// don't exist yet, and `href="#"` would just ship dead links.
const footerLinks = [{ href: "/", label: "Back to home" }];

export function Footer() {
  return (
    <footer className="border-x border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Logo />

        <nav className="flex flex-wrap items-center gap-5 text-sm font-medium text-text-secondary">
          {footerLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition-colors hover:text-text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
