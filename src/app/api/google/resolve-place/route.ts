import { NextResponse } from "next/server";
import { clientIpKey, rateLimit } from "@/lib/rate-limit";
import { normalizeGoogleReviewLink } from "@/lib/google-place-id";
import { resolveGooglePlaceIdFromLink } from "@/lib/google-place-id.server";

export async function POST(request: Request) {
  const limited = rateLimit(clientIpKey(request, "google-resolve-place"), 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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

  const resolution = await resolveGooglePlaceIdFromLink(link);
  return NextResponse.json({ ...resolution, normalizedLink: link });
}
