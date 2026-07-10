"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "@/i18n/client";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { StarspinLogo } from "@/components/StarspinLogo";
import { ui } from "@/components/ui/styles";

export function ForgotPasswordForm() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error") === "link_expired";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError(t("auth.forgotError"));
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError(t("auth.forgotError"));
    }

    setLoading(false);
  };

  return (
    <div className="brutal-page flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <StarspinLogo href="/" variant="dark" size="sm" />
            <LocaleSwitcher variant="brutal" />
          </div>

          <div className="brutal-card-lg p-6 sm:p-8">
            <h1 className={ui.h1}>{t("auth.forgotTitle")}</h1>
            <p className={`mt-2 ${ui.muted}`}>{sent ? t("auth.forgotSentBody") : t("auth.forgotSubtitle")}</p>

            {linkError && <p className={`mt-6 ${ui.alertError}`}>{t("auth.resetLinkExpired")}</p>}
            {error && <p className={`mt-6 ${ui.alertError}`}>{error}</p>}
            {sent && <p className={`mt-6 ${ui.alertSuccess}`}>{t("auth.forgotSentTitle")}</p>}

            {!sent && (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <label className={ui.label}>{t("common.email")}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className={ui.input}
                  />
                </div>
                <button type="submit" disabled={loading} className={`w-full ${ui.btnYellow}`}>
                  {loading ? t("common.loading") : t("auth.forgotSubmit")}
                </button>
              </form>
            )}

            <Link href="/login" className="brutal-btn-ghost mt-6 block w-full text-center text-sm">
              {t("auth.backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
