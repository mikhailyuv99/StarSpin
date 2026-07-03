import "server-only";
import {
  buildGoogleWriteReviewUrl,
  extractGooglePlaceId,
  isValidGooglePlaceId,
  sanitizeGooglePlaceId,
} from "@/lib/google-place-id";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

function extractPlaceIdFromHtml(html: string): string | null {
  const patterns = [
    /"place_id"\s*:\s*"(ChI[Jk][A-Za-z0-9_-]+)"/,
    /"placeId"\s*:\s*"(ChI[Jk][A-Za-z0-9_-]+)"/,
    /placeid=(ChI[Jk][A-Za-z0-9_-]+)/i,
    /place_id[=:](ChI[Jk][A-Za-z0-9_-]+)/i,
    /query_place_id=(ChI[Jk][A-Za-z0-9_-]+)/i,
    /(ChI[Jk][A-Za-z0-9_-]{20,})/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1] && isValidGooglePlaceId(match[1])) return match[1];
  }

  return extractGooglePlaceId(html);
}

async function findPlaceIdByTextSearch(query: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !query.trim()) return null;

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.googleMapsUri",
      },
      body: JSON.stringify({ textQuery: query.trim(), maxResultCount: 3 }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Places searchText failed:", res.status, body.slice(0, 300));
      return null;
    }

    const data = (await res.json()) as {
      places?: { id?: string; googleMapsUri?: string }[];
    };

    for (const place of data.places ?? []) {
      if (place.id && isValidGooglePlaceId(place.id)) return place.id;
      if (place.googleMapsUri) {
        const fromUri = extractGooglePlaceId(place.googleMapsUri);
        if (fromUri) return fromUri;
      }
    }
  } catch (err) {
    console.error("findPlaceIdByTextSearch:", err);
  }

  return null;
}

export async function resolveGooglePlaceIdFromLink(url: string): Promise<string | null> {
  const quick = extractGooglePlaceId(url);
  if (quick) return quick;

  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;

  try {
    const res = await fetch(trimmed, {
      redirect: "follow",
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(15_000),
    });

    const fromUrl = extractGooglePlaceId(res.url);
    if (fromUrl) return fromUrl;

    const html = await res.text();
    const fromHtml = extractPlaceIdFromHtml(html.slice(0, 200_000));
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

  const link = merchant.google_review_link?.trim();
  if (link) {
    const fromLink = await resolveGooglePlaceIdFromLink(link);
    if (fromLink) return fromLink;
  }

  const stored = merchant.google_place_id?.trim();
  if (stored && stored.startsWith("http")) {
    const fromStored = await resolveGooglePlaceIdFromLink(stored);
    if (fromStored) return fromStored;
  }

  const name = merchant.name?.trim();
  if (name) {
    const fromName = await findPlaceIdByTextSearch(name);
    if (fromName) return fromName;
  }

  if (name && link) {
    const fromCombo = await findPlaceIdByTextSearch(`${name} ${link}`);
    if (fromCombo) return fromCombo;
  }

  return null;
}

function buildMapsPlaceUrl(placeId: string): string {
  return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}`;
}

function buildMapsNameSearchUrl(name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}

/** Final URL customers should open — never a share.google link. */
export function buildReviewOpenUrl(
  placeId: string | null,
  merchantName: string | null,
  userAgent: string,
): string | null {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

  if (placeId) {
    if (isMobile) return buildMapsPlaceUrl(placeId);
    return buildGoogleWriteReviewUrl(placeId);
  }

  if (merchantName?.trim()) {
    return buildMapsNameSearchUrl(merchantName.trim());
  }

  return null;
}

export async function resolveAndPersistMerchantPlaceId(
  supabase: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>,
  merchant: {
    id: string;
    name: string;
    google_place_id: string | null;
    google_review_link: string | null;
  },
): Promise<string | null> {
  const placeId = await resolveMerchantGooglePlaceId(merchant);

  if (placeId && placeId !== merchant.google_place_id) {
    await supabase.from("merchants").update({ google_place_id: placeId }).eq("id", merchant.id);
  }

  if (!placeId && merchant.google_place_id && !isValidGooglePlaceId(merchant.google_place_id)) {
    await supabase.from("merchants").update({ google_place_id: null }).eq("id", merchant.id);
  }

  return placeId;
}
