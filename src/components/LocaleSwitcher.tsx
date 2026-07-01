"use client";

import { useI18n } from "@/i18n/client";
import { localeLabels, locales, type Locale } from "@/i18n/config";

type Variant = "light" | "dark" | "minimal" | "brutal";

export function LocaleSwitcher({ variant = "minimal" }: { variant?: Variant }) {
  const { locale, setLocale } = useI18n();

  const base =
    variant === "brutal"
      ? "brutal-select"
      : variant === "dark"
        ? "brutal-select brutal-select-dark"
        : variant === "light"
          ? "brutal-select"
          : "border-transparent bg-transparent text-inherit shadow-none";

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label="Language"
      className={`cursor-pointer outline-none ${base}`}
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeLabels[loc]}
        </option>
      ))}
    </select>
  );
}
