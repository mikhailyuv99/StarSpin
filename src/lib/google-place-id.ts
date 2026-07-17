const GOOGLE_MAPS_HOST_RE =
  /^https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|share\.google|(?:www\.)?google\.[a-z.]+\/maps)/i;

/** Pull the first Google Maps / review URL from messy pasted text (duplicate links, extra text). */
export function normalizeGoogleReviewLink(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const chunks = trimmed
    .split(/(?=https?:\/\/)/i)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const chunk of chunks.length > 0 ? chunks : [trimmed]) {
    const url = chunk.replace(/[),.;]+$/, "");
    if (GOOGLE_MAPS_HOST_RE.test(url)) return url;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const first = trimmed.split(/(?=https?:\/\/)/i)[0]?.replace(/[),.;]+$/, "");
    return first || null;
  }

  return null;
}

/** Google Place IDs always start with ChI and are alphanumeric. */
export function isValidGooglePlaceId(value: string | null | undefined): value is string {
  if (!value?.trim()) return false;
  return /^ChI[Jk][A-Za-z0-9_-]{20,}$/.test(value.trim());
}

export function isUnsafeReviewLink(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("share.google") ||
    lower.includes("maps.app.goo.gl") ||
    lower.includes("goo.gl/maps")
  );
}

/** Maps destination safe to send customers to (not short/share links). */
export function isSafeMapsDestination(url: string): boolean {
  if (isUnsafeReviewLink(url)) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (!(host === "google.com" || host.endsWith(".google.com"))) return false;
    if (host === "search.google.com") return u.pathname.includes("/local/writereview");
    // Feature-id write-review deep link: /search?...#lrd=0x…:0x…,3
    if (
      (host === "google.com" || host === "www.google.com") &&
      u.pathname === "/search" &&
      (/^#lrd=0x[a-f0-9]+:0x[a-f0-9]+,3$/i.test(u.hash) || u.searchParams.has("ludocid"))
    ) {
      return true;
    }
    return (
      host === "maps.google.com" ||
      host.startsWith("maps.") ||
      u.pathname.includes("/maps") ||
      u.searchParams.has("cid") ||
      u.searchParams.has("ftid") ||
      u.searchParams.has("q") ||
      u.searchParams.has("query_place_id")
    );
  } catch {
    return false;
  }
}

/** Business name from a resolved Google Maps URL (?q=… or /maps/place/<name>/). */
export function extractMapsQueryFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const q = u.searchParams.get("q") ?? u.searchParams.get("query");
    if (q?.trim()) return decodeURIComponent(q.replace(/\+/g, " ")).trim();

    // Most Maps links are /maps/place/<Business+Name>/@lat,lng,... — the place
    // name lives in the path, not a query param. It's the only reliable text we
    // can feed to Places text search (place_id isn't in the served HTML).
    const pathMatch = u.pathname.match(/\/maps\/place\/([^/@]+)/i);
    if (pathMatch?.[1]) {
      const name = decodeURIComponent(pathMatch[1].replace(/\+/g, " ")).trim();
      if (name && !/^unnamed/i.test(name)) return name;
    }
    return null;
  } catch {
    return null;
  }
}

/** Feature id from Maps URLs — query `ftid=` or path data `!1s0x…:0x…`. */
export function extractFtidFromUrl(url: string): string | null {
  try {
    const decoded = decodeURIComponent(url);
    const fromQuery = decoded.match(/[?&]ftid=(0x[a-f0-9]+:0x[a-f0-9]+)/i);
    if (fromQuery?.[1]) return fromQuery[1].toLowerCase();

    // Short links expand to /maps/place/.../data=!3m1!4b1!4m6!3m5!1s0x…:0x…!8m2!…
    const fromData = decoded.match(/!1s(0x[a-f0-9]+:0x[a-f0-9]+)/i);
    if (fromData?.[1]) return fromData[1].toLowerCase();

    return null;
  } catch {
    return null;
  }
}

/** Lat/lng hint from Maps URLs (`@16.05,108.24` or `!3d16.05!4d108.24`). */
export function extractMapsCoordinatesFromUrl(
  url: string,
): { lat: number; lng: number } | null {
  try {
    const decoded = decodeURIComponent(url);
    const at = decoded.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (at) {
      const lat = Number(at[1]);
      const lng = Number(at[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    const embed = decoded.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (embed) {
      const lat = Number(embed[1]);
      const lng = Number(embed[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    return null;
  } catch {
    return null;
  }
}

/** Decimal CID from Maps feature id (`0x…:0x…`). */
export function ftidToCid(ftid: string): string | null {
  const hex = ftid.split(":")[1];
  if (!hex) return null;
  try {
    return BigInt(hex).toString(10);
  } catch {
    return null;
  }
}

/** Stable Maps listing URL from an ftid pair. */
export function buildMapsCidUrl(ftid: string): string | null {
  const cid = ftidToCid(ftid);
  if (!cid) return null;
  return `https://maps.google.com/maps?cid=${cid}`;
}

/**
 * Direct "write a review" deep link from the Maps feature id (ftid).
 * This is the reliable conversion when Google never exposes a Place ID in the
 * short link: `#lrd=<ftid>,3` opens the review composer for THAT exact listing.
 */
export function buildGoogleFeatureWriteReviewUrl(opts: {
  ftid: string;
  name?: string | null;
}): string | null {
  const ftid = opts.ftid.trim().toLowerCase();
  if (!/^0x[a-f0-9]+:0x[a-f0-9]+$/i.test(ftid)) return null;

  const params = new URLSearchParams();
  const name = opts.name?.trim();
  if (name) params.set("q", name);
  const cid = ftidToCid(ftid);
  if (cid) params.set("ludocid", cid);

  return `https://www.google.com/search?${params.toString()}#lrd=${ftid},3`;
}

/** Extract a Google Place ID from common Maps / review URLs. */
export function extractGooglePlaceId(url: string): string | null {
  const raw = url.trim();
  if (!raw) return null;

  try {
    const decoded = decodeURIComponent(raw);

    const paramMatch =
      decoded.match(/[?&]placeid=([^&]+)/i) ??
      decoded.match(/[?&]place_id=([^&]+)/i) ??
      decoded.match(/[?&]query_place_id=([^&]+)/i);
    if (paramMatch?.[1]) {
      const candidate = cleanPlaceId(paramMatch[1]);
      if (isValidGooglePlaceId(candidate)) return candidate;
      const nested = extractGooglePlaceId(candidate);
      if (nested) return nested;
    }

    const colonMatch = decoded.match(/place_id:(ChI[A-Za-z0-9_-]+)/i);
    if (colonMatch?.[1]) {
      const candidate = cleanPlaceId(colonMatch[1]);
      if (isValidGooglePlaceId(candidate)) return candidate;
    }

    const embedded = decoded.match(/(ChI[Jk][A-Za-z0-9_-]{20,})/);
    if (embedded?.[1]) {
      const candidate = cleanPlaceId(embedded[1]);
      if (isValidGooglePlaceId(candidate)) return candidate;
    }

    return null;
  } catch {
    return null;
  }
}

function cleanPlaceId(value: string): string {
  return value.replace(/!.*/, "").trim();
}

/** Pick a real Place ID, ignoring bad values like pasted share.google URLs. */
export function sanitizeGooglePlaceId(
  storedPlaceId: string | null | undefined,
  reviewLink: string | null | undefined,
): string | null {
  const fromStored = storedPlaceId?.trim();
  if (fromStored && isValidGooglePlaceId(fromStored)) return fromStored;
  if (fromStored) {
    const fromBadStored = extractGooglePlaceId(fromStored);
    if (fromBadStored) return fromBadStored;
  }

  const fromLink = reviewLink?.trim() ? extractGooglePlaceId(reviewLink) : null;
  if (fromLink) return fromLink;

  return null;
}

/** Official writereview URL — only when a valid Place ID exists. */
export function buildGoogleWriteReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

/**
 * Best customer-facing review URL.
 * Never returns share.google / goo.gl links — they break on mobile (blank page).
 */
export function buildGoogleReviewUrl(
  reviewLink: string | null | undefined,
  placeId: string | null | undefined,
): string | null {
  const pid = sanitizeGooglePlaceId(placeId, reviewLink);
  if (pid) return buildGoogleWriteReviewUrl(pid);

  const raw = reviewLink?.trim();
  if (raw && /^https?:\/\//i.test(raw) && !isUnsafeReviewLink(raw)) {
    return raw;
  }

  return null;
}

/**
 * Best customer-facing review URL for an instant client-side open.
 * Never returns share.google links.
 *
 * Short/share Maps links are NOT opened from a cached Place ID alone —
 * those IDs often came from fuzzy HTML/name resolution and can point at the
 * wrong venue. The customer journey must go through /api/google/review so the
 * server re-resolves from the pasted Maps link (cid/ftid + strict geo).
 */
export function pickGoogleReviewOpenUrl(
  reviewLink: string | null | undefined,
  placeId: string | null | undefined,
): string | null {
  const link = reviewLink?.trim();
  if (link) {
    const fromLink = extractGooglePlaceId(link);
    if (fromLink) return buildGoogleWriteReviewUrl(fromLink);

    if (isUnsafeReviewLink(link)) return null;
  }

  return buildGoogleReviewUrl(reviewLink, placeId);
}
