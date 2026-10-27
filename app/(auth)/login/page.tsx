export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginCard } from "@/components/auth/LoginCard";
import { getCurrentUser, getPostLoginRedirectPath } from "@/lib/auth";

const LOGIN_DESCRIPTION =
  "Sign in to Jobbers to see your scored roles, research companies and generate tailored resumes.";

export const metadata: Metadata = {
  title: "Sign in",
  description: LOGIN_DESCRIPTION,
  alternates: { canonical: "/login" },
  openGraph: {
    title: "Sign in | Jobbers",
    description: LOGIN_DESCRIPTION,
    url: "/login",
  },
  robots: { index: true, follow: true },
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    mode?: string | string[];
    deleted?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect(await getPostLoginRedirectPath(user.id));
  }

  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const rawMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const deleted = Array.isArray(params.deleted) ? params.deleted[0] === "1" : params.deleted === "1";
  const initialMode = rawMode === "signup" ? "signup" : "signin";

  return (
    <main className="min-h-screen w-full bg-background">
      <LoginCard error={error} initialMode={initialMode} deleted={deleted} />
    </main>
  );
}
