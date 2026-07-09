import { apiT, resolveRequestLocale } from "@/i18n/api";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRetrySpinPrize, isNearMissPrize } from "@/lib/prize-outcomes";
import { pickRetrySpinPrize } from "@/lib/wheel";
import { resolveSpinOutcome } from "@/lib/spin-resolution";
import { isMysteryMechanic, isDoubleOrNothingMechanic } from "@/lib/prize-mechanics";
import { hasMinimumWheelPrizes } from "@/lib/prizes";
import { stockPrizeOnSpinCreate } from "@/lib/spin-claim";
import { decrementPrizeStock } from "@/lib/prize-stock";
import { updateSpinPrizeResolution } from "@/lib/spin-persistence";
import type { Prize } from "@/lib/types";
import { clientIpKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const locale = resolveRequestLocale(request);
  const t = apiT(locale);

  const limited = rateLimit(clientIpKey(request, "spin-retry"), 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: t("api.rateLimited") },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  try {
    const body = await request.json();
    const spinId = typeof body.spinId === "string" ? body.spinId.trim() : "";
    if (!spinId) {
      return NextResponse.json({ error: t("api.missingFields") }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: spin, error: spinError } = await supabase
      .from("spins")
      .select("id, merchant_id, prize_id, prize_code")
      .eq("id", spinId)
      .maybeSingle();

    if (spinError || !spin || !spin.prize_id) {
      return NextResponse.json({ error: t("api.spinError") }, { status: 404 });
    }

    if (spin.prize_code) {
      return NextResponse.json({ error: t("api.spinAlreadyClaimed") }, { status: 409 });
    }

    const { data: prizeRow } = await supabase
      .from("prizes")
      .select("*")
      .eq("id", spin.prize_id)
      .maybeSingle();

    const currentPrize = (prizeRow as Prize | null) ?? null;
    if (!currentPrize || (!isRetrySpinPrize(currentPrize) && !isNearMissPrize(currentPrize))) {
      return NextResponse.json({ error: t("api.spinRetryNotAllowed") }, { status: 400 });
    }

    const { data: prizes } = await supabase
      .from("prizes")
      .select("*")
      .eq("merchant_id", spin.merchant_id)
      .eq("active", true);

    const prizeList = (prizes ?? []) as Prize[];
    if (!hasMinimumWheelPrizes(prizeList)) {
      return NextResponse.json({ error: t("api.minWheelPrizes") }, { status: 400 });
    }

    const selected = pickRetrySpinPrize(prizeList);
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

    const { error: updateError } = await updateSpinPrizeResolution(
      supabase,
      spinId,
      selected.id,
      resolution.resolvedPrizeId,
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
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
        return NextResponse.json({ error: t("api.noPrizes") }, { status: 400 });
      }
    }

    return NextResponse.json({
      spinId,
      prize: selected,
      resolvedPrize,
      nearMissTarget: resolution.nearMissTargetLabel,
    });
  } catch (err) {
    console.error("Spin retry error:", err);
    return NextResponse.json({ error: t("api.spinError") }, { status: 500 });
  }
}
