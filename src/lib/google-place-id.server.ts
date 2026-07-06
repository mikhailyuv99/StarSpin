import "server-only";
import {
  buildMapsCidUrl,
  buildGoogleWriteReviewUrl,
  extractFtidFromUrl,
  extractGooglePlaceId,
  extractMapsQueryFromUrl,
  isSafeMapsDestination,
  isValidGooglePlaceId,
  normalizeGoogleReviewLink,
  sanitizeGooglePlaceId,
} from "@/lib/google-place-id";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

export type GoogleLinkResolution = {
  placeId: string | null;
  resolvedUrl: string | null;
};

function emptyResolution(): GoogleLinkResolution {
  return { placeId: null, resolvedUrl: null };
}

function resolution(placeId: string | null, resolvedUrl: string | null = null): GoogleLinkResolution {
  return { placeId, resolvedUrl };
}

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

function pickResolvedUrl(finalUrl: string): string | null {
  if (isSafeMapsDestination(finalUrl)) return finalUrl;

  const ftid = extractFtidFromUrl(finalUrl);
  if (ftid) {
    const cidUrl = buildMapsCidUrl(ftid);
    if (cidUrl) return cidUrl;
  }

  return null;
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

export async function resolveGooglePlaceIdFromLink(url: string): Promise<GoogleLinkResolution> {
  const normalized = normalizeGoogleReviewLink(url) ?? url.trim();
  if (!normalized) return emptyResolution();

  const quick = extractGooglePlaceId(normalized);
  if (quick) return resolution(quick);

  if (!/^https?:\/\//i.test(normalized)) return emptyResolution();

  try {
    const res = await fetch(normalized, {
      redirect: "follow",
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(15_000),
    });

    const finalUrl = res.url;
    const resolvedUrl = pickResolvedUrl(finalUrl);

    const fromUrl = extractGooglePlaceId(finalUrl);
    if (fromUrl) return resolution(fromUrl, resolvedUrl);

    const html = await res.text();
    const fromHtml = extractPlaceIdFromHtml(html.slice(0, 200_000));
    if (fromHtml) return resolution(fromHtml, resolvedUrl);

    const query = extractMapsQueryFromUrl(finalUrl);
    if (query) {
      const fromQuery = await findPlaceIdByTextSearch(query);
      if (fromQuery) return resolution(fromQuery, resolvedUrl);
    }

    return resolution(null, resolvedUrl);
  } catch (err) {
    console.error("resolveGooglePlaceIdFromLink:", err);
    return emptyResolution();
  }
}

export async function resolveMerchantGooglePlaceId(merchant: {
  name?: string | null;
  google_place_id: string | null;
  google_review_link: string | null;
}): Promise<GoogleLinkResolution> {
  const quick = sanitizeGooglePlaceId(merchant.google_place_id, merchant.google_review_link);
  if (quick) return resolution(quick);

  let resolvedUrl: string | null = null;

  const link = merchant.google_review_link?.trim();
  if (link) {
    const fromLink = await resolveGooglePlaceIdFromLink(link);
    resolvedUrl = fromLink.resolvedUrl;
    if (fromLink.placeId) return fromLink;
  }

  const stored = merchant.google_place_id?.trim();
  if (stored && stored.startsWith("http")) {
    const fromStored = await resolveGooglePlaceIdFromLink(stored);
    resolvedUrl = resolvedUrl ?? fromStored.resolvedUrl;
    if (fromStored.placeId) {
      return resolution(fromStored.placeId, fromStored.resolvedUrl ?? resolvedUrl);
    }
  }

  const name = merchant.name?.trim();
  if (name) {
    const fromName = await findPlaceIdByTextSearch(name);
    if (fromName) return resolution(fromName, resolvedUrl);
  }

  if (name && link) {
    const fromCombo = await findPlaceIdByTextSearch(`${name} ${link}`);
    if (fromCombo) return resolution(fromCombo, resolvedUrl);
  }

  return resolution(null, resolvedUrl);
}

function buildMapsPlaceUrl(placeId: string): string {
  return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}`;
}

function buildMapsNameSearchUrl(name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}

/** Final URL customers should open — never a share.google / goo.gl link. */
export function buildReviewOpenUrl(
  placeId: string | null,
  merchantName: string | null,
  userAgent: string,
  resolvedUrl?: string | null,
): string | null {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

  if (placeId) {
    if (isMobile) return buildMapsPlaceUrl(placeId);
    return buildGoogleWriteReviewUrl(placeId);
  }

  if (resolvedUrl && isSafeMapsDestination(resolvedUrl)) {
    return resolvedUrl;
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
): Promise<GoogleLinkResolution> {
  const result = await resolveMerchantGooglePlaceId(merchant);

  if (result.placeId && result.placeId !== merchant.google_place_id) {
    await supabase.from("merchants").update({ google_place_id: result.placeId }).eq("id", merchant.id);
  }

  if (!result.placeId && merchant.google_place_id && !isValidGooglePlaceId(merchant.google_place_id)) {
    await supabase.from("merchants").update({ google_place_id: null }).eq("id", merchant.id);
  }

  return result;
}
