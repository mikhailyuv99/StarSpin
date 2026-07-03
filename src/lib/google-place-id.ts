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
      return cleanPlaceId(paramMatch[1]);
    }

    const colonMatch = decoded.match(/place_id:(ChI[A-Za-z0-9_-]+)/i);
    if (colonMatch?.[1]) {
      return cleanPlaceId(colonMatch[1]);
    }

    const embedded = decoded.match(/(ChI[Jk][A-Za-z0-9_-]{20,})/);
    if (embedded?.[1]) {
      return cleanPlaceId(embedded[1]);
    }

    return null;
  } catch {
    return null;
  }
}

function cleanPlaceId(value: string): string {
  return value.replace(/!.*/, "").trim();
}

/** Canonical Google "write a review" URL. */
export function buildGoogleReviewUrl(
  reviewLink: string | null | undefined,
  placeId: string | null | undefined,
): string | null {
  const pid =
    placeId?.trim() ||
    (reviewLink?.trim() ? extractGooglePlaceId(reviewLink) : null);
  if (pid) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(pid)}`;
  }
  const raw = reviewLink?.trim();
  return raw || null;
}

function resolvePlaceId(
  reviewLink: string | null | undefined,
  placeId: string | null | undefined,
): string | null {
  return (
    placeId?.trim() ||
    (reviewLink?.trim() ? extractGooglePlaceId(reviewLink) : null) ||
    null
  );
}

function openNewTab(url: string): boolean {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return true;
}

function buildAndroidMapsIntent(placeId: string, webFallbackUrl: string): string {
  const query = `placeid=${encodeURIComponent(placeId)}`;
  const path = `search.google.com/local/writereview?${query}`;
  const fallback = encodeURIComponent(webFallbackUrl);
  return `intent://${path}#Intent;scheme=https;package=com.google.android.apps.maps;S.browser_fallback_url=${fallback};end`;
}

/**
 * Open Google review flow in a new tab/window.
 * On Android, tries the Maps app first (falls back to browser tab).
 */
export function openGoogleReview(
  reviewLink: string | null | undefined,
  placeId: string | null | undefined,
): void {
  const webUrl = buildGoogleReviewUrl(reviewLink, placeId);
  if (!webUrl || typeof window === "undefined") return;

  const pid = resolvePlaceId(reviewLink, placeId);
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);

  if (isAndroid && pid) {
    const intentUrl = buildAndroidMapsIntent(pid, webUrl);
    const opened = window.open(intentUrl, "_blank", "noopener,noreferrer");
    if (!opened) {
      openNewTab(webUrl);
    }
    return;
  }

  const opened = window.open(webUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    openNewTab(webUrl);
  }
}
