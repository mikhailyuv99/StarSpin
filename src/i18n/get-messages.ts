import type { Locale } from "./config";
import type { Messages } from "./translate";
import en from "./messages/en.json";
import ru from "./messages/ru.json";
import vi from "./messages/vi.json";
import es from "./messages/es.json";

const catalogs: Record<Locale, Messages> = { en, ru, vi, es };

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? en;
}
