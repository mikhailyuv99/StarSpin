/** Google Place IDs always start with ChI and are alphanumeric. */
export function isValidGooglePlaceId(value: string | null | undefined): value is string {
  if (!value?.trim()) return false;
  return /^ChI[Jk][A-Za-z0-9_-]{20,}$/.test(value.trim());
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

/** Canonical Google "write a review" URL when a Place ID is known. */
export function buildGoogleReviewUrl(
  reviewLink: string | null | undefined,
  placeId: string | null | undefined,
): string | null {
  const pid = sanitizeGooglePlaceId(placeId, reviewLink);
  if (pid) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(pid)}`;
  }

  const raw = reviewLink?.trim();
  if (raw && /^https?:\/\//i.test(raw)) return raw;
  return null;
}

function openNewTab(url: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function buildAndroidMapsIntent(placeId: string, webFallbackUrl: string): string {
  const query = `placeid=${encodeURIComponent(placeId)}`;
  const path = `search.google.com/local/writereview?${query}`;
  const fallback = encodeURIComponent(webFallbackUrl);
  return `intent://${path}#Intent;scheme=https;package=com.google.android.apps.maps;S.browser_fallback_url=${fallback};end`;
}

/**
 * Open Google review flow in a new tab.
 * Uses writereview?placeid= only with a valid ChI… Place ID; otherwise opens the merchant link as-is.
 */
export function openGoogleReview(
  reviewLink: string | null | undefined,
  placeId: string | null | undefined,
): void {
  const webUrl = buildGoogleReviewUrl(reviewLink, placeId);
  if (!webUrl || typeof window === "undefined") return;

  const pid = sanitizeGooglePlaceId(placeId, reviewLink);
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isAndroid && pid) {
    const intentUrl = buildAndroidMapsIntent(pid, webUrl);
    const opened = window.open(intentUrl, "_blank", "noopener,noreferrer");
    if (!opened) openNewTab(webUrl);
    return;
  }

  const opened = window.open(webUrl, "_blank", "noopener,noreferrer");
  if (!opened) openNewTab(webUrl);
}
