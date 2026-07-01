export const locales = ["en", "ru", "vi", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "locale";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  vi: "Tiếng Việt",
  es: "Español",
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
  };
  return map[locale];
}
