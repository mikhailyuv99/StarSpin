"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/i18n/client";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { StarspinLogo } from "@/components/StarspinLogo";
import { ui } from "@/components/ui/styles";
import type { BillingPlan } from "@/lib/billing";
import { isBillingPlan } from "@/lib/billing";

function OAuthIcon({ provider }: { provider: "google" | "apple" }) {
  if (provider === "google") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const planParam = searchParams.get("plan");
  const signupMode = searchParams.get("mode") === "signup";
  const postAuthPath =
    planParam && isBillingPlan(planParam)
      ? `/subscribe/checkout?plan=${planParam as BillingPlan}`
      : redirect;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(signupMode);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsSignup(searchParams.get("mode") === "signup");
  }, [searchParams]);

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    setError(null);

    const supabase = createClient();
    const next = isSignup ? "/setup" : postAuthPath;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (oauthError) {
      setError(t("login.oauthError"));
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (isSignup) {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        if (data.error === "email_taken") {
          setError(t("login.emailTaken"));
        } else if (data.error === "invalid_credentials") {
          setError(t("login.invalidCredentials"));
        } else {
          setError(t("login.signupError"));
        }
        setLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      } else {
        router.push("/setup");
        router.refresh();
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      } else {
        router.push(postAuthPath);
        router.refresh();
      }
    }

    setLoading(false);
  };

  return (
    <div className="brutal-page flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col lg:flex-row">
      <div className="marketing-grid hidden flex-1 flex-col justify-between border-r-[2.5px] border-black bg-[var(--c-lavender)] p-10 lg:flex">
        <StarspinLogo href="/" variant="light" size="lg" />
        <div className="brutal-card-lg max-w-md p-8">
          <p className="section-label text-muted">{t("login.merchantSpace")}</p>
          <p className="mt-4 font-[family-name:var(--font-display)] text-2xl font-extrabold uppercase leading-snug">
            {t("login.tagline")}
          </p>
        </div>
        <p className="font-mono text-xs font-semibold text-muted">{t("login.location")}</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <StarspinLogo href="/" variant="dark" size="sm" />
            <LocaleSwitcher variant="brutal" />
          </div>
          <div className="brutal-card-lg p-6 sm:p-8">
            <div className="mb-6 hidden lg:flex lg:justify-end">
              <LocaleSwitcher variant="brutal" />
            </div>
            <h1 className={ui.h1}>{isSignup ? t("login.signupTitle") : t("login.signinTitle")}</h1>
            <p className={`mt-2 ${ui.muted}`}>
              {isSignup ? t("login.signupSubtitle") : t("login.signinSubtitle")}
            </p>

            {error && <p className={`mt-6 ${ui.alertError}`}>{error}</p>}
            {message && <p className={`mt-6 ${ui.alertSuccess}`}>{message}</p>}

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={oauthLoading !== null}
                className="brutal-oauth-btn w-full"
              >
                <OAuthIcon provider="google" />
                <span>{oauthLoading === "google" ? t("common.loading") : t("login.continueGoogle")}</span>
              </button>
              <button
                type="button"
                onClick={() => handleOAuth("apple")}
                disabled={oauthLoading !== null}
                className="brutal-oauth-btn w-full"
              >
                <OAuthIcon provider="apple" />
                <span>{oauthLoading === "apple" ? t("common.loading") : t("login.continueApple")}</span>
              </button>
            </div>

            <div className="brutal-divider my-6">
              <span>{t("login.orContinueWith")}</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={ui.label}>{t("common.email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={ui.input}
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className={ui.label}>{t("common.password")}</label>
                  {!isSignup && (
                    <Link href="/login/forgot-password" className="text-xs font-bold text-ink underline">
                      {t("auth.forgotLink")}
                    </Link>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className={ui.input}
                />
              </div>
              <button type="submit" disabled={loading || oauthLoading !== null} className={`w-full ${ui.btnYellow}`}>
                {loading
                  ? t("common.loading")
                  : isSignup
                    ? t("login.createAccount")
                    : t("login.signIn")}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="brutal-btn-ghost mt-6 w-full text-center text-sm"
            >
              {isSignup ? t("login.toggleSignup") : t("login.toggleSignin")}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
