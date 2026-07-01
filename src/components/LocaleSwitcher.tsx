"use client";

import { useI18n } from "@/i18n/client";
import { localeLabels, locales, type Locale } from "@/i18n/config";

type Variant = "light" | "dark" | "minimal";

export function LocaleSwitcher({ variant = "minimal" }: { variant?: Variant }) {
  const { locale, setLocale } = useI18n();

  const base =
    variant === "dark"
      ? "border-zinc-700 bg-zinc-900 text-zinc-200"
      : variant === "light"
        ? "border-border bg-white text-ink"
        : "border-transparent bg-transparent text-inherit";

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label="Language"
      className={`cursor-pointer rounded-sm border px-2 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-ink ${base}`}
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeLabels[loc]}
        </option>
      ))}
    </select>
  );
}
