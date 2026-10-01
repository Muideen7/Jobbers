import Link from "next/link";

import { JobbersIcon } from "@/components/homepage/Logos";

type Props = {
  href?: string;
};

export function Logo({ href = "/" }: Props) {
  return (
    <Link href={href} aria-label="Jobbers home" className="inline-flex items-center gap-2.5">
      <span className="flex text-text-primary">
        <JobbersIcon className="h-6 w-6" />
      </span>
      <span className="text-xl font-bold tracking-tight text-text-primary">Jobbers</span>
    </Link>
  );
}
