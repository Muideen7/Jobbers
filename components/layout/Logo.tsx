import Link from "next/link";
import type { MouseEventHandler } from "react";

import { JobbersIcon } from "@/components/homepage/Logos";

type Props = {
  href?: string;
  /**
   * Logo renders its own <a>, so callers that also need a side effect (the
   * mobile drawer closing on navigate) pass it here rather than wrapping the
   * component in a second <Link> — a nested anchor is invalid HTML and makes
   * React fail hydration.
   */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function Logo({ href = "/", onClick }: Props) {
  return (
    <Link
      href={href}
      // Conditional spread: `exactOptionalPropertyTypes` rejects an explicit
      // `undefined` on Next's LinkProps, and this component has no optional
      // prop to forward half the time.
      {...(onClick ? { onClick } : {})}
      aria-label="Jobbers home"
      className="inline-flex items-center gap-2.5"
    >
      <span className="flex text-text-primary">
        <JobbersIcon className="h-6 w-6" />
      </span>
      <span className="text-xl font-bold tracking-tight text-text-primary">Jobbers</span>
    </Link>
  );
}
