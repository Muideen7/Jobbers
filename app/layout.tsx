import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";

import "./globals.css";

const monaSans = Mona_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Jobbers scores every open role against your profile, researches the company, and tailors your application — so you only read the ones worth your time.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Jobbers — AI Job Matching, Company Research & Tailored Resumes",
    template: "%s | Jobbers",
  },
  description: DESCRIPTION,
  applicationName: "Jobbers",
  keywords: [
    "job matching",
    "AI job search",
    "resume tailoring",
    "company research",
    "job search automation",
    "tech jobs",
  ],
  authors: [{ name: "Jobbers" }],
  creator: "Jobbers",
  openGraph: {
    type: "website",
    siteName: "Jobbers",
    title: "Jobbers — the AI job-matching agent",
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jobbers — the AI job-matching agent",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // NOTE: deliberately no `alternates.canonical` here. A root-layout canonical
  // is inherited by every route, which would declare /login, /dashboard,
  // /profile and /find-jobs as duplicates of the homepage. Each page sets its
  // own canonical, and authenticated pages opt out of indexing entirely.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${monaSans.variable} h-full antialiased`}>
      <body
        className="flex min-h-full flex-col bg-background"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
