import { NextResponse } from "next/server";
import { clientIpKey, rateLimit } from "@/lib/rate-limit";
import { extractMapsQueryFromUrl, normalizeGoogleReviewLink } from "@/lib/google-place-id";
import { resolveGooglePlaceIdFromLink } from "@/lib/google-place-id.server";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

/** TEMP diagnostics — reports exactly where link resolution fails in production. */
async function diagnose(link: string) {
  const out: Record<string, unknown> = { link };
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  out.apiKeyPresent = !!apiKey;
  out.apiKeyLength = apiKey?.length ?? 0;

  try {
    const res = await fetch(link, {
      redirect: "follow",
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(15_000),
    });
    out.fetchStatus = res.status;
    out.finalUrl = res.url;
    out.extractedName = extractMapsQueryFromUrl(res.url);

    const name = out.extractedName as string | null;
    if (apiKey && name) {
      const sr = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.displayName",
        },
        body: JSON.stringify({ textQuery: name, maxResultCount: 1 }),
        signal: AbortSignal.timeout(15_000),
      });
      out.searchStatus = sr.status;
      out.searchBody = (await sr.text()).slice(0, 500);
    }
  } catch (err) {
    out.error = String(err);
  }
  return out;
}

export async function POST(request: Request) {
  const limited = rateLimit(clientIpKey(request, "google-resolve-place"), 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const wantDebug = new URL(request.url).searchParams.get("debug") === "1";

  let link: string | undefined;
  try {
    const body = (await request.json()) as { link?: string };
    link = normalizeGoogleReviewLink(body.link) ?? body.link?.trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!link || !/^https?:\/\//i.test(link)) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  if (wantDebug) {
    return NextResponse.json(await diagnose(link));
  }

  const resolution = await resolveGooglePlaceIdFromLink(link);
  return NextResponse.json({ ...resolution, normalizedLink: link });
}
