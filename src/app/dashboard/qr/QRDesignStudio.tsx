"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { publicMerchantPath, publicMerchantUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/client";
import {
  CANVAS_SIZE,
  downloadCanvas,
  normalizeHex,
  parseQRDesign,
  renderDesignToCanvas,
  type QRDesignConfig,
  type QRDesignTemplate,
} from "@/lib/qr-design";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";
import type { Merchant } from "@/lib/types";

const TEMPLATES: QRDesignTemplate[] = ["qr", "table_sticker", "visit_card"];

export function QRDesignStudio({ merchant }: { merchant: Merchant }) {
  const t = useTranslations();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderVersion = useRef(0);

  const initialDesign = useMemo(
    () =>
      parseQRDesign(merchant.qr_design, {
        primary_color: merchant.primary_color,
        logo_url: merchant.logo_url,
      }),
    [merchant],
  );

  const [template, setTemplate] = useState<QRDesignTemplate>(initialDesign.template);
  const [qrFg, setQrFg] = useState(merchant.qr_fg_color ?? "#0a0a0a");
  const [qrBg, setQrBg] = useState(merchant.qr_bg_color ?? "#ffffff");
  const [design, setDesign] = useState<QRDesignConfig>(initialDesign);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${publicMerchantPath(merchant.slug)}`
      : publicMerchantUrl(merchant.slug);

  const patchDesign = (patch: Partial<QRDesignConfig>) => {
    setDesign((prev) => ({ ...prev, ...patch }));
  };

  const renderPreview = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const version = ++renderVersion.current;
    setRendering(true);
    try {
      await renderDesignToCanvas(canvas, {
        template,
        url: displayUrl,
        businessName: merchant.name,
        qrFg: normalizeHex(qrFg, "#0a0a0a"),
        qrBg: normalizeHex(qrBg, "#ffffff"),
        design: { ...design, template },
      });
    } finally {
      if (version === renderVersion.current) setRendering(false);
    }
  }, [design, displayUrl, merchant.name, qrBg, qrFg, template]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void renderPreview();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [renderPreview]);

  const applyBrandColors = () => {
    setQrFg(merchant.primary_color);
    setQrBg("#ffffff");
    patchDesign({ accentColor: merchant.primary_color, layoutBg: "#ffffff" });
  };

  const useBusinessLogo = () => {
    patchDesign({ logoUrl: merchant.logo_url ?? null });
  };

  const handleLogoUpload = async (file: File) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const path = `${user.id}/qr-${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("merchant-logos").upload(path, file, {
      upsert: true,
    });
    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    const { data } = supabase.storage.from("merchant-logos").getPublicUrl(path);
    patchDesign({ logoUrl: data.publicUrl });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    const payload = {
      qr_fg_color: normalizeHex(qrFg, "#0a0a0a"),
      qr_bg_color: normalizeHex(qrBg, "#ffffff"),
      qr_design: { ...design, template },
    };

    const supabase = createClient();
    const { error: updateError } = await supabase.from("merchants").update(payload).eq("id", merchant.id);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage(t("common.saved"));
    router.refresh();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const suffix = template === "qr" ? "qr" : template;
    downloadCanvas(canvas, `${merchant.slug}-${suffix}.png`);
  };

  const handleDownloadQrOnly = async () => {
    const scratch = document.createElement("canvas");
    await renderDesignToCanvas(scratch, {
      template: "qr",
      url: displayUrl,
      businessName: merchant.name,
      qrFg: normalizeHex(qrFg, "#0a0a0a"),
      qrBg: normalizeHex(qrBg, "#ffffff"),
      design: { ...design, template: "qr" },
    });
    downloadCanvas(scratch, `${merchant.slug}-qr.png`);
  };

  const canvasBox = CANVAS_SIZE[template];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTemplate(value);
              patchDesign({ template: value });
            }}
            className={`rounded-[14px] border-2 border-black px-4 py-2 text-sm font-extrabold uppercase shadow-[3px_3px_0_0_#0a0a0a] ${
              template === value ? "bg-[var(--c-yellow)]" : "bg-white"
            }`}
          >
            {t(`dashboard.qrTemplate_${value}`)}
          </button>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <div className={`${ui.card} space-y-4`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className={ui.h2}>{t("dashboard.qrPreviewTitle")}</h2>
            {rendering && <span className="text-xs font-bold text-muted">{t("common.loading")}</span>}
          </div>
          <div className="overflow-auto rounded-[14px] border-2 border-black bg-[var(--c-cream)] p-3">
            <canvas
              ref={canvasRef}
              className="mx-auto max-w-full"
              style={{ width: "100%", height: "auto", aspectRatio: `${canvasBox.width} / ${canvasBox.height}` }}
            />
          </div>
          <p className="text-center font-mono text-xs text-muted">{displayUrl}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={handleDownload} className={ui.btn}>
              {t("dashboard.downloadPng")}
            </button>
            {template !== "qr" && (
              <button type="button" onClick={() => void handleDownloadQrOnly()} className={ui.btnOutline}>
                {t("dashboard.qrDownloadQrOnly")}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
            className={`${ui.card} space-y-5`}
          >
            <div>
              <h2 className={ui.h2}>{t("dashboard.qrCustomizeTitle")}</h2>
              <p className="mt-1 text-sm text-muted">{t("dashboard.qrStudioSubtitle")}</p>
            </div>

            {message && <p className={ui.alertSuccess}>{message}</p>}
            {error && <p className={ui.alertError}>{error}</p>}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={ui.label}>{t("dashboard.qrForeground")}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={normalizeHex(qrFg, "#0a0a0a")}
                    onChange={(e) => setQrFg(e.target.value)}
                    className="h-12 w-full min-w-0 flex-1 cursor-pointer rounded-[14px] border-2 border-black bg-white p-1"
                  />
                  <input
                    value={qrFg}
                    onChange={(e) => setQrFg(e.target.value)}
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
                    value={normalizeHex(qrBg, "#ffffff")}
                    onChange={(e) => setQrBg(e.target.value)}
                    className="h-12 w-full min-w-0 flex-1 cursor-pointer rounded-[14px] border-2 border-black bg-white p-1"
                  />
                  <input
                    value={qrBg}
                    onChange={(e) => setQrBg(e.target.value)}
                    className={`${ui.input} max-w-[7rem] font-mono text-xs`}
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>

            {template !== "qr" && (
              <>
                <div>
                  <label className={ui.label}>{t("dashboard.qrLayoutBackground")}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={normalizeHex(design.layoutBg, "#ffffff")}
                      onChange={(e) => patchDesign({ layoutBg: e.target.value })}
                      className="h-12 w-full min-w-0 flex-1 cursor-pointer rounded-[14px] border-2 border-black bg-white p-1"
                    />
                    <input
                      value={design.layoutBg}
                      onChange={(e) => patchDesign({ layoutBg: e.target.value })}
                      className={`${ui.input} max-w-[7rem] font-mono text-xs`}
                      spellCheck={false}
                    />
                  </div>
                </div>

                <div>
                  <label className={ui.label}>{t("dashboard.qrAccentColor")}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={normalizeHex(design.accentColor, merchant.primary_color)}
                      onChange={(e) => patchDesign({ accentColor: e.target.value })}
                      className="h-12 w-full min-w-0 flex-1 cursor-pointer rounded-[14px] border-2 border-black bg-white p-1"
                    />
                    <input
                      value={design.accentColor}
                      onChange={(e) => patchDesign({ accentColor: e.target.value })}
                      className={`${ui.input} max-w-[7rem] font-mono text-xs`}
                      spellCheck={false}
                    />
                  </div>
                </div>

                <div>
                  <label className={ui.label}>{t("dashboard.qrTagline")}</label>
                  <input
                    value={design.tagline}
                    onChange={(e) => patchDesign({ tagline: e.target.value })}
                    className={ui.input}
                  />
                </div>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={design.showName}
                    onChange={(e) => patchDesign({ showName: e.target.checked })}
                    className="h-4 w-4 accent-black"
                  />
                  <span className="text-sm font-semibold">{t("dashboard.qrShowBusinessName")}</span>
                </label>

                <div>
                  <label className={ui.label}>{t("dashboard.qrLogo")}</label>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={useBusinessLogo} className={`${ui.btnOutline} !w-auto px-4`}>
                      {t("dashboard.qrUseBusinessLogo")}
                    </button>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className={`${ui.file} mt-3`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleLogoUpload(file);
                    }}
                  />
                  {design.logoUrl && (
                    <img
                      src={design.logoUrl}
                      alt=""
                      className="mt-3 h-16 w-16 rounded-[14px] border-2 border-black object-cover"
                    />
                  )}
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={applyBrandColors} className={`${ui.btnOutline} !w-auto px-5`}>
                {t("dashboard.qrUseBrandColors")}
              </button>
              <button type="submit" disabled={loading} className={`${ui.btn} !w-auto px-5`}>
                {loading ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </form>

          <section className={`${ui.card} space-y-4 border-dashed`}>
            <div>
              <h2 className={ui.h2}>{t("dashboard.qrOrderTitle")}</h2>
              <p className="mt-1 text-sm text-muted">{t("dashboard.qrOrderSubtitle")}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" disabled className={`${ui.btnOutline} opacity-60`}>
                {t("dashboard.qrOrderStickers")}
              </button>
              <button type="button" disabled className={`${ui.btnOutline} opacity-60`}>
                {t("dashboard.qrOrderCards")}
              </button>
            </div>
            <p className="text-xs font-medium text-muted">{t("dashboard.qrOrderSoon")}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
