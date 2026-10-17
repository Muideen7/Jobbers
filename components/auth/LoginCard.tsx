"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  Star,
  AlertCircle,
  Check,
} from "lucide-react";

import { CompanyLogo, JobbersIcon } from "@/components/homepage/Logos";
import { authClient } from "@/lib/authClient";

type AuthMode = "signin" | "signup" | "forgot";

type Props = {
  error?: string | undefined;
  initialMode?: "signin" | "signup" | "forgot";
};

const URL_ERROR_MESSAGES: Record<string, string> = {
  callback: "Authentication failed during callback. Please try again.",
  oauth: "OAuth sign-in could not be completed. Please check your credentials.",
  provider: "That authentication provider is currently unavailable.",
};

export function LoginCard({ error, initialMode = "signin" }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    error ? URL_ERROR_MESSAGES[error] || "An authentication error occurred." : null,
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
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (mode === "forgot") {
        if (!cleanEmail) {
          setErrorMessage("Please enter your email address.");
          setIsLoading(false);
          return;
        }

        const res = await authClient.requestPasswordReset({
          email: cleanEmail,
          redirectTo: "/reset-password",
        });

        if (res.error) {
          setErrorMessage(
            res.error.message || "Could not send reset link. Please check your email and try again.",
          );
          setIsLoading(false);
          return;
        }

        setSuccessMessage("Password reset email sent! Please check your inbox for instructions.");
        setIsLoading(false);
        return;
      }

      if (mode === "signin") {
        if (password.length < 8) {
          setErrorMessage("Password must be at least 8 characters.");
          setIsLoading(false);
          return;
        }

        const res = await authClient.signIn.email({
          email: cleanEmail,
          password,
          callbackURL: "/home",
        });

        if (res.error) {
          setErrorMessage(
            res.error.message || "Invalid email or password. Please check and try again.",
          );
          setIsLoading(false);
          return;
        }

        router.push("/home");
        router.refresh();
      } else {
        if (!name.trim()) {
          setErrorMessage("Please enter your name.");
          setIsLoading(false);
          return;
        }

        if (!hasMinLength) {
          setErrorMessage("Password must be at least 8 characters.");
          setIsLoading(false);
          return;
        }

        if (!hasUppercase || !hasLowercase || !hasNumberOrSpecial) {
          setErrorMessage("Password must contain uppercase, lowercase, and a number or symbol.");
          setIsLoading(false);
          return;
        }

        const res = await authClient.signUp.email({
          name: name.trim(),
          email: cleanEmail,
          password,
          callbackURL: "/home",
        });

        if (res.error) {
          setErrorMessage(
            res.error.message || "Could not create account. Email may already be in use.",
          );
          setIsLoading(false);
          return;
        }

        // Trigger welcome email via dedicated endpoint
        try {
          fetch("/api/email/welcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanEmail, name: name.trim() }),
          }).catch((err) => console.error("Welcome email failed", err));
        } catch {
          // non-blocking
        }

        router.push("/home");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setErrorMessage(msg);
      setIsLoading(false);
    }
  }

  async function handleSocialSignIn(provider: "google" | "github") {
    setErrorMessage(null);
    setSocialLoading(provider);

    try {
      const res = await authClient.signIn.social({
        provider,
        callbackURL: "/home",
      });

      if (res.error) {
        setErrorMessage(
          res.error.message ||
            `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in could not be started. Check that OAuth keys are configured.`,
        );
        setSocialLoading(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to connect with ${provider}. Please try email instead.`;
      setErrorMessage(msg);
      setSocialLoading(null);
    }
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background text-text-primary">
      {/* ========================================================
          LEFT SCREEN: AUTHENTICATION (Sign In & Sign Up)
          ======================================================== */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-14 min-h-screen w-full max-w-xl mx-auto lg:max-w-none">
        {/* Top Header */}
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-text-primary hover:opacity-90 transition-opacity"
            aria-label="Jobbers Home"
          >
            <span className="text-text-primary flex">
              <JobbersIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </span>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-text-primary">
              Jobbers
            </span>
          </Link>
        </div>

        {/* Center Auth Container */}
        <div className="my-auto py-8 sm:py-10 max-w-md w-full mx-auto">
          {/* Mode Switcher with Sliding Pill Animation */}
          {mode === "forgot" ? (
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors mb-6 cursor-pointer"
            >
              ← Back to sign in
            </button>
          ) : (
            <div className="relative flex p-1 rounded-xl bg-surface-secondary border border-border-muted/50 mb-7 select-none">
              {/* Sliding Pill Indicator */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-surface shadow-xs border border-border/80 transition-transform duration-300 ease-out ${
                  mode === "signin" ? "translate-x-0" : "translate-x-full"
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`relative z-10 flex-1 py-2 text-xs sm:text-sm font-semibold text-center transition-colors duration-200 cursor-pointer ${
                  mode === "signin"
                    ? "text-text-primary font-bold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`relative z-10 flex-1 py-2 text-xs sm:text-sm font-semibold text-center transition-colors duration-200 cursor-pointer ${
                  mode === "signup"
                    ? "text-text-primary font-bold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Create account
              </button>
            </div>
          )}

          {/* Form Header */}
          <div className="space-y-1.5 mb-6 text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              {mode === "signin"
                ? "Welcome back"
                : mode === "signup"
                  ? "Join Jobbers"
                  : "Reset password"}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary">
              {mode === "signin"
                ? "Enter your credentials to access your matched roles & dossiers."
                : mode === "signup"
                  ? "Create an account to start scoring open roles and landing interviews."
                  : "Enter your account email to receive a secure link to reset your password."}
            </p>
          </div>

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-6 rounded-xl border border-success/30 bg-success/10 p-3.5 flex items-start gap-2.5 text-xs font-medium text-success">
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 flex items-start gap-2.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label htmlFor="auth-name" className="block text-xs font-semibold text-text-strong">
                  Full name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="auth-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="block text-xs font-semibold text-text-strong">
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="auth-password" className="block text-xs font-semibold text-text-strong">
                    Password
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[11px] text-text-muted hover:text-accent cursor-pointer transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "At least 8 characters" : "•••••••• (min 8 characters)"}
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

                {mode === "signup" && password.length > 0 && (
                  <div className="pt-1.5 space-y-1">
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      <div className={`flex items-center gap-1 ${hasMinLength ? "text-success font-medium" : "text-text-muted"}`}>
                        <Check className={`h-3 w-3 ${hasMinLength ? "opacity-100" : "opacity-30"}`} />
                        <span>8+ chars</span>
                      </div>
                      <div className={`flex items-center gap-1 ${hasUppercase && hasLowercase ? "text-success font-medium" : "text-text-muted"}`}>
                        <Check className={`h-3 w-3 ${hasUppercase && hasLowercase ? "opacity-100" : "opacity-30"}`} />
                        <span>A-z letters</span>
                      </div>
                      <div className={`flex items-center gap-1 ${hasNumberOrSpecial ? "text-success font-medium" : "text-text-muted"}`}>
                        <Check className={`h-3 w-3 ${hasNumberOrSpecial ? "opacity-100" : "opacity-30"}`} />
                        <span>123 / symbol</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-accent-foreground py-3 px-5 text-sm font-bold shadow-sm hover:bg-ink-hover active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {mode === "signin"
                      ? "Signing in..."
                      : mode === "signup"
                        ? "Creating account..."
                        : "Sending reset link..."}
                  </span>
                </>
              ) : (
                <span>
                  {mode === "signin"
                    ? "Sign in with Email"
                    : mode === "signup"
                      ? "Create Account"
                      : "Send Reset Link"}
                </span>
              )}
            </button>
          </form>

          {/* Social OAuth Buttons or Back to Login */}
          {mode === "forgot" ? (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Remember your password? Sign in
              </button>
            </div>
          ) : (
            <>
              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border-light" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  or continue with
                </span>
                <div className="h-px flex-1 bg-border-light" />
              </div>

              {/* Social OAuth Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={socialLoading !== null}
                  onClick={() => handleSocialSignIn("google")}
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs sm:text-sm font-semibold text-text-primary shadow-2xs hover:bg-surface-secondary hover:border-border-muted transition-all disabled:opacity-60 cursor-pointer"
                >
                  {socialLoading === "google" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  ) : (
                    <CompanyLogo type="google" className="h-4 w-4 shrink-0" />
                  )}
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  disabled={socialLoading !== null}
                  onClick={() => handleSocialSignIn("github")}
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs sm:text-sm font-semibold text-text-primary shadow-2xs hover:bg-surface-secondary hover:border-border-muted transition-all disabled:opacity-60 cursor-pointer"
                >
                  {socialLoading === "github" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  ) : (
                    <CompanyLogo type="github" className="h-4 w-4 shrink-0" />
                  )}
                  <span>GitHub</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Bottom Legal / Terms */}
        <p className="text-center text-[11px] text-text-muted pt-4">
          By signing in or creating an account, you agree to our{" "}
          <Link href="/terms" className="text-text-primary hover:underline font-medium">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-text-primary hover:underline font-medium">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {/* ========================================================
          RIGHT SCREEN: EDITORIAL SHOWCASE (Real Photo & Match Card)
          ======================================================== */}
      <div className="hidden lg:flex relative overflow-hidden bg-surface-secondary/50 border-l border-border/70 flex-col justify-between p-12 xl:p-16">
        {/* Ambient Glows */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-40 blur-3xl"
          style={{ backgroundColor: "var(--color-pastel-blue)" }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: "var(--color-pastel-pink)" }}
          aria-hidden="true"
        />

        {/* Center Hero Visual: Real Editorial Photo */}
        <div className="relative z-10 my-auto py-6">
          <div className="relative mx-auto w-full max-w-lg">
            {/* Real Editorial Image Container */}
            <div className="relative h-[420px] xl:h-[480px] w-full overflow-hidden rounded-[28px] border border-border shadow-lg">
              <Image
                src="/landing/testimonial_amara.jpg"
                alt="Amara Okafor, Senior Frontend Architect"
                fill
                priority
                sizes="(max-width: 1280px) 50vw, 600px"
                className="object-cover object-top contrast-[1.02]"
              />
              {/* Subtle Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />

              {/* Inset Candidate Label */}
              <div className="absolute bottom-6 left-6 right-6 text-accent-foreground">
                <p className="text-lg font-bold tracking-tight">Amara Okafor</p>
                <p className="text-xs text-accent-foreground/85 font-normal mt-0.5">
                  Senior Frontend Architect · Lagos, Nigeria
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial & Rating */}
        <div className="relative z-10 pt-4 border-t border-border-light/80">
          <blockquote className="text-sm font-semibold text-text-primary leading-relaxed">
            &ldquo;Jobbers flagged that my profile was missing Docker experience for a high-match role.
            I tailored my resume before applying and received a direct screening callback within 48 hours.&rdquo;
          </blockquote>

          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <span className="font-bold text-text-primary">5.0</span>
              <div className="flex items-center text-amber">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-current" />
                ))}
              </div>
              <span className="text-text-muted">· Verified Candidate</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-medium text-text-secondary">
              <span>Zero Spam</span>
              <span>·</span>
              <span>Direct Applications</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
