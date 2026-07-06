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
    if (!host.endsWith("google.com")) return false;
    if (host === "search.google.com") return u.pathname.includes("/local/writereview");
    return (
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

/** Business name from a resolved Google Maps URL (?q=…). */
export function extractMapsQueryFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const q = u.searchParams.get("q") ?? u.searchParams.get("query");
    if (!q?.trim()) return null;
    return decodeURIComponent(q.replace(/\+/g, " ")).trim();
  } catch {
    return null;
  }
}

/** Feature id from Maps URLs (e.g. ftid=0xabc:0xdef). */
export function extractFtidFromUrl(url: string): string | null {
  try {
    const decoded = decodeURIComponent(url);
    const match = decoded.match(/[?&]ftid=(0x[a-f0-9]+:0x[a-f0-9]+)/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/** Stable Maps listing URL from an ftid pair. */
export function buildMapsCidUrl(ftid: string): string | null {
  const hex = ftid.split(":")[1];
  if (!hex) return null;
  try {
    const cid = BigInt(hex).toString(10);
    return `https://maps.google.com/maps?cid=${cid}`;
  } catch {
    return null;
  }
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

/** writereview URL — only when a valid Place ID exists. */
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

/** Best customer-facing review URL. Never returns share.google links. */
export function pickGoogleReviewOpenUrl(
  reviewLink: string | null | undefined,
  placeId: string | null | undefined,
): string | null {
  return buildGoogleReviewUrl(reviewLink, placeId);
}
