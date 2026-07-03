/** Google Place IDs always start with ChI and are alphanumeric. */
export function isValidGooglePlaceId(value: string | null | undefined): value is string {
  if (!value?.trim()) return false;
  return /^ChI[Jk][A-Za-z0-9_-]{20,}$/.test(value.trim());
}

function isUnsafeReviewLink(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("share.google") ||
    lower.includes("maps.app.goo.gl") ||
    lower.includes("goo.gl/maps")
  );
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
