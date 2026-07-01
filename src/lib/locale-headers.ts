export function localeHeaders(locale: string): HeadersInit {
  return { "x-locale": locale, "Content-Type": "application/json" };
}
