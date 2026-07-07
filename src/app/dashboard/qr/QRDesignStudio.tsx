"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { publicMerchantPath, publicMerchantUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/client";
import {
  CANVAS_SIZE,
  addTextBox,
  createTextBox,
  downloadCanvas,
  getSideDesign,
  normalizeHex,
  parseQRDesign,
  patchSideDesign,
  patchTextBox,
  placementFromCanvasPoint,
  previewPixelSize,
  PREVIEW_MAX_WIDTH,
  removeTextBox,
  renderDesignToCanvas,
  type QRDesignConfig,
  type QRDesignTemplate,
  type SelectedElement,
  type VisitCardSide,
} from "@/lib/qr-design";
import { QRDesignCanvas } from "./QRDesignCanvas";
import { LogoUploadField } from "@/components/dashboard/LogoUploadField";
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

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M9 14H4v-5M4 14a8 8 0 1 1 2 4.24" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M15 10h5v5M15 14a8 8 0 1 1-2-4.24" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function QRDesignStudio({ merchant }: { merchant: Merchant }) {
  const t = useTranslations();

  const initialDesign = useMemo(
    () => parseQRDesign(merchant.qr_design, { logo_url: merchant.logo_url }),
    [merchant],
  );

  const [template, setTemplate] = useState<QRDesignTemplate>(initialDesign.template);
  const [visitCardSide, setVisitCardSide] = useState<VisitCardSide>("front");
  const [qrFg, setQrFg] = useState(merchant.qr_fg_color ?? "#0a0a0a");
  const [qrBg, setQrBg] = useState(merchant.qr_bg_color ?? "#ffffff");
  const [design, setDesign] = useState<QRDesignConfig>(initialDesign);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const skipAutosaveRef = useRef(true);
  const saveSeqRef = useRef(0);
  const savedStatusTimerRef = useRef<number | null>(null);
  const historyPastRef = useRef<QRDesignConfig[]>([]);
  const historyFutureRef = useRef<QRDesignConfig[]>([]);
  const editSnapshotRef = useRef<QRDesignConfig | null>(null);
  const designRef = useRef(design);
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    designRef.current = design;
  }, [design]);

  const canUndo = historyPastRef.current.length > 0;
  const canRedo = historyFutureRef.current.length > 0;
  void historyVersion;

  const bumpHistory = () => setHistoryVersion((v) => v + 1);

  const handleEditStart = useCallback(() => {
    if (editSnapshotRef.current) return;
    editSnapshotRef.current = structuredClone(design);
  }, [design]);

  const handleEditEnd = useCallback(() => {
    const before = editSnapshotRef.current;
    editSnapshotRef.current = null;
    if (!before) return;
    const current = designRef.current;
    if (JSON.stringify(before) === JSON.stringify(current)) return;
    historyPastRef.current = [...historyPastRef.current.slice(-49), before];
    historyFutureRef.current = [];
    bumpHistory();
  }, []);

  const pushHistoryAndApply = (updater: (prev: QRDesignConfig) => QRDesignConfig) => {
    historyPastRef.current = [...historyPastRef.current.slice(-49), structuredClone(designRef.current)];
    historyFutureRef.current = [];
    setDesign(updater);
    bumpHistory();
  };

  const undoLayout = useCallback(() => {
    const past = historyPastRef.current;
    if (!past.length) return;
    const previous = past[past.length - 1];
    historyPastRef.current = past.slice(0, -1);
    historyFutureRef.current = [structuredClone(design), ...historyFutureRef.current];
    setDesign(previous);
    setSelectedElement(null);
    bumpHistory();
  }, [design]);

  const redoLayout = useCallback(() => {
    const future = historyFutureRef.current;
    if (!future.length) return;
    const next = future[0];
    historyFutureRef.current = future.slice(1);
    historyPastRef.current = [...historyPastRef.current, structuredClone(design)];
    setDesign(next);
    setSelectedElement(null);
    bumpHistory();
  }, [design]);

  useEffect(() => {
    if (template === "qr") return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (document.querySelector(".qr-preview-aspect")?.contains(target)) return;
      setSelectedElement(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [template]);

  const activeLogoUrl = design.logoUrl ?? merchant.logo_url ?? null;

  const displayUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${publicMerchantPath(merchant.slug)}`
      : publicMerchantUrl(merchant.slug);

  const sideDesign =
    template !== "qr" ? getSideDesign(design, template, visitCardSide) : null;

  const selectedTextBox =
    selectedElement?.kind === "text"
      ? sideDesign?.textBoxes.find((b) => b.id === selectedElement.id) ?? null
      : null;

  const patchDesign = (patch: Partial<QRDesignConfig>) => {
    setDesign((prev) => ({ ...prev, ...patch }));
  };

  const patchSide = (patch: Parameters<typeof patchSideDesign>[3]) => {
    if (template === "qr") return;
    setDesign((prev) => patchSideDesign(prev, template, visitCardSide, patch));
  };

  const applyBrandColors = () => {
    setQrFg(merchant.primary_color);
    setQrBg("#ffffff");
    if (template !== "qr") patchSide({ layoutBg: "#ffffff" });
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

  const addLogoToCanvas = (canvasX?: number, canvasY?: number) => {
    if (!activeLogoUrl || template === "qr") return;
    const placement =
      canvasX !== undefined && canvasY !== undefined
        ? placementFromCanvasPoint(template, canvasX, canvasY)
        : { x: 0.5, y: 0.28, scale: 0.75, rotation: 0 };
    pushHistoryAndApply((prev) =>
      patchSideDesign(prev, template, visitCardSide, {
        showLogo: true,
        logo: placement,
      }),
    );
    setSelectedElement({ kind: "logo" });
  };

  const removeLogoFromCanvas = () => {
    if (template === "qr") return;
    pushHistoryAndApply((prev) =>
      patchSideDesign(prev, template, visitCardSide, { showLogo: false }),
    );
    if (selectedElement?.kind === "logo") setSelectedElement(null);
  };

  const handleAddTextBox = () => {
    if (template === "qr") return;
    const box = createTextBox(t("dashboard.qrDefaultText"));
    pushHistoryAndApply((prev) => addTextBox(prev, template, visitCardSide, box));
    setSelectedElement({ kind: "text", id: box.id });
  };

  const handleDeleteTextBox = (id: string) => {
    if (template === "qr") return;
    pushHistoryAndApply((prev) => removeTextBox(prev, template, visitCardSide, id));
    setSelectedElement(null);
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
          qr_design: { ...design, template, v: 2 as const },
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
  const previewPx = previewPixelSize(template);
  const customizeRef = useRef<HTMLFormElement>(null);
  const studioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (template !== "qr") {
      studioRef.current?.style.removeProperty("--qr-customize-height");
      return;
    }

    const form = customizeRef.current;
    const studio = studioRef.current;
    if (!form || !studio) return;

    const syncHeight = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        studio.style.setProperty("--qr-customize-height", `${form.offsetHeight}px`);
      } else {
        studio.style.removeProperty("--qr-customize-height");
      }
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(form);
    window.addEventListener("resize", syncHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeight);
    };
  }, [template, qrFg, qrBg, saveStatus, error]);

  const handlePreviewDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (template === "qr" || !activeLogoUrl) return;
    if (!event.dataTransfer.types.includes("application/x-qr-logo")) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const canvas = CANVAS_SIZE[template];
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    addLogoToCanvas(x, y);
  };

  const previewPanel = (
    <div className="qr-preview-panel qr-preview-panel-inner w-full max-w-full lg:shrink-0">
      {template !== "qr" && (
        <div className="mb-3 flex w-full items-center gap-2">
          <button
            type="button"
            disabled={!canUndo}
            onClick={undoLayout}
            aria-label={t("dashboard.qrUndo")}
            className={`${ui.btnOutline} flex h-9 w-9 items-center justify-center !p-0 disabled:opacity-40`}
          >
            <UndoIcon />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={redoLayout}
            aria-label={t("dashboard.qrRedo")}
            className={`${ui.btnOutline} flex h-9 w-9 items-center justify-center !p-0 disabled:opacity-40`}
          >
            <RedoIcon />
          </button>
        </div>
      )}

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

      <div className={`qr-preview-frame ${template !== "qr" ? "qr-preview-frame--print" : ""}`}>
        <div
          className={
            template === "qr"
              ? "qr-preview-aspect qr-preview-aspect--qr qr-preview-aspect--framed"
              : "qr-preview-aspect qr-preview-aspect--print"
          }
          style={{
            width: `${previewPx.width}px`,
            maxWidth: "100%",
            aspectRatio: `${CANVAS_SIZE[template].width} / ${CANVAS_SIZE[template].height}`,
          }}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("application/x-qr-logo")) e.preventDefault();
          }}
          onDrop={handlePreviewDrop}
        >
          <QRDesignCanvas
            template={template}
            visitCardSide={visitCardSide}
            displayUrl={displayUrl}
            qrFg={normalizeHex(qrFg, "#0a0a0a")}
            qrBg={normalizeHex(qrBg, "#ffffff")}
            design={{ ...design, logoUrl: activeLogoUrl }}
            editable={template !== "qr"}
            selected={selectedElement}
            onSelect={setSelectedElement}
            onLayoutChange={setDesign}
            onEditStart={handleEditStart}
            onEditEnd={handleEditEnd}
          />
        </div>
      </div>

      <div
        className={`mt-3 flex flex-col gap-2 qr-preview-actions ${template !== "qr" ? "qr-preview-actions--print" : "w-full"}`}
      >
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
    <div
      ref={studioRef}
      className={`qr-design-studio qr-design-studio--${template}`}
      style={{
        ["--qr-preview-canvas-width" as string]: `${previewPx.width}px`,
        ["--qr-preview-aspect-ratio" as string]: `${CANVAS_SIZE[template].width} / ${CANVAS_SIZE[template].height}`,
      }}
    >
      <div className="flex flex-wrap gap-2 pb-1">
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
            className={`rounded-[14px] border-2 border-black px-4 py-2 text-sm font-extrabold shadow-[3px_3px_0_0_#0a0a0a] ${
              template === value ? "bg-[var(--c-yellow)]" : "bg-white"
            }`}
          >
            {t(`dashboard.qrTemplate_${value}`)}
          </button>
        ))}
      </div>

      <div
        className="qr-studio-layout relative flex flex-col gap-4 lg:block lg:gap-0"
        style={{ ["--qr-preview-width" as string]: `${previewWidth + 20}px` }}
      >
        <div className="qr-studio-preview w-full min-w-0 shrink-0 max-lg:order-2">
          <div className="qr-studio-preview-inner">{previewPanel}</div>
        </div>

        <div className="qr-studio-settings min-w-0 w-full max-lg:order-1">
          <form
            ref={customizeRef}
            onSubmit={(e) => e.preventDefault()}
            className={`${ui.card} qr-design-studio-form qr-customize-panel ${template === "qr" ? "qr-customize-panel--qr" : "qr-customize-panel--print"} min-w-0 space-y-4 max-lg:space-y-4 lg:space-y-5`}
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
              {template !== "qr" && sideDesign && (
                <QRColorSwatch
                  label={t("dashboard.qrLayoutBackground")}
                  value={sideDesign.layoutBg}
                  fallback="#ffffff"
                  onChange={(color) => patchSide({ layoutBg: color })}
                />
              )}
            </div>

            {template !== "qr" && (
              <>
                <div className="space-y-3">
                  <p className={ui.label}>{t("dashboard.qrElementsTitle")}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={handleAddTextBox} className={`${ui.btnOutline} !w-auto px-4 py-2 text-sm`}>
                      {t("dashboard.qrAddTextBox")}
                    </button>
                    {sideDesign?.showLogo && (
                      <button type="button" onClick={removeLogoFromCanvas} className={`${ui.btnOutline} !w-auto px-4 py-2 text-sm`}>
                        {t("dashboard.qrRemoveLogo")}
                      </button>
                    )}
                  </div>
                </div>

                {activeLogoUrl && (
                  <div className="rounded-[14px] border-2 border-black/15 bg-[var(--c-cream)]/60 p-4 space-y-3">
                    <p className="text-sm font-extrabold text-ink">{t("dashboard.qrLogo")}</p>
                    <div className="flex items-center gap-4">
                      <img
                        src={activeLogoUrl}
                        alt=""
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("application/x-qr-logo", "1")}
                        className="h-16 w-16 shrink-0 cursor-grab rounded-[14px] border-2 border-black object-cover active:cursor-grabbing"
                      />
                      <div className="flex min-w-0 flex-col gap-2">
                        <p className="text-xs font-medium text-muted">{t("dashboard.qrLogoDragHint")}</p>
                        {!sideDesign?.showLogo && (
                          <button
                            type="button"
                            onClick={() => addLogoToCanvas()}
                            className={`${ui.btnOutline} !w-auto px-4 py-2 text-sm`}
                          >
                            {t("dashboard.qrAddLogoToDesign")}
                          </button>
                        )}
                      </div>
                    </div>
                    <LogoUploadField logoUrl={activeLogoUrl} onUpload={handleLogoUpload} />
                  </div>
                )}

                {!activeLogoUrl && (
                  <LogoUploadField label={t("dashboard.qrLogo")} logoUrl={null} onUpload={handleLogoUpload} />
                )}

                {selectedTextBox && (
                  <div className="rounded-[14px] border-2 border-black/15 bg-[var(--c-cream)]/60 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-extrabold text-ink">{t("dashboard.qrEditTextBox")}</p>
                      <button
                        type="button"
                        onClick={() => handleDeleteTextBox(selectedTextBox.id)}
                        className="text-xs font-bold text-red-700 underline"
                      >
                        {t("dashboard.qrDeleteTextBox")}
                      </button>
                    </div>
                    <div>
                      <label className={ui.label}>{t("dashboard.qrTextBoxContent")}</label>
                      <input
                        value={selectedTextBox.text}
                        onChange={(e) =>
                          setDesign((prev) =>
                            patchTextBox(prev, template as "table_sticker" | "visit_card", visitCardSide, selectedTextBox.id, {
                              text: e.target.value,
                            }),
                          )
                        }
                        className={`${ui.input} mt-1`}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <QRFontPicker
                        id="qr-text-font"
                        label={t("dashboard.qrTextBoxFont")}
                        value={selectedTextBox.fontId}
                        onChange={(fontId) =>
                          setDesign((prev) =>
                            patchTextBox(prev, template as "table_sticker" | "visit_card", visitCardSide, selectedTextBox.id, {
                              fontId,
                            }),
                          )
                        }
                      />
                      <QRColorSwatch
                        label={t("dashboard.qrTextBoxColor")}
                        value={selectedTextBox.color}
                        fallback="#0a0a0a"
                        onChange={(color) =>
                          setDesign((prev) =>
                            patchTextBox(prev, template as "table_sticker" | "visit_card", visitCardSide, selectedTextBox.id, {
                              color,
                            }),
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="qr-customize-actions flex flex-wrap gap-3 pt-1">
              <button type="button" onClick={applyBrandColors} className={`${ui.btnOutline} !w-auto px-5`}>
                {t("dashboard.qrUseBrandColors")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
