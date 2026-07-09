import { apiT, resolveRequestLocale } from "@/i18n/api";
import { NextResponse } from "next/server";
import { isMerchantLive } from "@/lib/merchant-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDeviceFingerprint, getClientIp } from "@/lib/fingerprint";
import { findRecentSpinBlocker } from "@/lib/spin-limits";
import { pickWeightedPrize } from "@/lib/wheel";
import { isOutcomePrize } from "@/lib/prize-outcomes";
import { resolveSpinOutcome, prizeForClaim } from "@/lib/spin-resolution";
import type { Prize } from "@/lib/types";
import { clientIpKey, rateLimit } from "@/lib/rate-limit";

async function decrementStock(
  supabase: ReturnType<typeof createAdminClient>,
  prize: Prize,
): Promise<boolean> {
  if (prize.stock_remaining === null) return true;
  const { data } = await supabase
    .from("prizes")
    .update({ stock_remaining: prize.stock_remaining - 1 })
    .eq("id", prize.id)
    .gt("stock_remaining", 0)
    .select("id")
    .maybeSingle();
  return Boolean(data);
}

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
    const selected = pickWeightedPrize(prizeList);
    if (!selected) {
      return NextResponse.json({ error: t("api.noPrizes") }, { status: 400 });
    }

    const resolution = resolveSpinOutcome(prizeList, selected);
    const status = reviewScreenshotStatus ?? "pending";

    const { data: spin, error: spinError } = await supabase
      .from("spins")
      .insert({
        merchant_id: merchantId,
        prize_id: selected.id,
        resolved_prize_id: resolution.resolvedPrizeId,
        device_fingerprint: fingerprint,
        phone_number: null,
        followed_social: Boolean(followedSocial),
        review_screenshot_url: reviewScreenshotUrl ?? null,
        review_screenshot_status: status,
        completed_flow_steps: Array.isArray(completedFlowSteps) ? completedFlowSteps : [],
      })
      .select("*, prize:prizes(*)")
      .single();

    if (spinError) throw spinError;

    let resolvedPrize: Prize | null = null;
    if (resolution.resolvedPrizeId) {
      const { data } = await supabase
        .from("prizes")
        .select("*")
        .eq("id", resolution.resolvedPrizeId)
        .maybeSingle();
      resolvedPrize = (data as Prize | null) ?? null;
    }

    const stockPrize = resolvedPrize ?? (isOutcomePrize(selected) ? null : selected);
    if (stockPrize) {
      const ok = await decrementStock(supabase, stockPrize);
      if (!ok) {
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
