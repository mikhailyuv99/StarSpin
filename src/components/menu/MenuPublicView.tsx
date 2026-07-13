"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { useTranslations } from "@/i18n/client";
import {
  DEFAULT_MENU_STYLE,
  groupMenuNodes,
  parseMenuBackground,
  parseMenuStyle,
  resolveLocaleMap,
  currencySymbol,
  clampMenuPageImageDim,
  type MenuInfo,
  type MenuNode,
  type MenuStyle,
  type MenuBackground,
} from "@/lib/menu";
import { ensureQRFontLoaded, getQRFont } from "@/lib/qr-fonts";

type Props = {
  merchantName: string;
  logoUrl?: string | null;
  primaryColor?: string;
  nodes: MenuNode[];
  style?: MenuStyle | null;
  background?: MenuBackground | null;
  info?: MenuInfo | null;
  locale: Locale;
  showChrome?: boolean;
};

export function MenuPublicView({
  merchantName,
  logoUrl,
  primaryColor,
  nodes,
  style,
  background,
  info,
  locale,
  showChrome = true,
}: Props) {
  const t = useTranslations();
  const menuStyle = parseMenuStyle(style, primaryColor);
  const menuBg = parseMenuBackground(background);
  const font = getQRFont(menuStyle.font);
  const { roots, itemsBySection } = useMemo(
    () => groupMenuNodes(nodes.filter((n) => n.visible !== false)),
    [nodes],
  );
  const [lightbox, setLightbox] = useState<{
    photos: string[];
    videoUrl?: string | null;
    videoAspect?: string | null;
    title: string;
    index: number;
  } | null>(null);

  useEffect(() => {
    void ensureQRFontLoaded(font.id, "name");
  }, [font.id]);

  const radius = menuStyle.corners === "rounded" ? "14px" : "2px";
  const pad = menuStyle.density === "compact" ? "0.65rem" : "1rem";
  const bgColor = menuBg.color || "#FFF8F1";
  const bannerUrl = menuBg.bannerUrl ?? menuBg.imageUrl ?? null;
  const pageImageUrl = menuBg.pageImageUrl ?? null;
  const photoBackdrop = Boolean(pageImageUrl);
  const pageDim = clampMenuPageImageDim(menuBg.pageImageDim);
  // Over photo: force light chrome text; dish cards stay opaque light with dark ink.
  const nameColor = photoBackdrop ? "#ffffff" : menuStyle.nameColor || DEFAULT_MENU_STYLE.nameColor;
  const textColor = photoBackdrop ? "#f4f4f5" : menuStyle.textColor || DEFAULT_MENU_STYLE.textColor;
  const accentColor = photoBackdrop
    ? "#ffffff"
    : menuStyle.accent || DEFAULT_MENU_STYLE.accent;
  const panelBg = photoBackdrop
    ? "rgba(255,255,255,0.94)"
    : "color-mix(in srgb, white 62%, transparent)";
  const emptyPanelBg = photoBackdrop
    ? "rgba(255,255,255,0.94)"
    : "color-mix(in srgb, white 45%, transparent)";
  const panelInk = photoBackdrop ? "#141414" : undefined;
  const chromeShadow = photoBackdrop
    ? "0 1px 2px rgba(0,0,0,0.55), 0 6px 18px rgba(0,0,0,0.28)"
    : undefined;

  return (
    <div
      className="menu-public-view relative mx-auto w-full max-w-[430px]"
      style={
        {
          "--menu-accent": accentColor,
          "--menu-name": nameColor,
          "--menu-text": textColor,
          "--menu-radius": radius,
          "--menu-pad": pad,
          "--menu-bg": bgColor,
          fontFamily: `"${font.googleFamily}", system-ui, sans-serif`,
          backgroundColor: bgColor,
          color: textColor,
        } as React.CSSProperties
      }
    >
      {pageImageUrl ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(100dvh,56rem)] w-full"
          style={{
            backgroundImage: `url(${pageImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Readability scrim — always on for photo backgrounds */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(0,0,0,${(pageDim / 100) * 0.92}) 0%, rgba(0,0,0,${(pageDim / 100) * 0.72}) 42%, rgba(0,0,0,${(pageDim / 100) * 0.55}) 100%)`,
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-48"
            style={{
              background: `linear-gradient(to bottom, transparent, ${bgColor})`,
            }}
          />
        </div>
      ) : null}

      <div className="relative z-10">
        {bannerUrl ? (
          <div className="relative w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerUrl}
              alt=""
              className="aspect-[16/9] w-full object-cover"
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
              style={{
                background: `linear-gradient(to bottom, transparent 0%, color-mix(in srgb, ${bgColor} 40%, transparent) 55%, ${bgColor} 100%)`,
              }}
            />
          </div>
        ) : null}

        <div
          className={`relative z-10 px-4 pb-16 ${bannerUrl ? "-mt-14" : "pt-6"}`}
        >
          {showChrome && (
            <header className="mb-6 text-center">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={merchantName}
                  className="mx-auto mb-3 h-16 w-16 rounded-full object-cover"
                  style={{
                    boxShadow: photoBackdrop
                      ? "0 0 0 3px rgba(255,255,255,0.92), 0 8px 24px rgba(0,0,0,0.35)"
                      : `0 0 0 4px ${bgColor}`,
                  }}
                />
              ) : null}
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: "var(--menu-name)", textShadow: chromeShadow }}
              >
                {merchantName}
              </h1>
              {info?.note && resolveLocaleMap(info.note, locale) ? (
                <p
                  className="mt-2 text-sm"
                  style={{ textShadow: chromeShadow, opacity: photoBackdrop ? 0.95 : 0.8 }}
                >
                  {resolveLocaleMap(info.note, locale)}
                </p>
              ) : null}
              {info?.hours && resolveLocaleMap(info.hours, locale) ? (
                <p
                  className="mt-1 text-xs"
                  style={{ textShadow: chromeShadow, opacity: photoBackdrop ? 0.9 : 0.7 }}
                >
                  {resolveLocaleMap(info.hours, locale)}
                </p>
              ) : null}
              {info?.address && resolveLocaleMap(info.address, locale) ? (
                <p
                  className="mt-1 text-xs"
                  style={{ textShadow: chromeShadow, opacity: photoBackdrop ? 0.9 : 0.7 }}
                >
                  {resolveLocaleMap(info.address, locale)}
                </p>
              ) : null}
            </header>
          )}

          <div className="space-y-5">
            {roots.length === 0 ? (
              <p
                className="rounded-[var(--menu-radius)] px-4 py-8 text-center text-sm"
                style={{
                  backgroundColor: emptyPanelBg,
                  color: panelInk,
                  opacity: photoBackdrop ? 1 : 0.7,
                }}
              >
                {t("public.menuEmpty")}
              </p>
            ) : null}

            {roots.map((node) => {
              if (node.type === "section") {
                const items = itemsBySection[node.id] ?? [];
                const visibleItems = items.filter(
                  (i) => i.visible !== false && i.payload.available !== false,
                );
                const title = resolveLocaleMap(
                  node.payload.title,
                  locale,
                  t("menuStudio.untitledSection"),
                );
                return (
                  <section key={node.id} className="space-y-3">
                    <div>
                      <h2
                        className="text-lg font-semibold uppercase tracking-[0.08em]"
                        style={{ color: "var(--menu-accent)", textShadow: chromeShadow }}
                      >
                        {title || t("menuStudio.untitledSection")}
                      </h2>
                      {resolveLocaleMap(node.payload.description, locale) ? (
                        <p
                          className="mt-1 text-sm"
                          style={{
                            textShadow: chromeShadow,
                            opacity: photoBackdrop ? 0.92 : 0.7,
                          }}
                        >
                          {resolveLocaleMap(node.payload.description, locale)}
                        </p>
                      ) : null}
                    </div>
                    {visibleItems.length ? (
                      <ul className="space-y-2">
                        {visibleItems.map((item) => (
                          <DishRow
                            key={item.id}
                            node={item}
                            locale={locale}
                            priceAlign={menuStyle.priceAlign}
                            panelBg={panelBg}
                            panelInk={panelInk}
                            onOpen={() =>
                              setLightbox({
                                photos: item.payload.photo_urls ?? [],
                                videoUrl: item.payload.video_url,
                                videoAspect: item.payload.video_aspect,
                                title: resolveLocaleMap(item.payload.name, locale),
                                index: 0,
                              })
                            }
                          />
                        ))}
                      </ul>
                    ) : (
                      <p
                        className="rounded-[var(--menu-radius)] border border-dashed px-3 py-4 text-center text-sm"
                        style={{
                          backgroundColor: emptyPanelBg,
                          color: panelInk,
                          borderColor: photoBackdrop ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.15)",
                          opacity: photoBackdrop ? 1 : 0.6,
                        }}
                      >
                        {t("menuStudio.sectionEmpty")}
                      </p>
                    )}
                  </section>
                );
              }

              if (node.type === "item") {
                return (
                  <DishRow
                    key={node.id}
                    node={node}
                    locale={locale}
                    priceAlign={menuStyle.priceAlign}
                    panelBg={panelBg}
                    panelInk={panelInk}
                    onOpen={() =>
                      setLightbox({
                        photos: node.payload.photo_urls ?? [],
                        videoUrl: node.payload.video_url,
                        videoAspect: node.payload.video_aspect,
                        title: resolveLocaleMap(node.payload.name, locale),
                        index: 0,
                      })
                    }
                  />
                );
              }

              if (node.type === "heading") {
                return (
                  <h3
                    key={node.id}
                    className="text-base font-semibold"
                    style={{ textShadow: chromeShadow }}
                  >
                    {resolveLocaleMap(node.payload.title, locale)}
                  </h3>
                );
              }

              if (node.type === "text") {
                return (
                  <p
                    key={node.id}
                    className="text-sm leading-relaxed"
                    style={
                      photoBackdrop
                        ? {
                            backgroundColor: panelBg,
                            color: panelInk,
                            borderRadius: "var(--menu-radius)",
                            padding: "0.75rem 0.9rem",
                          }
                        : { opacity: 0.8 }
                    }
                  >
                    {resolveLocaleMap(node.payload.body, locale)}
                  </p>
                );
              }

              if (node.type === "divider") {
                return (
                  <hr
                    key={node.id}
                    className={photoBackdrop ? "border-white/25" : "border-black/10"}
                  />
                );
              }

              if (node.type === "image" || node.type === "scan_page") {
                if (!node.payload.image_url) return null;
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={node.id}
                    src={node.payload.image_url}
                    alt={resolveLocaleMap(node.payload.alt, locale, merchantName)}
                    className="w-full rounded-[var(--menu-radius)] object-cover"
                  />
                );
              }

              if (node.type === "gallery") {
                const urls = node.payload.image_urls ?? [];
                if (!urls.length) return null;
                return (
                  <div key={node.id} className="grid grid-cols-2 gap-2">
                    {urls.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url}
                        alt=""
                        className="aspect-square w-full rounded-[var(--menu-radius)] object-cover"
                      />
                    ))}
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      </div>

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-sm font-medium"
              onClick={() => setLightbox(null)}
            >
              {t("public.menuClose")}
            </button>
            {lightbox.videoUrl ? (
              <video
                src={lightbox.videoUrl}
                className={`w-full ${
                  lightbox.videoAspect === "9:16"
                    ? "max-h-[80vh] object-contain"
                    : "aspect-video object-cover"
                }`}
                autoPlay
                muted
                loop
                playsInline
                controls
                controlsList="nodownload noplaybackrate noremoteplayback"
                disablePictureInPicture
                onLoadedMetadata={(e) => {
                  e.currentTarget.muted = true;
                  e.currentTarget.volume = 0;
                }}
                onVolumeChange={(e) => {
                  const el = e.currentTarget;
                  if (!el.muted || el.volume > 0) {
                    el.muted = true;
                    el.volume = 0;
                  }
                }}
              />
            ) : lightbox.photos[lightbox.index] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightbox.photos[lightbox.index]}
                alt={lightbox.title}
                className="max-h-[80vh] w-full object-contain"
              />
            ) : (
              <div className="p-8 text-center text-white">{lightbox.title}</div>
            )}
            {lightbox.photos.length > 1 ? (
              <div className="flex justify-center gap-2 bg-black/60 py-3">
                {lightbox.photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`h-2 w-2 rounded-full ${i === lightbox.index ? "bg-white" : "bg-white/40"}`}
                    onClick={() => setLightbox({ ...lightbox, index: i })}
                    aria-label={`${i + 1}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DishRow({
  node,
  locale,
  priceAlign,
  panelBg,
  panelInk,
  onOpen,
}: {
  node: MenuNode;
  locale: Locale;
  priceAlign?: "right" | "inline";
  panelBg: string;
  panelInk?: string;
  onOpen: () => void;
}) {
  const name = resolveLocaleMap(node.payload.name, locale);
  const desc = resolveLocaleMap(node.payload.description, locale);
  const price = node.payload.price
    ? `${currencySymbol(node.payload.currency)}${node.payload.price}`
    : "";
  const thumb = node.payload.photo_urls?.[0];
  const hasVideo = Boolean(node.payload.video_url);
  const hasMedia = Boolean(thumb || hasVideo);

  return (
    <button
      type="button"
      onClick={hasMedia ? onOpen : undefined}
      className={`flex w-full gap-3 rounded-[var(--menu-radius)] p-[var(--menu-pad)] text-left ${
        hasMedia ? "cursor-pointer" : "cursor-default"
      }`}
      style={{ backgroundColor: panelBg, color: panelInk }}
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt=""
          className="h-16 w-16 shrink-0 rounded-[calc(var(--menu-radius)-4px)] object-cover"
        />
      ) : hasVideo ? (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[calc(var(--menu-radius)-4px)] bg-black">
          <video
            src={node.payload.video_url!}
            className="h-full w-full object-cover"
            muted
            playsInline
            onLoadedMetadata={(e) => {
              e.currentTarget.muted = true;
              e.currentTarget.volume = 0;
            }}
          />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div
          className={`flex gap-2 ${
            priceAlign === "inline" ? "flex-wrap items-baseline" : "items-start justify-between"
          }`}
        >
          <span className="font-medium leading-snug">{name}</span>
          {price ? <span className="shrink-0 font-semibold tabular-nums">{price}</span> : null}
        </div>
        {desc ? (
          <p className="mt-1 text-sm leading-snug" style={{ opacity: panelInk ? 0.72 : 0.7 }}>
            {desc}
          </p>
        ) : null}
        {node.payload.tags?.length ? (
          <p
            className="mt-1 text-[11px] uppercase tracking-wide"
            style={{ opacity: panelInk ? 0.55 : 0.5 }}
          >
            {node.payload.tags.join(" · ")}
          </p>
        ) : null}
      </div>
    </button>
  );
}
