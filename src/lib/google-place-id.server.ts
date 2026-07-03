import "server-only";
import {
  extractGooglePlaceId,
  isValidGooglePlaceId,
  sanitizeGooglePlaceId,
} from "@/lib/google-place-id";

export async function resolveGooglePlaceIdFromLink(url: string): Promise<string | null> {
  const quick = sanitizeGooglePlaceId(null, url);
  if (quick) return quick;

  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;

  try {
    const res = await fetch(trimmed, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; STARSPIN/1.0; +https://starspin.cc)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10_000),
    });

    const fromUrl = extractGooglePlaceId(res.url);
    if (fromUrl) return fromUrl;

    const html = await res.text();
    const fromHtml = extractGooglePlaceId(html.slice(0, 80_000));
    if (fromHtml) return fromHtml;
  } catch (err) {
    console.error("resolveGooglePlaceIdFromLink:", err);
  }

  return null;
}

export async function resolveMerchantGooglePlaceId(merchant: {
  google_place_id: string | null;
  google_review_link: string | null;
}): Promise<string | null> {
  const quick = sanitizeGooglePlaceId(merchant.google_place_id, merchant.google_review_link);
  if (quick) return quick;

  const candidates = [merchant.google_review_link, merchant.google_place_id].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  for (const candidate of candidates) {
    if (isValidGooglePlaceId(candidate)) return candidate;
    const resolved = await resolveGooglePlaceIdFromLink(candidate);
    if (resolved) return resolved;
  }

  return null;
}
