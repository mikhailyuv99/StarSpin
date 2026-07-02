import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY not set" }, { status: 500 });
  }

  const supabase = createAdminClient();
  const { data: merchants } = await supabase
    .from("merchants")
    .select("id, google_place_id")
    .not("google_place_id", "is", null)
    .eq("subscription_status", "active");

  const results: { merchantId: string; count?: number; error?: string }[] = [];

  for (const merchant of merchants ?? []) {
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${merchant.google_place_id}`,
        {
          headers: {
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "userRatingCount",
          },
        },
      );

      if (!res.ok) {
        results.push({ merchantId: merchant.id, error: `HTTP ${res.status}` });
        continue;
      }

      const data = await res.json();
      const count = data.userRatingCount ?? 0;

      await supabase.from("review_counts_history").insert({
        merchant_id: merchant.id,
        count,
      });

      results.push({ merchantId: merchant.id, count });
    } catch (err) {
      results.push({
        merchantId: merchant.id,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
