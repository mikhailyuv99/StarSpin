import "server-only";
import {
  extractGooglePlaceId,
  isValidGooglePlaceId,
  sanitizeGooglePlaceId,
} from "@/lib/google-place-id";

async function findPlaceIdByTextSearch(query: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !query.trim()) return null;

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id",
      },
      body: JSON.stringify({ textQuery: query.trim(), maxResultCount: 1 }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { places?: { id?: string }[] };
    const id = data.places?.[0]?.id;
    if (id && isValidGooglePlaceId(id)) return id;
  } catch (err) {
    console.error("findPlaceIdByTextSearch:", err);
  }

  return null;
}

export async function resolveGooglePlaceIdFromLink(url: string): Promise<string | null> {
  const quick = sanitizeGooglePlaceId(null, url);
  if (quick) return quick;

  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;

  try {
    const res = await fetch(trimmed, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(12_000),
    });

    const fromUrl = extractGooglePlaceId(res.url);
    if (fromUrl) return fromUrl;

    const html = await res.text();
    const fromHtml = extractGooglePlaceId(html.slice(0, 120_000));
    if (fromHtml) return fromHtml;
  } catch (err) {
    console.error("resolveGooglePlaceIdFromLink:", err);
  }

  return null;
}

export async function resolveMerchantGooglePlaceId(merchant: {
  name?: string | null;
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

  if (merchant.name?.trim()) {
    const fromName = await findPlaceIdByTextSearch(merchant.name);
    if (fromName) return fromName;
  }

  return null;
}
