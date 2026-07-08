export const locales = ["en", "ru", "vi", "es", "ko"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "locale";

export const localeLabels: Record<Locale, string> = {
  en: "English",
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
    ru: "ru-RU",
    vi: "vi-VN",
    es: "es-ES",
    ko: "ko-KR",
  };
  return map[locale];
}
