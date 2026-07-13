import { apiT, resolveRequestLocale } from "@/i18n/api";
import { NextResponse } from "next/server";
import { isMerchantLive } from "@/lib/merchant-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDeviceFingerprint, getClientIp } from "@/lib/fingerprint";
import { findRecentSpinBlocker } from "@/lib/spin-limits";
import { pickWeightedPrize } from "@/lib/wheel";
import { resolveSpinOutcome, prizeForClaim } from "@/lib/spin-resolution";
import { isMysteryMechanic, isDoubleOrNothingMechanic } from "@/lib/prize-mechanics";
import { stockPrizeOnSpinCreate } from "@/lib/spin-claim";
import { decrementPrizeStock } from "@/lib/prize-stock";
import { hasMinimumWheelPrizes } from "@/lib/prizes";
import { insertSpinRow } from "@/lib/spin-persistence";
import type { Prize } from "@/lib/types";
import { clientIpKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const locale = resolveRequestLocale(request);
  const t = apiT(locale);

  const limited = rateLimit(clientIpKey(request, "spin"), 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: t("api.rateLimited") },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  try {
    const body = await request.json();
    const {
      merchantId,
      followedSocial,
      reviewScreenshotUrl,
      reviewScreenshotStatus,
      completedFlowSteps,
    } = body;

    if (!merchantId) {
      return NextResponse.json({ error: t("api.missingFields") }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: merchant } = await supabase
      .from("merchants")
      .select("subscription_status, spin_cooldown_days")
      .eq("id", merchantId)
      .single();

    if (!merchant || !isMerchantLive(merchant.subscription_status)) {
      return NextResponse.json({ error: t("api.merchantUnavailable") }, { status: 404 });
    }

    const cooldownDays = merchant.spin_cooldown_days ?? 0;

    const fingerprint = createDeviceFingerprint(
      getClientIp(request),
      request.headers.get("user-agent") ?? "",
    );

    const blocker = await findRecentSpinBlocker(supabase, merchantId, null, fingerprint, cooldownDays);
    if (blocker) {
      return NextResponse.json(
        {
          error:
            blocker === "phone"
              ? t("api.alreadyPlayedPhone", { days: cooldownDays })
              : t("api.alreadyPlayedDevice", { days: cooldownDays }),
        },
        { status: 429 },
      );
    }

    const { data: prizes } = await supabase
      .from("prizes")
      .select("*")
      .eq("merchant_id", merchantId)
      .eq("active", true);

    const prizeList = (prizes ?? []) as Prize[];
    if (!hasMinimumWheelPrizes(prizeList)) {
      return NextResponse.json({ error: t("api.minWheelPrizes") }, { status: 400 });
    }

    const selected = pickWeightedPrize(prizeList);
    if (!selected) {
      return NextResponse.json({ error: t("api.noPrizes") }, { status: 400 });
    }

    const resolution = resolveSpinOutcome(prizeList, selected);
    if (
      (isMysteryMechanic(selected) || isDoubleOrNothingMechanic(selected)) &&
      !resolution.resolvedPrizeId
    ) {
      return NextResponse.json({ error: t("api.noPrizes") }, { status: 400 });
    }

    const status = reviewScreenshotStatus ?? "pending";
    const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 500);
    const clientIp = getClientIp(request);

    const { data: spin, error: spinError } = await insertSpinRow(supabase, {
      merchant_id: merchantId,
      prize_id: selected.id,
      resolved_prize_id: resolution.resolvedPrizeId,
      device_fingerprint: fingerprint,
      phone_number: null,
      followed_social: Boolean(followedSocial),
      review_screenshot_url: reviewScreenshotUrl ?? null,
      review_screenshot_status: status,
      completed_flow_steps: Array.isArray(completedFlowSteps) ? completedFlowSteps : [],
      client_locale: locale,
      client_user_agent: userAgent || null,
      client_ip: clientIp !== "unknown" ? clientIp : null,
    });

    if (spinError || !spin?.id) {
      console.error("Spin insert error:", spinError);
      return NextResponse.json({ error: t("api.spinError") }, { status: 500 });
    }

    let resolvedPrize: Prize | null = null;
    if (resolution.resolvedPrizeId) {
      const { data } = await supabase
        .from("prizes")
        .select("*")
        .eq("id", resolution.resolvedPrizeId)
        .maybeSingle();
      resolvedPrize = (data as Prize | null) ?? null;
    }

    const stockPrize = stockPrizeOnSpinCreate(selected, resolvedPrize);
    if (stockPrize) {
      const ok = await decrementPrizeStock(supabase, stockPrize);
      if (!ok) {
        // Never leave a "successful" spin that couldn't award stock — roll it back.
        await supabase.from("spins").delete().eq("id", spin.id);
        return NextResponse.json({ error: t("api.noPrizes") }, { status: 400 });
      }
    }

    return NextResponse.json({
      spinId: spin.id,
      prize: selected,
      resolvedPrize: resolvedPrize ? prizeForClaim(selected, resolvedPrize) : null,
      nearMissTarget: resolution.nearMissTargetLabel,
    });
  } catch (err) {
    console.error("Spin error:", err);
    return NextResponse.json({ error: t("api.spinError") }, { status: 500 });
  }
}
