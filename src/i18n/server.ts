import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "./config";
import type { Locale } from "./config";
import { getMessages } from "./get-messages";
import { createTranslator } from "./translate";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  if (value && isLocale(value)) return value;
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
