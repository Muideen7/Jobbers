export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginCard } from "@/components/auth/LoginCard";
import { getCurrentUser, getPostLoginRedirectPath } from "@/lib/auth";

const SIGNUP_DESCRIPTION =
  "Create your Jobbers account to see your scored roles, research companies and generate tailored resumes.";

export const metadata: Metadata = {
  title: "Create account",
  description: SIGNUP_DESCRIPTION,
  alternates: { canonical: "/signup" },
  openGraph: {
    title: "Create account | Jobbers",
    description: SIGNUP_DESCRIPTION,
    url: "/signup",
  },
  robots: { index: true, follow: true },
};

type SignupPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect(await getPostLoginRedirectPath(user.id));
  }

  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="min-h-screen w-full bg-background">
      <LoginCard error={error} initialMode="signup" />
    </main>
  );
}
