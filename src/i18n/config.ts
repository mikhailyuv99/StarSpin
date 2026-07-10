export const locales = ["en", "fr", "ru", "vi", "es", "ko"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "locale";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ru: "Russian",
  vi: "Vietnamese",
  es: "Spanish",
  ko: "한국어",
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localeToIntl(locale: Locale): string {
  const map: Record<Locale, string> = {
    en: "en-US",
    fr: "fr-FR",
    ru: "ru-RU",
    vi: "vi-VN",
    es: "es-ES",
    ko: "ko-KR",
  };
  return map[locale];
}

/** Default UI language from IP country when no locale cookie is set. */
export function localeFromCountry(country: string | null | undefined): Locale | null {
  if (country?.toUpperCase() === "FR") return "fr";
  return null;
}
