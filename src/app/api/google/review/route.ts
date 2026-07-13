import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMerchantLive } from "@/lib/merchant-access";
import { clientIpKey, rateLimit } from "@/lib/rate-limit";
import {
  buildGoogleWriteReviewUrl,
  sanitizeGooglePlaceId,
} from "@/lib/google-place-id";
import {
  buildReviewOpenUrl,
  resolveAndPersistMerchantPlaceId,
} from "@/lib/google-place-id.server";

function reviewResponse(destination: string, wantsJson: boolean) {
  if (wantsJson) {
    return NextResponse.json(
      { url: destination },
      {
        headers: {
          "Cache-Control": "private, max-age=300",
        },
      },
    );
  }
  return NextResponse.redirect(destination, {
    status: 302,
    headers: {
      // Place-ID writereview URLs are stable; short cache helps repeat taps.
      "Cache-Control": "private, max-age=120",
    },
  });
}

export async function GET(request: Request) {
  const limited = rateLimit(clientIpKey(request, "google-review"), 40, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const requestUrl = new URL(request.url);
  const slug = requestUrl.searchParams.get("slug")?.trim().toLowerCase();
  const wantsJson = requestUrl.searchParams.get("format") === "json";
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { data: merchant, error } = await supabase
    .from("merchants")
    .select("id, name, slug, subscription_status, google_place_id, google_review_link")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !merchant || !isMerchantLive(merchant.subscription_status)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!merchant.google_review_link?.trim()) {
    return NextResponse.json({ error: "No review link configured" }, { status: 404 });
  }

  // Instant path: never re-fetch Maps / Places when we already have a Place ID.
  const knownPlaceId = sanitizeGooglePlaceId(
    merchant.google_place_id,
    merchant.google_review_link,
  );
  if (knownPlaceId) {
    return reviewResponse(buildGoogleWriteReviewUrl(knownPlaceId), wantsJson);
  }

  const resolution = await resolveAndPersistMerchantPlaceId(supabase, merchant);
  const userAgent = request.headers.get("user-agent") ?? "";
  const destination = buildReviewOpenUrl(
    resolution.placeId,
    merchant.name,
    userAgent,
    resolution.resolvedUrl,
  );

  if (!destination) {
    return NextResponse.json({ error: "Could not resolve review link" }, { status: 502 });
  }

  return reviewResponse(destination, wantsJson);
}
