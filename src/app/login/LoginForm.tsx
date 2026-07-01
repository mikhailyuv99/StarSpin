"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/i18n/client";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ui } from "@/components/ui/styles";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (isSignup) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/setup`,
        },
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage(t("login.verifyEmail"));
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      } else {
        router.push(redirect);
        router.refresh();
      }
    }

    setLoading(false);
  };

  return (
    <div className="brutal-page flex min-h-screen flex-col lg:flex-row">
      <div className="marketing-grid hidden flex-1 flex-col justify-between border-r-[2.5px] border-black bg-[var(--c-lavender)] p-10 lg:flex">
        <Link href="/" className="brutal-logo text-2xl">
          {t("common.brand").toUpperCase().replace(/\s/g, "")}
        </Link>
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
            <Link href="/" className="brutal-logo brutal-logo-dark !text-lg">
              {t("common.brand").toUpperCase().replace(/\s/g, "")}
            </Link>
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

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
                <label className={ui.label}>{t("common.password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={ui.input}
                />
              </div>
              <button type="submit" disabled={loading} className={`w-full ${ui.btnYellow}`}>
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
  );
}
