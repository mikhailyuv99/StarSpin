import { defaultLocale, isLocale } from "./config";
import type { Locale } from "./config";
import { getMessages } from "./get-messages";
import { createTranslator } from "./translate";

export function resolveRequestLocale(request: Request): Locale {
  const header = request.headers.get("x-locale");
  if (header && isLocale(header)) return header;
  return defaultLocale;
}

export function apiT(locale: Locale) {
  return createTranslator(getMessages(locale));
}
