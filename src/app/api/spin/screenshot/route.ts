import { apiT, resolveRequestLocale } from "@/i18n/api";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { attachSpinScreenshot } from "@/lib/spin-persistence";
import { clientIpKey, rateLimit } from "@/lib/rate-limit";

/** Attach a review screenshot to an existing spin (never lose proof after the wheel starts). */
export async function POST(request: Request) {
  const locale = resolveRequestLocale(request);
  const t = apiT(locale);

  const limited = rateLimit(clientIpKey(request, "spin-screenshot"), 40, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: t("api.rateLimited") },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  try {
    const body = (await request.json()) as {
      spinId?: string;
      merchantId?: string;
      reviewScreenshotUrl?: string | null;
      reviewScreenshotStatus?: string;
    };

    const spinId = body.spinId?.trim();
    const merchantId = body.merchantId?.trim();
    const screenshotUrl = body.reviewScreenshotUrl?.trim();
    if (!spinId || !merchantId || !screenshotUrl) {
      return NextResponse.json({ error: t("api.missingFields") }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await attachSpinScreenshot(
      supabase,
      spinId,
      merchantId,
      screenshotUrl,
      body.reviewScreenshotStatus ?? "pending",
    );

    if (error) {
      console.error("attachSpinScreenshot:", error);
      return NextResponse.json({ error: t("api.spinError") }, { status: 500 });
    }
    if (!data?.id) {
      return NextResponse.json({ error: t("api.spinNotFound") }, { status: 404 });
    }

    return NextResponse.json({ ok: true, spinId: data.id });
  } catch (err) {
    console.error("spin/screenshot:", err);
    return NextResponse.json({ error: t("api.spinError") }, { status: 500 });
  }
}
