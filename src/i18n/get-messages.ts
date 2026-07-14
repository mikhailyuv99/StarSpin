import type { Locale } from "./config";
import type { Messages } from "./translate";
import en from "./messages/en.json";
import fr from "./messages/fr.json";
import ru from "./messages/ru.json";
import vi from "./messages/vi.json";
import es from "./messages/es.json";
import ko from "./messages/ko.json";

const catalogs: Record<Locale, Messages> = { en, fr, ru, vi, es, ko };

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? en;
}

/**
 * @deprecated Prefer getMessages(). Partial catalogs break soft-navigation when the
 * root I18nProvider stays mounted (e.g. inactive merchant → /).
 */
export function getPublicJourneyMessages(locale: Locale): Messages {
  return getMessages(locale);
}

