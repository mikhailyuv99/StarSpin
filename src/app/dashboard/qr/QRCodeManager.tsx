"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { publicMerchantPath, publicMerchantUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/client";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";
import type { Merchant } from "@/lib/types";

function normalizeHex(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed}`;
  return fallback;
}

export function QRCodeManager({ merchant }: { merchant: Merchant }) {
  const t = useTranslations();
  const router = useRouter();
  const [fgColor, setFgColor] = useState(merchant.qr_fg_color ?? "#0a0a0a");
  const [bgColor, setBgColor] = useState(merchant.qr_bg_color ?? "#ffffff");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${publicMerchantPath(merchant.slug)}`
      : publicMerchantUrl(merchant.slug);

  const previewUrl = useMemo(() => {
    const params = new URLSearchParams({
      fg: normalizeHex(fgColor, "#0a0a0a"),
      bg: normalizeHex(bgColor, "#ffffff"),
    });
    return `/api/qr/${merchant.slug}?${params.toString()}`;
  }, [merchant.slug, fgColor, bgColor]);

  const downloadUrl = previewUrl;

  const applyBrandColors = () => {
    setFgColor(merchant.primary_color);
    setBgColor("#ffffff");
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("merchants")
      .update({
        qr_fg_color: normalizeHex(fgColor, "#0a0a0a"),
        qr_bg_color: normalizeHex(bgColor, "#ffffff"),
      })
      .eq("id", merchant.id);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage(t("common.saved"));
    router.refresh();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <div className={`${ui.card} max-w-sm`}>
        <img
          key={previewUrl}
          src={previewUrl}
          alt={`QR ${merchant.slug}`}
          className="w-full rounded-[14px] border-2 border-black bg-white p-2"
        />
        <p className="mt-4 text-center font-mono text-xs text-muted">{displayUrl}</p>
        <a
          href={downloadUrl}
          download={`qr-${merchant.slug}.png`}
          className={`mt-6 block w-full text-center ${ui.btn}`}
        >
          {t("dashboard.downloadPng")}
        </a>
      </div>

      <form onSubmit={handleSave} className={`${ui.card} max-w-xl space-y-5`}>
        <div>
          <h2 className={ui.h2}>{t("dashboard.qrCustomizeTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("dashboard.qrCustomizeSubtitle")}</p>
        </div>

        {message && <p className={ui.alertSuccess}>{message}</p>}
        {error && <p className={ui.alertError}>{error}</p>}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={ui.label}>{t("dashboard.qrForeground")}</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={normalizeHex(fgColor, "#0a0a0a")}
                onChange={(e) => setFgColor(e.target.value)}
                className="h-12 w-full min-w-0 flex-1 cursor-pointer rounded-[14px] border-2 border-black bg-white p-1"
              />
              <input
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className={`${ui.input} max-w-[7rem] font-mono text-xs`}
                spellCheck={false}
              />
            </div>
          </div>
          <div>
            <label className={ui.label}>{t("dashboard.qrBackground")}</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={normalizeHex(bgColor, "#ffffff")}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-12 w-full min-w-0 flex-1 cursor-pointer rounded-[14px] border-2 border-black bg-white p-1"
              />
              <input
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className={`${ui.input} max-w-[7rem] font-mono text-xs`}
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        <button type="button" onClick={applyBrandColors} className={`${ui.btnOutline} !w-auto px-5`}>
          {t("dashboard.qrUseBrandColors")}
        </button>

        <button type="submit" disabled={loading} className={ui.btn}>
          {loading ? t("common.saving") : t("common.save")}
        </button>
      </form>
    </div>
  );
}
