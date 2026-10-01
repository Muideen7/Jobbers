import type { Metadata } from "next";

/**
 * Metadata for signed-in routes.
 *
 * These pages render personal data (scores, saved jobs, the user's resume and
 * profile) and are behind auth. They must never appear in a search index, must
 * not be linked as canonicals, and must not leak through the inherited root
 * `og:image`. `noindex` also stops crawlers from wasting budget on redirects to
 * /login.
 */
export function privateMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: null },
    openGraph: {
      title: `${title} | Jobbers`,
      description,
      url: undefined,
    },
  };
}
