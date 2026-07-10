import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, localeFromCountry, LOCALE_COOKIE } from "./config";
import type { Locale } from "./config";
import { getMessages } from "./get-messages";
import { createTranslator } from "./translate";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  if (value && isLocale(value)) return value;

  // First visit from France: middleware stamps country before RSC runs,
  // but the locale cookie is only on the response — read geo for this request.
  const h = await headers();
  const geoLocale = localeFromCountry(h.get("x-starspin-country"));
  if (geoLocale) return geoLocale;

  return defaultLocale;
}

export async function getTranslations() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return createTranslator(messages);
}

export async function getLocaleAndTranslations() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { locale, messages, t: createTranslator(messages) };
}
