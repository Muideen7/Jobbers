import type { MetadataRoute } from "next";

/** Absolute origin, no trailing slash. Falls back to local dev. */
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        // Signed-in routes render personal data. Disallow them so crawlers
        // never fetch a page that 307s to /login, and keep them out of the
        // index without relying on the per-page `noindex` meta tag alone.
        disallow: ["/api/", "/home", "/jobs", "/applications", "/resumes", "/profile"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
