"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, Check } from "lucide-react";
import { JobbersIcon } from "@/components/homepage/Logos";
import { authClient } from "@/lib/authClient";

type Props = {
  initialToken?: string | undefined;
  initialError?: string | undefined;
};

export function ResetPasswordCard({ initialToken, initialError }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialError || (!initialToken ? "Invalid or missing password reset link." : null),
  );

  const { hasMinLength, hasUppercase, hasLowercase, hasNumberOrSpecial } = useMemo(() => {
    return {
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumberOrSpecial: /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  }, [password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!initialToken) {
      setErrorMessage("No reset token found. Please request a new password reset email.");
      return;
    }

    if (!hasMinLength) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (!hasUppercase || !hasLowercase || !hasNumberOrSpecial) {
      setErrorMessage("Password must contain uppercase, lowercase, and a number or symbol.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await authClient.resetPassword({
        newPassword: password,
        token: initialToken,
      });

      if (res.error) {
        setErrorMessage(res.error.message || "Failed to reset password. The link may have expired.");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setIsLoading(false);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2.5 mb-6">
        <span className="text-text-primary flex">
          <JobbersIcon className="w-6 h-6 sm:w-7 sm:h-7" />
        </span>
        <span className="text-lg sm:text-xl font-bold tracking-tight text-text-primary">
          Jobbers
        </span>
      </div>

      <div className="space-y-1.5 mb-6 text-left">
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
          Set new password
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary">
          Choose a strong password with at least 8 characters.
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-success/30 bg-success/10 p-4 flex items-start gap-3 text-xs font-medium text-success">
            <Check className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              Your password has been successfully reset! Redirecting to sign in...
            </div>
          </div>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center rounded-xl bg-ink text-accent-foreground py-2.5 px-4 text-xs font-bold hover:bg-ink-hover transition-colors"
          >
            Sign in now
          </Link>
        </div>
      ) : (
        <>
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 flex items-start gap-2.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {!initialToken ? (
            <div className="space-y-4 pt-2">
              <p className="text-xs text-text-secondary">
                This password reset link is invalid or has expired. Please request a new one from the sign in page.
              </p>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center rounded-xl bg-ink text-accent-foreground py-2.5 px-4 text-xs font-bold hover:bg-ink-hover transition-colors"
              >
                Back to Sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="new-password"
                  className="block text-xs font-semibold text-text-strong"
                >
                  New password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="new-password"
                    name="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border bg-surface pl-10 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {password.length > 0 && (
                  <div className="pt-1.5 space-y-1">
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      <div
                        className={`flex items-center gap-1 ${hasMinLength ? "text-success font-medium" : "text-text-muted"}`}
                      >
                        <Check
                          className={`h-3 w-3 ${hasMinLength ? "opacity-100" : "opacity-30"}`}
                        />
                        <span>8+ chars</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${hasUppercase && hasLowercase ? "text-success font-medium" : "text-text-muted"}`}
                      >
                        <Check
                          className={`h-3 w-3 ${hasUppercase && hasLowercase ? "opacity-100" : "opacity-30"}`}
                        />
                        <span>A-z letters</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${hasNumberOrSpecial ? "text-success font-medium" : "text-text-muted"}`}
                      >
                        <Check
                          className={`h-3 w-3 ${hasNumberOrSpecial ? "opacity-100" : "opacity-30"}`}
                        />
                        <span>123 / symbol</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-semibold text-text-strong"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-accent-foreground py-3 px-5 text-sm font-bold shadow-sm hover:bg-ink-hover active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Resetting password...</span>
                  </>
                ) : (
                  <span>Reset password</span>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel and return to sign in
                </Link>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
