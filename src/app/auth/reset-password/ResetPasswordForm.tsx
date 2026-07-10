"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "@/i18n/client";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { StarspinLogo } from "@/components/StarspinLogo";
import { ui } from "@/components/ui/styles";
import { isValidPassword, passwordsMatch } from "@/lib/auth-password";

export function ResetPasswordForm() {
  const t = useTranslations();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidPassword(password)) {
      setError(t("auth.passwordTooShort"));
      return;
    }

    if (!passwordsMatch(password, confirm)) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(t("auth.resetError"));
      setLoading(false);
      return;
    }

    router.push("/dashboard?password_updated=1");
    router.refresh();
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
            <h1 className={ui.h1}>{t("auth.resetTitle")}</h1>
            <p className={`mt-2 ${ui.muted}`}>{t("auth.resetSubtitle")}</p>

            {error && <p className={`mt-6 ${ui.alertError}`}>{error}</p>}

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className={ui.label}>{t("auth.newPassword")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={ui.input}
                />
              </div>
              <div>
                <label className={ui.label}>{t("auth.confirmPassword")}</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={ui.input}
                />
              </div>
              <button type="submit" disabled={loading} className={`w-full ${ui.btnYellow}`}>
                {loading ? t("common.loading") : t("auth.resetSubmit")}
              </button>
            </form>

            <Link href="/login" className="brutal-btn-ghost mt-6 block w-full text-center text-sm">
              {t("auth.backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
