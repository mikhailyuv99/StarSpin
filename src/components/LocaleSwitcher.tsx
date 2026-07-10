"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { localeLabels, locales, type Locale } from "@/i18n/config";

type Variant = "light" | "dark" | "minimal" | "brutal" | "journey";

const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  fr: "🇫🇷",
  ru: "🇷🇺",
  vi: "🇻🇳",
  es: "🇪🇸",
  ko: "🇰🇷",
};

const localeCodes: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
  ru: "RU",
  vi: "VI",
  es: "ES",
  ko: "KO",
};

export function LocaleSwitcher({
  variant = "brutal",
  align = "right",
  compact = false,
}: {
  variant?: Variant;
  align?: "left" | "right";
  compact?: boolean;
}) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (variant === "minimal") {
    return (
      <div className="locale-switcher locale-switcher--minimal" ref={rootRef}>
        <button
          type="button"
          className="locale-switcher-trigger locale-switcher-trigger--minimal"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          {localeFlags[locale]} {localeLabels[locale]}
        </button>
        {open && (
          <LocaleMenu
            locale={locale}
            setLocale={setLocale}
            onPick={() => setOpen(false)}
            align={align}
            minimal
          />
        )}
      </div>
    );
  }

  const triggerClass =
    variant === "journey"
      ? "locale-switcher-trigger locale-switcher-trigger--journey"
      : variant === "dark"
        ? "locale-switcher-trigger locale-switcher-trigger--dark"
        : "locale-switcher-trigger";

  const menuMinimal = variant === "journey";

  return (
    <div
      className={`locale-switcher${variant === "journey" ? " locale-switcher--journey" : ""}${compact ? " locale-switcher--compact" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        className={triggerClass}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Language"
      >
        <span className="locale-switcher-flag" aria-hidden>
          {localeFlags[locale]}
        </span>
        <span className="locale-switcher-code" aria-hidden>
          {localeCodes[locale]}
        </span>
        <span className="locale-switcher-label">{localeLabels[locale]}</span>
        <span className="locale-switcher-chevron" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open && (
        <LocaleMenu
          locale={locale}
          setLocale={setLocale}
          onPick={() => setOpen(false)}
          align={align}
          minimal={menuMinimal}
          journey={variant === "journey"}
        />
      )}
    </div>
  );
}

function LocaleMenu({
  locale,
  setLocale,
  onPick,
  align,
  minimal,
  journey = false,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
  onPick: () => void;
  align: "left" | "right";
  minimal?: boolean;
  journey?: boolean;
}) {
  return (
    <ul
      className={`locale-switcher-menu ${align === "left" ? "locale-switcher-menu--left" : ""} ${minimal ? "locale-switcher-menu--minimal" : ""} ${journey ? "locale-switcher-menu--journey" : ""}`}
      role="listbox"
    >
      {locales.map((loc) => (
        <li key={loc} role="option" aria-selected={loc === locale}>
          <button
            type="button"
            className={`locale-switcher-option ${loc === locale ? "locale-switcher-option--active" : ""}`}
            onClick={() => {
              setLocale(loc);
              onPick();
            }}
          >
            <span className="locale-switcher-flag" aria-hidden>
              {localeFlags[loc]}
            </span>
            <span>{localeLabels[loc]}</span>
            {loc === locale && <span className="locale-switcher-check">✓</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
