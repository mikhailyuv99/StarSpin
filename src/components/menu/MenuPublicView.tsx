"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { useTranslations } from "@/i18n/client";
import {
  groupMenuNodes,
  parseMenuBackground,
  parseMenuStyle,
  resolveLocaleMap,
  currencySymbol,
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

  return (
    <div
      className="menu-public-view relative mx-auto min-h-full w-full max-w-[430px]"
      style={
        {
          "--menu-accent": menuStyle.accent,
          "--menu-radius": radius,
          "--menu-pad": pad,
          "--menu-bg": bgColor,
          fontFamily: `"${font.googleFamily}", system-ui, sans-serif`,
          backgroundColor: bgColor,
          color: "#1a1a1a",
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
                  style={{ boxShadow: `0 0 0 4px ${bgColor}` }}
                />
              ) : null}
              <h1 className="text-2xl font-bold tracking-tight">{merchantName}</h1>
              {info?.note && resolveLocaleMap(info.note, locale) ? (
                <p className="mt-2 text-sm opacity-80">{resolveLocaleMap(info.note, locale)}</p>
              ) : null}
              {info?.hours && resolveLocaleMap(info.hours, locale) ? (
                <p className="mt-1 text-xs opacity-70">{resolveLocaleMap(info.hours, locale)}</p>
              ) : null}
              {info?.address && resolveLocaleMap(info.address, locale) ? (
                <p className="mt-1 text-xs opacity-70">{resolveLocaleMap(info.address, locale)}</p>
              ) : null}
            </header>
          )}

          <div className="space-y-5">
            {roots.length === 0 ? (
              <p
                className="rounded-[var(--menu-radius)] px-4 py-8 text-center text-sm opacity-70"
                style={{ backgroundColor: "color-mix(in srgb, white 55%, transparent)" }}
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
                      style={{ color: "var(--menu-accent)" }}
                    >
                      {title || t("menuStudio.untitledSection")}
                    </h2>
                    {resolveLocaleMap(node.payload.description, locale) ? (
                      <p className="mt-1 text-sm opacity-70">
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
                      className="rounded-[var(--menu-radius)] border border-dashed border-black/15 px-3 py-4 text-center text-sm opacity-60"
                      style={{ backgroundColor: "color-mix(in srgb, white 45%, transparent)" }}
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
                <h3 key={node.id} className="text-base font-semibold">
                  {resolveLocaleMap(node.payload.title, locale)}
                </h3>
              );
            }

            if (node.type === "text") {
              return (
                <p key={node.id} className="text-sm leading-relaxed opacity-80">
                  {resolveLocaleMap(node.payload.body, locale)}
                </p>
              );
            }

            if (node.type === "divider") {
              return <hr key={node.id} className="border-black/10" />;
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
                  lightbox.videoAspect === "9:16" ? "max-h-[80vh] object-contain" : "aspect-video object-cover"
                }`}
                autoPlay
                muted
                loop
                playsInline
                controls
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
  onOpen,
}: {
  node: MenuNode;
  locale: Locale;
  priceAlign?: "right" | "inline";
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
      style={{ backgroundColor: "color-mix(in srgb, white 62%, transparent)" }}
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="h-16 w-16 shrink-0 rounded-[calc(var(--menu-radius)-4px)] object-cover" />
      ) : hasVideo ? (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[calc(var(--menu-radius)-4px)] bg-black">
          <video src={node.payload.video_url!} className="h-full w-full object-cover" muted playsInline />
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
        {desc ? <p className="mt-1 text-sm leading-snug opacity-70">{desc}</p> : null}
        {node.payload.tags?.length ? (
          <p className="mt-1 text-[11px] uppercase tracking-wide opacity-50">
            {node.payload.tags.join(" · ")}
          </p>
        ) : null}
      </div>
    </button>
  );
}
