import "server-only";
import {
  buildMapsCidUrl,
  buildGoogleWriteReviewUrl,
  extractFtidFromUrl,
  extractGooglePlaceId,
  extractMapsCoordinatesFromUrl,
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

type PlacesSearchOptions = {
  query: string;
  location?: { lat: number; lng: number } | null;
};

function emptyResolution(): GoogleLinkResolution {
  return { placeId: null, resolvedUrl: null };
}

function resolution(placeId: string | null, resolvedUrl: string | null = null): GoogleLinkResolution {
  return { placeId, resolvedUrl };
}

function normalizePlacesId(id: string | null | undefined): string | null {
  if (!id?.trim()) return null;
  const bare = id.trim().replace(/^places\//, "");
  return isValidGooglePlaceId(bare) ? bare : null;
}

function extractPlaceIdFromHtml(html: string): string | null {
  const patterns = [
    /"place_id"\s*:\s*"(ChI[Jk][A-Za-z0-9_-]+)"/,
    /"placeId"\s*:\s*"(ChI[Jk][A-Za-z0-9_-]+)"/,
    /placeid=(ChI[Jk][A-Za-z0-9_-]+)/i,
    /place_id[=:](ChI[Jk][A-Za-z0-9_-]+)/i,
    /query_place_id=(ChI[Jk][A-Za-z0-9_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1] && isValidGooglePlaceId(match[1])) return match[1];
  }

  // Do NOT greedily match the first ChI… in the whole HTML — Maps pages embed
  // many nearby businesses and the first hit is often the wrong city/country.
  return null;
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

function resolvedUrlFromMapsTarget(url: string): string | null {
  const ftid = extractFtidFromUrl(url);
  if (ftid) {
    const cidUrl = buildMapsCidUrl(ftid);
    if (cidUrl) return cidUrl;
  }
  return pickResolvedUrl(url);
}

async function findPlaceIdByTextSearch(opts: PlacesSearchOptions): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const query = opts.query.trim();
  if (!apiKey || !query) return null;

  try {
    const body: Record<string, unknown> = {
      textQuery: query,
      maxResultCount: 5,
    };

    // Bias (and preferentially restrict) to the Maps pin — without this,
    // "Onda Lounge" returns a same-name venue in another country.
    if (opts.location) {
      body.locationBias = {
        circle: {
          center: {
            latitude: opts.location.lat,
            longitude: opts.location.lng,
          },
          radius: 5000.0,
        },
      };
    }

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.googleMapsUri,places.location,places.displayName",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Places searchText failed:", res.status, errBody.slice(0, 300));
      return null;
    }

    const data = (await res.json()) as {
      places?: {
        id?: string;
        googleMapsUri?: string;
        location?: { latitude?: number; longitude?: number };
      }[];
    };

    const places = data.places ?? [];
    if (places.length === 0) return null;

    // If we have coordinates, pick the closest match instead of rank #1.
    if (opts.location) {
      let best: { id: string; dist: number } | null = null;
      for (const place of places) {
        const id =
          normalizePlacesId(place.id) ??
          (place.googleMapsUri ? extractGooglePlaceId(place.googleMapsUri) : null);
        if (!id) continue;
        const lat = place.location?.latitude;
        const lng = place.location?.longitude;
        if (typeof lat !== "number" || typeof lng !== "number") continue;
        const dist =
          Math.hypot(lat - opts.location.lat, lng - opts.location.lng);
        if (!best || dist < best.dist) best = { id, dist };
      }
      if (best && best.dist < 0.25) return best.id; // ~25km of degrees — plenty for city-level
    }

    for (const place of places) {
      const id =
        normalizePlacesId(place.id) ??
        (place.googleMapsUri ? extractGooglePlaceId(place.googleMapsUri) : null);
      if (id) return id;
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
  if (quick) return resolution(quick, buildGoogleWriteReviewUrl(quick));

  if (!/^https?:\/\//i.test(normalized)) return emptyResolution();

  try {
    const res = await fetch(normalized, {
      redirect: "follow",
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(15_000),
    });

    const finalUrl = res.url;
    const location = extractMapsCoordinatesFromUrl(finalUrl);
    const ftid = extractFtidFromUrl(finalUrl);
    const cidResolved = resolvedUrlFromMapsTarget(finalUrl);
    const resolvedUrl = cidResolved ?? pickResolvedUrl(finalUrl);

    const fromUrl = extractGooglePlaceId(finalUrl);
    if (fromUrl) return resolution(fromUrl, buildGoogleWriteReviewUrl(fromUrl));

    const html = await res.text();
    const fromHtml = extractPlaceIdFromHtml(html.slice(0, 200_000));
    // Only trust HTML place ids when we also have a location/ftid context;
    // otherwise Maps pages leak unrelated ChI ids.
    if (fromHtml && (location || ftid)) {
      return resolution(fromHtml, buildGoogleWriteReviewUrl(fromHtml));
    }

    const query = extractMapsQueryFromUrl(finalUrl);
    if (query) {
      const searchQuery =
        location != null
          ? `${query}`
          : query;
      const fromQuery = await findPlaceIdByTextSearch({
        query: searchQuery,
        location,
      });
      if (fromQuery) return resolution(fromQuery, buildGoogleWriteReviewUrl(fromQuery));

      // With coordinates, bias harder using an explicit near-query too.
      if (location) {
        const near = await findPlaceIdByTextSearch({
          query: `${query} near ${location.lat.toFixed(5)},${location.lng.toFixed(5)}`,
          location,
        });
        if (near) return resolution(near, buildGoogleWriteReviewUrl(near));
      }
    }

    // Prefer the exact Maps listing (cid/ftid) over any fuzzy name match.
    if (resolvedUrl) return resolution(null, resolvedUrl);

    return emptyResolution();
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
  const link = normalizeGoogleReviewLink(merchant.google_review_link) ?? merchant.google_review_link?.trim();

  // Always resolve from the Maps link first. A stored Place ID from a previous
  // ambiguous name search (e.g. "Onda Lounge" → US venue) must not win forever.
  if (link) {
    const direct = extractGooglePlaceId(link);
    if (direct) return resolution(direct, buildGoogleWriteReviewUrl(direct));

    const fromLink = await resolveGooglePlaceIdFromLink(link);
    if (fromLink.placeId || fromLink.resolvedUrl) return fromLink;
  }

  const storedQuick = sanitizeGooglePlaceId(merchant.google_place_id, null);
  if (storedQuick) return resolution(storedQuick, buildGoogleWriteReviewUrl(storedQuick));

  const stored = merchant.google_place_id?.trim();
  if (stored && stored.startsWith("http")) {
    const fromStored = await resolveGooglePlaceIdFromLink(stored);
    if (fromStored.placeId || fromStored.resolvedUrl) return fromStored;
  }

  // Intentionally NO bare merchant-name Places text search — duplicate names
  // worldwide (Onda Lounge US vs VN) caused wrong writereview targets.

  return emptyResolution();
}

function buildMapsNameSearchUrl(name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}

/** Final URL customers should open — never a share.google / goo.gl link. */
export function buildReviewOpenUrl(
  placeId: string | null,
  merchantName: string | null,
  _userAgent: string,
  resolvedUrl?: string | null,
): string | null {
  if (placeId) {
    return buildGoogleWriteReviewUrl(placeId);
  }

  if (resolvedUrl && isSafeMapsDestination(resolvedUrl)) {
    return resolvedUrl;
  }

  // Last-resort Maps search (no writereview) — better than a wrong Place ID.
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

  // Clear a stale/wrong Place ID when the Maps link cannot confirm it —
  // otherwise customers keep landing on the old writereview place forever.
  if (!result.placeId && merchant.google_place_id) {
    await supabase.from("merchants").update({ google_place_id: null }).eq("id", merchant.id);
  }

  return result;
}
