"use client";

import { useState } from "react";
import { useTranslations } from "@/i18n/client";
import { ui } from "@/components/ui/styles";
import { isValidPassword, passwordsMatch } from "@/lib/auth-password";

export function AccountPasswordForm({
  email,
  hasEmailPassword,
}: {
  email: string;
  hasEmailPassword: boolean;
}) {
  const t = useTranslations();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const sendResetEmail = async () => {
    setResetLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError(t("auth.forgotError"));
      } else {
        setMessage(t("auth.accountResetSent"));
      }
    } catch {
      setError(t("auth.forgotError"));
    }

    setResetLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!isValidPassword(newPassword)) {
      setError(t("auth.passwordTooShort"));
      return;
    }

    if (!passwordsMatch(newPassword, confirmPassword)) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = (await res.json()) as { error?: string };

    if (!res.ok) {
      if (data.error === "wrong_password") {
        setError(t("auth.wrongCurrentPassword"));
      } else if (data.error === "oauth_only") {
        setError(t("auth.oauthOnlyPassword"));
      } else {
        setError(t("auth.changeError"));
      }
      setLoading(false);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage(t("auth.passwordChanged"));
    setLoading(false);
  };

  return (
    <div className={`${ui.card} space-y-6`}>
      <div>
        <h2 className={ui.h2}>{t("auth.accountPasswordTitle")}</h2>
        <p className={`mt-1 ${ui.muted}`}>{t("auth.accountPasswordSubtitle")}</p>
      </div>

      <div>
        <label className={ui.label}>{t("common.email")}</label>
        <p className="mt-1 font-mono text-sm font-semibold text-ink">{email}</p>
      </div>

      {error && <p className={ui.alertError}>{error}</p>}
      {message && <p className={ui.alertSuccess}>{message}</p>}

      {hasEmailPassword ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={ui.label}>{t("auth.currentPassword")}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={ui.input}
            />
          </div>
          <div>
            <label className={ui.label}>{t("auth.newPassword")}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className={ui.input}
            />
          </div>
          <button type="submit" disabled={loading} className={ui.btnYellow}>
            {loading ? t("common.loading") : t("auth.changePassword")}
          </button>
        </form>
      ) : (
        <p className={`text-sm font-medium ${ui.muted}`}>{t("auth.oauthOnlyHint")}</p>
      )}

      <div className="border-t-2 border-black pt-6">
        <p className="text-sm font-medium text-muted">{t("auth.resetEmailHint")}</p>
        <button
          type="button"
          onClick={sendResetEmail}
          disabled={resetLoading}
          className={`mt-3 ${ui.btnOutline}`}
        >
          {resetLoading ? t("common.loading") : t("auth.sendResetEmail")}
        </button>
      </div>
    </div>
  );
}
