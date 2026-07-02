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
