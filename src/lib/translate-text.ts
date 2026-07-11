import type { Locale } from "@/i18n/config";

type TranslateResult = { translations: string[] };

/**
 * Translate strings from one product locale to another.
 * Uses MyMemory's free endpoint (no API key). Best-effort — returns
 * the original text when a segment fails.
 */
export async function translateTexts(
  texts: string[],
  from: Locale,
  to: Locale,
): Promise<string[]> {
  if (from === to || texts.length === 0) return texts;

  const out = [...texts];
  // Deduplicate to cut request volume
  const unique = [...new Set(texts.filter((t) => t.trim().length > 0))];
  const translated = new Map<string, string>();

  for (const text of unique) {
    try {
      const url = new URL("https://api.mymemory.translated.net/get");
      url.searchParams.set("q", text.slice(0, 450));
      url.searchParams.set("langpair", `${from}|${to}`);
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        next: { revalidate: 0 },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        responseData?: { translatedText?: string };
        responseStatus?: number;
      };
      const next = data.responseData?.translatedText?.trim();
      if (next && data.responseStatus === 200) {
        translated.set(text, next);
      }
    } catch {
      /* keep original */
    }
  }

  return out.map((t) => translated.get(t) ?? t);
}

export type { TranslateResult };
