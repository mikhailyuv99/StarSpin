import "server-only";
import {
  buildMapsCidUrl,
  buildGoogleFeatureWriteReviewUrl,
  buildGoogleWriteReviewUrl,
  extractFtidFromUrl,
  extractGooglePlaceId,
  extractMapsCoordinatesFromUrl,
  extractMapsQueryFromUrl,
  ftidToCid,
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
  /** When set, prefer an exact cid/ftid match from googleMapsUri over name fuzzy matching. */
  ftid?: string | null;
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

/** Exact Place ID from Maps feature id (cid) via Legacy Details — may be disabled. */
async function findPlaceIdByCidLegacy(ftid: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) return null;

  const cid = ftidToCid(ftid);
  if (!cid) return null;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("cid", cid);
    url.searchParams.set("fields", "place_id,name,geometry");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      console.error("Place Details by cid (legacy) failed:", res.status);
      return null;
    }

    const data = (await res.json()) as {
      status?: string;
      error_message?: string;
      result?: { place_id?: string };
    };
    if (data.status && data.status !== "OK") {
      console.warn("Place Details by cid (legacy) status:", data.status, data.error_message ?? "");
      return null;
    }
    return normalizePlacesId(data.result?.place_id) ?? null;
  } catch (err) {
    console.error("findPlaceIdByCidLegacy:", err);
    return null;
  }
}

type PlacesHit = {
  id?: string;
  googleMapsUri?: string;
  location?: { latitude?: number; longitude?: number };
  displayName?: { text?: string };
};

/** True when a Places (New) hit is the same Maps listing as the merchant's ftid/cid. */
function placeMatchesListing(place: PlacesHit, ftid: string): boolean {
  const uri = place.googleMapsUri?.trim();
  if (!uri) return false;

  const uriFtid = extractFtidFromUrl(uri);
  if (uriFtid && uriFtid === ftid.toLowerCase()) return true;

  const expectedCid = ftidToCid(ftid);
  if (!expectedCid) return false;

  try {
    const u = new URL(uri);
    if (u.searchParams.get("cid") === expectedCid) return true;
  } catch {
    // fall through
  }
  return uri.includes(`cid=${expectedCid}`);
}

function placeIdFromHit(place: PlacesHit): string | null {
  return (
    normalizePlacesId(place.id) ??
    (place.googleMapsUri ? extractGooglePlaceId(place.googleMapsUri) : null)
  );
}

async function searchTextPlaces(opts: {
  query: string;
  location: { lat: number; lng: number };
  radiusMeters: number;
  restrict: boolean;
}): Promise<PlacesHit[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) return [];

  const circle = {
    center: {
      latitude: opts.location.lat,
      longitude: opts.location.lng,
    },
    radius: opts.radiusMeters,
  };

  const body: Record<string, unknown> = {
    textQuery: opts.query,
    maxResultCount: 10,
  };
  if (opts.restrict) {
    body.locationRestriction = { circle };
  } else {
    body.locationBias = { circle };
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
    return [];
  }

  const data = (await res.json()) as { places?: PlacesHit[] };
  return data.places ?? [];
}

/**
 * Resolve Place ID with Places API (New).
 * When ftid is known, match the listing by cid/ftid in googleMapsUri — 100% exact.
 */
async function findPlaceIdByTextSearch(opts: PlacesSearchOptions): Promise<string | null> {
  const query = opts.query.trim();
  if (!process.env.GOOGLE_PLACES_API_KEY?.trim() || !query) return null;
  if (!opts.location) return null;

  const radiusMeters = opts.radiusMeters ?? 500;
  const ftid = opts.ftid?.trim().toLowerCase() || null;

  try {
    // Prefer hard restriction; if empty (or API rejects), retry with bias.
    let places = await searchTextPlaces({
      query,
      location: opts.location,
      radiusMeters,
      restrict: true,
    });
    if (places.length === 0) {
      places = await searchTextPlaces({
        query,
        location: opts.location,
        radiusMeters,
        restrict: false,
      });
    }
    if (places.length === 0) return null;

    // Exact listing match via ftid/cid — never a similarly named venue.
    if (ftid) {
      for (const place of places) {
        if (!placeMatchesListing(place, ftid)) continue;
        const id = placeIdFromHit(place);
        if (id) return id;
      }
    }

    let best: { id: string; dist: number } | null = null;
    for (const place of places) {
      const id = placeIdFromHit(place);
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

    const query = extractMapsQueryFromUrl(finalUrl);

    // 1) Legacy Place Details ?cid= (often disabled on Places API New–only keys).
    if (ftid) {
      const fromCid = await findPlaceIdByCidLegacy(ftid);
      if (fromCid) return resolution(fromCid, buildGoogleWriteReviewUrl(fromCid));
    }

    // 2) Places API (New) text search — match the exact ftid/cid from the Maps link.
    if (query && location) {
      const radii = ftid ? [100, 500, 2000, 5000] : [500, 2000];
      for (const radiusMeters of radii) {
        const fromQuery = await findPlaceIdByTextSearch({
          query,
          location,
          radiusMeters,
          ftid,
        });
        if (fromQuery) return resolution(fromQuery, buildGoogleWriteReviewUrl(fromQuery));
      }
    }

    // 3) Direct write-review deep link from the Maps feature id.
    // `#lrd=<ftid>,3` opens the review composer for THIS exact listing.
    if (ftid) {
      const featureWrite = buildGoogleFeatureWriteReviewUrl({ ftid, name: query });
      if (featureWrite) return resolution(null, featureWrite);
    }

    // 4) Exact Maps listing via cid as last resort.
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
