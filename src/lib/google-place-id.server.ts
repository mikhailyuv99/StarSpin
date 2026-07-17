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

/** Hard max distance for accepting a Places text-search hit (meters). */
const MAX_PLACE_DISTANCE_M = 1500;

export type GoogleLinkResolution = {
  placeId: string | null;
  resolvedUrl: string | null;
};

type PlacesSearchOptions = {
  query: string;
  location?: { lat: number; lng: number } | null;
  radiusMeters?: number;
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

function normalizeBusinessName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NAME_STOPWORDS = new Set([
  "food",
  "truck",
  "restaurant",
  "cafe",
  "café",
  "bar",
  "the",
  "and",
  "llc",
  "sarl",
  "sas",
  "inc",
  "ltd",
]);

/** Require real name overlap so "La Calanqua" never matches "La Calaca". */
export function namesLooselyMatch(expected: string, actual: string): boolean {
  const a = normalizeBusinessName(expected);
  const b = normalizeBusinessName(actual);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;

  const tokensA = a
    .split(" ")
    .filter((t) => t.length > 2 && !NAME_STOPWORDS.has(t));
  if (tokensA.length === 0) return false;

  const matched = tokensA.filter((t) => b.includes(t));
  return matched.length >= Math.ceil(tokensA.length * 0.7);
}

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Exact Place ID from Maps feature id (cid) — never a fuzzy name guess. */
async function findPlaceIdByCid(ftid: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  const hex = ftid.split(":")[1];
  if (!hex) return null;

  let cid: string;
  try {
    // ftid feature half is already `0x…` — do not prefix another 0x.
    cid = BigInt(hex).toString(10);
  } catch {
    return null;
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("cid", cid);
    url.searchParams.set("fields", "place_id,name,geometry");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      console.error("Place Details by cid failed:", res.status);
      return null;
    }

    const data = (await res.json()) as {
      status?: string;
      result?: { place_id?: string };
    };
    if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Place Details by cid status:", data.status);
    }
    return normalizePlacesId(data.result?.place_id) ?? null;
  } catch (err) {
    console.error("findPlaceIdByCid:", err);
    return null;
  }
}

async function findPlaceIdByTextSearch(opts: PlacesSearchOptions): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const query = opts.query.trim();
  if (!apiKey || !query) return null;

  // Without a pin, text search is worldwide fuzzy matching — refuse it.
  if (!opts.location) return null;

  const radiusMeters = opts.radiusMeters ?? 500;

  try {
    const body: Record<string, unknown> = {
      textQuery: query,
      maxResultCount: 5,
      // Hard circle — results outside are excluded (unlike locationBias).
      locationRestriction: {
        circle: {
          center: {
            latitude: opts.location.lat,
            longitude: opts.location.lng,
          },
          radius: radiusMeters,
        },
      },
    };

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
        displayName?: { text?: string };
      }[];
    };

    const places = data.places ?? [];
    if (places.length === 0) return null;

    let best: { id: string; dist: number } | null = null;
    for (const place of places) {
      const id =
        normalizePlacesId(place.id) ??
        (place.googleMapsUri ? extractGooglePlaceId(place.googleMapsUri) : null);
      if (!id) continue;

      const displayName = place.displayName?.text?.trim() ?? "";
      if (displayName && !namesLooselyMatch(query, displayName)) continue;

      const lat = place.location?.latitude;
      const lng = place.location?.longitude;
      if (typeof lat !== "number" || typeof lng !== "number") continue;

      const dist = haversineMeters(opts.location, { lat, lng });
      if (dist > MAX_PLACE_DISTANCE_M) continue;
      if (!best || dist < best.dist) best = { id, dist };
    }

    return best?.id ?? null;
  } catch (err) {
    console.error("findPlaceIdByTextSearch:", err);
  }

  return null;
}

/** Follow share.google / short links until we land on a Maps URL when possible. */
async function expandGoogleMapsLink(url: string): Promise<{ finalUrl: string; html: string }> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: BROWSER_HEADERS,
    signal: AbortSignal.timeout(15_000),
  });

  let finalUrl = res.url;
  let html = await res.text();

  // share.google often lands on a share interstitial — pull an embedded Maps URL.
  if (!extractFtidFromUrl(finalUrl) && !extractMapsCoordinatesFromUrl(finalUrl)) {
    const embedded =
      html.match(
        /https?:\/\/(?:www\.)?google\.[a-z.]+\/maps\/place\/[^"'\s<>]+/i,
      )?.[0] ??
      html.match(/https?:\/\/maps\.app\.goo\.gl\/[A-Za-z0-9]+/i)?.[0] ??
      null;

    if (embedded) {
      const decoded = embedded.replace(/&amp;/g, "&");
      if (decoded !== finalUrl) {
        const nested = await fetch(decoded, {
          redirect: "follow",
          headers: BROWSER_HEADERS,
          signal: AbortSignal.timeout(15_000),
        });
        finalUrl = nested.url;
        html = await nested.text();
      }
    }
  }

  return { finalUrl, html };
}

export async function resolveGooglePlaceIdFromLink(url: string): Promise<GoogleLinkResolution> {
  const normalized = normalizeGoogleReviewLink(url) ?? url.trim();
  if (!normalized) return emptyResolution();

  const quick = extractGooglePlaceId(normalized);
  if (quick) return resolution(quick, buildGoogleWriteReviewUrl(quick));

  if (!/^https?:\/\//i.test(normalized)) return emptyResolution();

  try {
    const { finalUrl } = await expandGoogleMapsLink(normalized);
    const location = extractMapsCoordinatesFromUrl(finalUrl);
    const ftid = extractFtidFromUrl(finalUrl);
    const cidResolved = resolvedUrlFromMapsTarget(finalUrl);
    const resolvedUrl = cidResolved ?? pickResolvedUrl(finalUrl);

    const fromUrl = extractGooglePlaceId(finalUrl);
    if (fromUrl) return resolution(fromUrl, buildGoogleWriteReviewUrl(fromUrl));

    // 1) Exact listing identity from ftid/cid — never a nearby business.
    if (ftid) {
      const fromCid = await findPlaceIdByCid(ftid);
      if (fromCid) return resolution(fromCid, buildGoogleWriteReviewUrl(fromCid));
    }

    // 2) Strict geo + name text search only (no HTML place_id scrape — Maps
    // pages embed dozens of nearby ChI ids, e.g. Cannes next to Valbonne).
    const query = extractMapsQueryFromUrl(finalUrl);
    if (query && location) {
      for (const radiusMeters of [500, 2000]) {
        const fromQuery = await findPlaceIdByTextSearch({
          query,
          location,
          radiusMeters,
        });
        if (fromQuery) return resolution(fromQuery, buildGoogleWriteReviewUrl(fromQuery));
      }
    }

    // 3) Exact Maps listing via cid/ftid beats any uncertain Place ID.
    // Customers land on the correct place page (reviews) instead of a wrong writereview.
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

/** Final URL customers should open — never a share.google / goo.gl link. */
export function buildReviewOpenUrl(
  placeId: string | null,
  _merchantName: string | null,
  _userAgent: string,
  resolvedUrl?: string | null,
): string | null {
  if (placeId) {
    return buildGoogleWriteReviewUrl(placeId);
  }

  if (resolvedUrl && isSafeMapsDestination(resolvedUrl)) {
    return resolvedUrl;
  }

  // Do not fall back to a bare name Maps search — that reintroduces wrong venues.
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
