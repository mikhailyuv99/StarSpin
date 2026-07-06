"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { publicMerchantPath, publicMerchantUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/client";
import {
  downloadCanvas,
  normalizeHex,
  parseQRDesign,
  patchVisitCardSide,
  PREVIEW_MAX_WIDTH,
  renderDesignToCanvas,
  type CardSideSettings,
  type DesignElementKey,
  type QRDesignConfig,
  type QRDesignTemplate,
  type TextStyle,
  type VisitCardSide,
} from "@/lib/qr-design";
import { QRDesignCanvas } from "./QRDesignCanvas";
import { LogoUploadField } from "@/components/dashboard/LogoUploadField";
import { QRScrollRow } from "./QRScrollRow";
import { QRColorSwatch } from "./QRColorSwatch";
import { QRFontPicker } from "./QRFontPicker";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";
import type { Merchant } from "@/lib/types";

const TEMPLATES: QRDesignTemplate[] = ["qr", "table_sticker", "visit_card"];
const VISIT_CARD_SIDES: VisitCardSide[] = ["front", "back"];
const AUTOSAVE_DELAY_MS = 800;
const SAVED_STATUS_MS = 2500;

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function QRDesignStudio({ merchant }: { merchant: Merchant }) {
  const t = useTranslations();

  const initialDesign = useMemo(
    () =>
      parseQRDesign(merchant.qr_design, {
        primary_color: merchant.primary_color,
        logo_url: merchant.logo_url,
      }),
    [merchant],
  );

  const [template, setTemplate] = useState<QRDesignTemplate>(initialDesign.template);
  const [visitCardSide, setVisitCardSide] = useState<VisitCardSide>("front");
  const [qrFg, setQrFg] = useState(merchant.qr_fg_color ?? "#0a0a0a");
  const [qrBg, setQrBg] = useState(merchant.qr_bg_color ?? "#ffffff");
  const [design, setDesign] = useState<QRDesignConfig>(initialDesign);
  const [selectedElement, setSelectedElement] = useState<DesignElementKey | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const skipAutosaveRef = useRef(true);
  const saveSeqRef = useRef(0);
  const savedStatusTimerRef = useRef<number | null>(null);

  const activeLogoUrl = design.logoUrl ?? merchant.logo_url ?? null;

  const canvasDesign = useMemo(() => {
    if (activeLogoUrl && activeLogoUrl !== design.logoUrl) {
      return { ...design, logoUrl: activeLogoUrl };
    }
    return design;
  }, [design, activeLogoUrl]);

  const displayUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${publicMerchantPath(merchant.slug)}`
      : publicMerchantUrl(merchant.slug);

  const sideSettings: CardSideSettings | null =
    template === "visit_card" ? design.visitCard[visitCardSide] : null;

  const patchDesign = (patch: Partial<QRDesignConfig>) => {
    setDesign((prev) => ({ ...prev, ...patch }));
  };

  const patchSide = (patch: Partial<CardSideSettings>) => {
    if (template !== "visit_card") return;
    setDesign((prev) => patchVisitCardSide(prev, visitCardSide, patch));
  };

  const activeNameStyle =
    template === "visit_card" ? design.visitCard[visitCardSide].nameStyle : design.nameStyle;
  const activeTaglineStyle =
    template === "visit_card" ? design.visitCard[visitCardSide].taglineStyle : design.taglineStyle;

  const patchNameStyle = (patch: Partial<TextStyle>) => {
    if (template === "visit_card") {
      patchSide({ nameStyle: { ...activeNameStyle, ...patch } });
    } else {
      patchDesign({ nameStyle: { ...design.nameStyle, ...patch } });
    }
  };

  const patchTaglineStyle = (patch: Partial<TextStyle>) => {
    if (template === "visit_card") {
      patchSide({ taglineStyle: { ...activeTaglineStyle, ...patch } });
    } else {
      patchDesign({ taglineStyle: { ...design.taglineStyle, ...patch } });
    }
  };

  const applyBrandColors = () => {
    setQrFg(merchant.primary_color);
    setQrBg("#ffffff");
    if (template === "visit_card") {
      patchSide({ layoutBg: "#ffffff" });
    } else if (template !== "qr") {
      patchDesign({ layoutBg: "#ffffff" });
    }
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

  useEffect(() => {
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      const seq = ++saveSeqRef.current;
      setSaveStatus("saving");
      setError(null);

      void (async () => {
        const payload = {
          qr_fg_color: normalizeHex(qrFg, "#0a0a0a"),
          qr_bg_color: normalizeHex(qrBg, "#ffffff"),
          qr_design: { ...design, template },
        };

        const supabase = createClient();
        const { error: updateError } = await supabase
          .from("merchants")
          .update(payload)
          .eq("id", merchant.id);

        if (seq !== saveSeqRef.current) return;

        if (updateError) {
          setSaveStatus("error");
          setError(updateError.message);
          return;
        }

        setSaveStatus("saved");
        if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
        savedStatusTimerRef.current = window.setTimeout(() => {
          setSaveStatus((current) => (current === "saved" ? "idle" : current));
        }, SAVED_STATUS_MS);
      })();
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [design, template, qrFg, qrBg, merchant.id]);

  useEffect(
    () => () => {
      if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
    },
    [],
  );

  const exportCanvas = async (exportTemplate: QRDesignTemplate, side: VisitCardSide = "front") => {
    const exportCanvasEl = document.createElement("canvas");
    await renderDesignToCanvas(exportCanvasEl, {
      template: exportTemplate,
      url: displayUrl,
      businessName: merchant.name,
      qrFg: normalizeHex(qrFg, "#0a0a0a"),
      qrBg: normalizeHex(qrBg, "#ffffff"),
      design: { ...design, template: exportTemplate, logoUrl: activeLogoUrl },
      visitCardSide: side,
    });
    return exportCanvasEl;
  };

  const handleDownload = async () => {
    const canvas = await exportCanvas(template, visitCardSide);
    const suffix =
      template === "visit_card" ? `visit-card-${visitCardSide}` : template === "qr" ? "qr" : template;
    downloadCanvas(canvas, `${merchant.slug}-${suffix}.png`);
  };

  const handleDownloadBothSides = async () => {
    for (const side of VISIT_CARD_SIDES) {
      const canvas = await exportCanvas("visit_card", side);
      downloadCanvas(canvas, `${merchant.slug}-visit-card-${side}.png`);
      await new Promise((r) => window.setTimeout(r, 200));
    }
  };

  const previewWidth = PREVIEW_MAX_WIDTH[template];

  const previewPanel = (
    <div
      className="qr-preview-panel w-full max-w-full lg:shrink-0"
      style={{ ["--qr-preview-width" as string]: `${previewWidth + 20}px` }}
    >
      {template === "visit_card" && (
        <div className="mb-3 flex flex-wrap gap-2">
          {VISIT_CARD_SIDES.map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => {
                setVisitCardSide(side);
                setSelectedElement(null);
              }}
              className={`rounded-[10px] border-2 border-black px-3 py-1.5 text-xs font-extrabold uppercase shadow-[2px_2px_0_0_#0a0a0a] ${
                visitCardSide === side ? "bg-[var(--c-yellow)]" : "bg-white"
              }`}
            >
              {t(`dashboard.qrVisitCard_${side}`)}
            </button>
          ))}
        </div>
      )}

      <div className="qr-preview-frame">
        <div className="rounded-[14px] border-2 border-black bg-[var(--c-cream)] p-1.5 shadow-[4px_4px_0_0_#0a0a0a]">
          <QRDesignCanvas
            template={template}
            visitCardSide={visitCardSide}
            displayUrl={displayUrl}
            businessName={merchant.name}
            qrFg={normalizeHex(qrFg, "#0a0a0a")}
            qrBg={normalizeHex(qrBg, "#ffffff")}
            design={canvasDesign}
            editable={template !== "qr"}
            selected={selectedElement}
            onSelect={setSelectedElement}
            onLayoutChange={setDesign}
          />
        </div>
      </div>

      <div className="qr-preview-frame mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => void handleDownload()}
          className={`${ui.btn} qr-preview-download !w-full`}
        >
          {template === "visit_card"
            ? t("dashboard.qrDownloadSide", { side: t(`dashboard.qrVisitCard_${visitCardSide}`) })
            : t("dashboard.downloadPng")}
        </button>
        {template === "visit_card" && (
          <button
            type="button"
            onClick={() => void handleDownloadBothSides()}
            className={`${ui.btnOutline} qr-preview-download !w-full`}
          >
            {t("dashboard.qrDownloadBothSides")}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="qr-design-studio space-y-4 pb-0 lg:space-y-8">
      <QRScrollRow>
        <div className="qr-scroll-row__inner qr-scroll-row__inner--wrap-lg">
          {TEMPLATES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTemplate(value);
                patchDesign({ template: value });
                setSelectedElement(null);
                setVisitCardSide("front");
              }}
              className={`mb-1 shrink-0 rounded-[14px] border-2 border-black px-4 py-2 text-sm font-extrabold uppercase shadow-[3px_3px_0_0_#0a0a0a] ${
                template === value ? "bg-[var(--c-yellow)]" : "bg-white"
              }`}
            >
              {t(`dashboard.qrTemplate_${value}`)}
            </button>
          ))}
        </div>
      </QRScrollRow>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_max-content] lg:gap-8">
        <div className="order-1 min-w-0 self-start lg:order-2 lg:sticky lg:top-[var(--dashboard-sticky-top)] lg:z-20">
          {previewPanel}
        </div>

        <div className="order-2 min-w-0 space-y-4 pb-0 lg:order-1 lg:space-y-6">
          <form
            onSubmit={(e) => e.preventDefault()}
            className={`${ui.card} qr-customize-panel space-y-5 max-lg:p-4`}
          >
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className={ui.h2}>{t("dashboard.qrCustomizeTitle")}</h2>
                <div className="min-h-5 text-xs font-bold">
                  {saveStatus === "saving" && <span className="text-muted">{t("common.saving")}</span>}
                  {saveStatus === "saved" && <span className="text-green-700">{t("common.saved")}</span>}
                </div>
              </div>
              <p className="mt-1 text-sm text-muted">
                {template === "visit_card"
                  ? t("dashboard.qrVisitCardCustomizeHint", {
                      side: t(`dashboard.qrVisitCard_${visitCardSide}`),
                    })
                  : t("dashboard.qrStudioSubtitle")}
              </p>
            </div>

            {error && <p className={ui.alertError}>{error}</p>}

            <div className="flex flex-wrap gap-6">
              <QRColorSwatch
                label={t("dashboard.qrForeground")}
                value={qrFg}
                fallback="#0a0a0a"
                onChange={setQrFg}
              />
              <QRColorSwatch
                label={t("dashboard.qrBackground")}
                value={qrBg}
                fallback="#ffffff"
                onChange={setQrBg}
              />
              {template !== "qr" && (
                <QRColorSwatch
                  label={t("dashboard.qrLayoutBackground")}
                  value={template === "visit_card" ? sideSettings!.layoutBg : design.layoutBg}
                  fallback="#ffffff"
                  onChange={(color) =>
                    template === "visit_card"
                      ? patchSide({ layoutBg: color })
                      : patchDesign({ layoutBg: color })
                  }
                />
              )}
            </div>

            {template !== "qr" && (
              <>
                <div>
                  <label className={ui.label}>{t("dashboard.qrTagline")}</label>
                  <input
                    value={template === "visit_card" ? sideSettings!.tagline : design.tagline}
                    onChange={(e) =>
                      template === "visit_card"
                        ? patchSide({ tagline: e.target.value })
                        : patchDesign({ tagline: e.target.value })
                    }
                    className={ui.input}
                  />
                </div>

                <div className="rounded-[14px] border-2 border-black/15 bg-[var(--c-cream)]/60 p-4 space-y-4">
                  <p className="text-sm font-extrabold text-ink">{t("dashboard.qrTypographyTitle")}</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <QRFontPicker
                      id="qr-name-font"
                      label={t("dashboard.qrNameFont")}
                      value={activeNameStyle.fontId}
                      onChange={(fontId) => patchNameStyle({ fontId })}
                    />
                    <QRColorSwatch
                      label={t("dashboard.qrNameColor")}
                      value={activeNameStyle.color}
                      fallback="#0a0a0a"
                      onChange={(color) => patchNameStyle({ color })}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <QRFontPicker
                      id="qr-tagline-font"
                      label={t("dashboard.qrTaglineFont")}
                      value={activeTaglineStyle.fontId}
                      onChange={(fontId) => patchTaglineStyle({ fontId })}
                    />
                    <QRColorSwatch
                      label={t("dashboard.qrTaglineColor")}
                      value={activeTaglineStyle.color}
                      fallback="#0a0a0a"
                      onChange={(color) => patchTaglineStyle({ color })}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={template === "visit_card" ? sideSettings!.showName : design.showName}
                    onChange={(e) =>
                      template === "visit_card"
                        ? patchSide({ showName: e.target.checked })
                        : patchDesign({ showName: e.target.checked })
                    }
                    className="h-4 w-4 accent-black"
                  />
                  <span className="text-sm font-semibold">{t("dashboard.qrShowBusinessName")}</span>
                </label>

                {template === "visit_card" && (
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={sideSettings!.showQr}
                      onChange={(e) => patchSide({ showQr: e.target.checked })}
                      className="h-4 w-4 accent-black"
                    />
                    <span className="text-sm font-semibold">{t("dashboard.qrShowQr")}</span>
                  </label>
                )}

                <LogoUploadField
                  label={t("dashboard.qrLogo")}
                  logoUrl={activeLogoUrl}
                  onUpload={handleLogoUpload}
                />
              </>
            )}

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={applyBrandColors} className={`${ui.btnOutline} !w-auto px-5`}>
                {t("dashboard.qrUseBrandColors")}
              </button>
            </div>
          </form>

          <section className={`${ui.card} mb-0 flex items-start justify-between gap-4 max-lg:p-4 lg:mb-0`}>
            <div className="min-w-0">
              <h2 className={ui.h2}>{t("dashboard.qrOrderTitle")}</h2>
              <p className="mt-1 text-sm text-muted">{t("dashboard.qrOrderSoon")}</p>
            </div>
            <span className="mt-0.5 shrink-0 rounded-[10px] border-2 border-black bg-[var(--c-cream)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-muted">
              {t("dashboard.qrOrderBadge")}
            </span>
          </section>
        </div>
      </div>
    </div>
  );
}
