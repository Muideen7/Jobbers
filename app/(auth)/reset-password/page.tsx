export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordCard } from "./ResetPasswordCard";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your Jobbers account password.",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{
    token?: string | string[];
    error?: string | string[];
  }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="min-h-screen w-full bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Suspense fallback={<div className="text-text-muted text-sm">Loading...</div>}>
        <ResetPasswordCard initialToken={token} initialError={error} />
      </Suspense>
    </main>
  );
}
