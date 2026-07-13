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
 * Tiny catalog for QR customer journeys — keeps the RSC/HTML payload small.
 * Only includes namespaces PublicFlow / inactive / menu pages actually read.
 */
export function getPublicJourneyMessages(locale: Locale): Messages {
  const full = getMessages(locale);
  return {
    public: full.public,
    inactive: full.inactive,
    meta: {
      merchantTitle: full.meta.merchantTitle,
      merchantDescription: full.meta.merchantDescription,
    },
    api: {
      invalidEmail: full.api.invalidEmail,
    },
  } as Messages;
}
