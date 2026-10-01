import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginCard } from "@/components/auth/LoginCard";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
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
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect(await getPostLoginRedirectPath(user.id));
  }

  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <>
      <Navbar />
      <main>
        <LoginCard error={error} />
      </main>
      <div className="px-4 sm:px-6 lg:px-8">
        <Footer />
      </div>
    </>
  );
}
