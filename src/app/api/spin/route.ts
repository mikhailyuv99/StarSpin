import { apiT, resolveRequestLocale } from "@/i18n/api";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SPIN_COOLDOWN_DAYS } from "@/lib/constants";
import { createDeviceFingerprint, getClientIp } from "@/lib/fingerprint";
import { findRecentSpinBlocker } from "@/lib/spin-limits";
import { pickWeightedPrize } from "@/lib/wheel";
import type { Prize } from "@/lib/types";

export async function POST(request: Request) {
  const locale = resolveRequestLocale(request);
  const t = apiT(locale);

  try {
    const body = await request.json();
    const {
      merchantId,
      phoneNumber,
      followedSocial,
      reviewScreenshotUrl,
      reviewScreenshotStatus,
    } = body;

    if (!merchantId || !phoneNumber) {
      return NextResponse.json({ error: t("api.missingFields") }, { status: 400 });
    }

    const supabase = createAdminClient();
    const fingerprint = createDeviceFingerprint(
      getClientIp(request),
      request.headers.get("user-agent") ?? "",
    );

    const { data: verifiedOtp } = await supabase
      .from("otp_verifications")
      .select("id")
      .eq("merchant_id", merchantId)
      .eq("phone_number", phoneNumber)
      .eq("verified", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!verifiedOtp) {
      return NextResponse.json({ error: t("api.phoneNotVerified") }, { status: 403 });
    }

    const blocker = await findRecentSpinBlocker(supabase, merchantId, phoneNumber, fingerprint);
    if (blocker) {
      return NextResponse.json(
        {
          error:
            blocker === "phone"
              ? t("api.alreadyPlayedPhone", { days: SPIN_COOLDOWN_DAYS })
              : t("api.alreadyPlayedDevice", { days: SPIN_COOLDOWN_DAYS }),
        },
        { status: 429 },
      );
    }

    const { data: prizes } = await supabase
      .from("prizes")
      .select("*")
      .eq("merchant_id", merchantId)
      .eq("active", true);

    const selected = pickWeightedPrize((prizes ?? []) as Prize[]);
    if (!selected) {
      return NextResponse.json({ error: t("api.noPrizes") }, { status: 400 });
    }

    const status = reviewScreenshotStatus ?? "pending";

    const { data: spin, error: spinError } = await supabase
      .from("spins")
      .insert({
        merchant_id: merchantId,
        prize_id: selected.id,
        device_fingerprint: fingerprint,
        phone_number: phoneNumber,
        followed_social: Boolean(followedSocial),
        review_screenshot_url: reviewScreenshotUrl ?? null,
        review_screenshot_status: status,
      })
      .select("*, prize:prizes(*)")
      .single();

    if (spinError) throw spinError;

    if (selected.stock_remaining !== null) {
      await supabase
        .from("prizes")
        .update({ stock_remaining: selected.stock_remaining - 1 })
        .eq("id", selected.id)
        .gt("stock_remaining", 0);
    }

    return NextResponse.json({
      spinId: spin.id,
      prize: selected,
    });
  } catch (err) {
    console.error("Spin error:", err);
    return NextResponse.json({ error: t("api.spinError") }, { status: 500 });
  }
}
