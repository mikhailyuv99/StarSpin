import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { revalidatePublicMerchant } from "@/lib/revalidate-public-merchant";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMerchant } from "@/lib/merchant";
import { normalizeRedeemCurrency, parseMinSpendInput } from "@/lib/redemption-rules";
import {
  deleteMerchantPrize,
  insertMerchantPrize,
  prizeMutationResult,
  updateMerchantPrize,
  type PrizeWritePayload,
} from "@/lib/prize-persistence";
import { normalizePrizeIcon } from "@/lib/prize-icons";
import {
  defaultIconForMechanic,
  normalizePrizeMechanic,
  normalizeSocialUnlockPlatform,
} from "@/lib/prize-mechanics";
import {
  activePrizes,
  parseWinChancePercent,
  totalActiveWinChance,
  WIN_CHANCE_TARGET,
} from "@/lib/prize-chances";
import { clampPrizeLabel } from "@/lib/wheel";
import type { Prize, SocialLinks } from "@/lib/types";
import { socialUrlForStep, type FlowActionStep } from "@/lib/flow-steps";
import { hasMinimumWheelPrizes } from "@/lib/prizes";
import {
  applyTierWinChances,
  normalizePrizeOddsMode,
  normalizeRarityTier,
  type PrizeOddsMode,
} from "@/lib/prize-rarity";

type PrizeBody = {
  id?: string;
  active?: boolean;
  label?: string;
  icon?: string | null;
  prize_mechanic?: string | null;
  social_unlock_platform?: string | null;
  probability_weight?: number | string;
  rarity_tier?: string | null;
  stock_remaining?: number | null;
  redeem_next_visit?: boolean;
  redeem_min_spend?: string;
  redeem_min_spend_currency?: string | null;
  redeem_valid_days?: number | null;
};

function buildPayload(body: PrizeBody): { error: string } | { payload: PrizeWritePayload } {
  const label = clampPrizeLabel(body.label ?? "");
  if (!label) {
    return { error: "empty_label" };
  }

  const validDays = body.redeem_valid_days;
  if (validDays != null && (validDays < 1 || validDays > 365)) {
    return { error: "invalid_valid_days" };
  }

  const stock = body.stock_remaining;
  if (stock != null && (!Number.isFinite(stock) || stock < 0)) {
    return { error: "invalid_stock" };
  }

  const mechanic = normalizePrizeMechanic(body.prize_mechanic ?? undefined);
  const chance = parseWinChancePercent(body.probability_weight ?? 0);
  if (chance < 1) {
    return { error: "invalid_win_chance" };
  }

  const social_unlock_platform =
    mechanic === "social_unlock"
      ? normalizeSocialUnlockPlatform(body.social_unlock_platform)
      : null;
  if (mechanic === "social_unlock" && !social_unlock_platform) {
    return { error: "social_unlock_platform_required" };
  }

  return {
    payload: {
      label,
      icon: normalizePrizeIcon(body.icon ?? defaultIconForMechanic(mechanic)),
      prize_mechanic: mechanic,
      social_unlock_platform,
      probability_weight: chance,
      rarity_tier: normalizeRarityTier(body.rarity_tier),
      stock_remaining: stock ?? null,
      redeem_next_visit: Boolean(body.redeem_next_visit),
      redeem_min_spend_cents: parseMinSpendInput(body.redeem_min_spend ?? ""),
      redeem_min_spend_currency: (() => {
        const amount = parseMinSpendInput(body.redeem_min_spend ?? "");
        if (amount == null) return null;
        return normalizeRedeemCurrency(body.redeem_min_spend_currency, "VND");
      })(),
      redeem_valid_days: validDays && validDays > 0 ? validDays : null,
    },
  };
}

async function getMerchantOddsMode(
  db: SupabaseClient,
  merchantId: string,
): Promise<PrizeOddsMode> {
  const { data } = await db.from("merchants").select("prize_odds_mode").eq("id", merchantId).maybeSingle();
  return normalizePrizeOddsMode(data?.prize_odds_mode);
}

async function syncSimpleModeChances(db: SupabaseClient, merchantId: string): Promise<Prize[]> {
  const { data: rows } = await db.from("prizes").select("*").eq("merchant_id", merchantId);
  const prizes = applyTierWinChances((rows ?? []) as Prize[]);
  const active = prizes.filter((p) => p.active);
  await Promise.all(
    active.map((prize) =>
      db
        .from("prizes")
        .update({ probability_weight: prize.probability_weight })
        .eq("id", prize.id)
        .eq("merchant_id", merchantId),
    ),
  );
  const { data: refreshed } = await db.from("prizes").select("*").eq("merchant_id", merchantId);
  return (refreshed ?? []) as Prize[];
}

async function validateActiveWinChances(
  db: SupabaseClient,
  merchantId: string,
  draft: Prize,
  editingId?: string,
  oddsMode?: PrizeOddsMode,
): Promise<string | null> {
  const mode = oddsMode ?? (await getMerchantOddsMode(db, merchantId));
  if (mode === "simple") return null;

  const { data: rows } = await db.from("prizes").select("*").eq("merchant_id", merchantId);
  const list = ((rows ?? []) as Prize[]).map((p) => (p.id === editingId ? draft : p));
  if (activePrizes(list).length === 0) return null;
  if (totalActiveWinChance(list) !== WIN_CHANCE_TARGET) {
    return "win_chances_must_sum_100";
  }
  return null;
}

function validateMinWheelPrizes(prizes: Prize[]): string | null {
  if (!hasMinimumWheelPrizes(prizes)) {
    return "min_wheel_prizes";
  }
  return null;
}

function validateSocialUnlockUrl(
  payload: PrizeWritePayload,
  socialLinks: SocialLinks,
): string | null {
  if (payload.prize_mechanic !== "social_unlock" || !payload.social_unlock_platform) {
    return null;
  }
  const step = payload.social_unlock_platform as FlowActionStep;
  if (!socialUrlForStep(step, socialLinks)) {
    return "social_unlock_url_missing";
  }
  return null;
}

async function getOwnedMerchant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const merchant = await getCurrentMerchant();

  if (!merchant) {
    return { error: NextResponse.json({ error: "No merchant" }, { status: 400 }) };
  }

  let db: SupabaseClient;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  return { merchant, db };
}

function revalidateMerchantPages(slug: string) {
  revalidatePublicMerchant(slug);
  revalidatePath("/dashboard/prizes");
}

export async function POST(request: Request) {
  const ctx = await getOwnedMerchant();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { merchant, db } = ctx as {
    merchant: { id: string; slug: string; social_links: SocialLinks };
    db: SupabaseClient;
  };

  let body: PrizeBody;
  try {
    body = (await request.json()) as PrizeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const built = buildPayload(body);
  if ("error" in built) {
    return NextResponse.json({ error: built.error }, { status: 400 });
  }

  const socialError = validateSocialUnlockUrl(built.payload, merchant.social_links ?? {});
  if (socialError) {
    return NextResponse.json({ error: socialError }, { status: 400 });
  }

  const draft: Prize = {
    id: "__new__",
    merchant_id: merchant.id,
    active: true,
    created_at: new Date().toISOString(),
    stock_remaining: built.payload.stock_remaining,
    probability_weight: built.payload.probability_weight,
    label: built.payload.label,
    icon: built.payload.icon,
    prize_mechanic: built.payload.prize_mechanic,
    social_unlock_platform: built.payload.social_unlock_platform,
  };

  const chanceError = await validateActiveWinChances(db, merchant.id, draft);
  if (chanceError) {
    return NextResponse.json({ error: chanceError }, { status: 400 });
  }

  const { data, error } = await insertMerchantPrize(db, merchant.id, built.payload);
  const result = prizeMutationResult(data as Prize | null, error, built.payload);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const oddsMode = await getMerchantOddsMode(db, merchant.id);
  if (oddsMode === "simple") {
    const prizes = await syncSimpleModeChances(db, merchant.id);
    revalidateMerchantPages(merchant.slug);
    const synced = prizes.find((p) => p.id === result.prize?.id) ?? result.prize;
    return NextResponse.json({ prize: synced, prizes, redemptionRulesSkipped: result.redemptionRulesSkipped });
  }

  revalidateMerchantPages(merchant.slug);
  return NextResponse.json({ prize: result.prize, redemptionRulesSkipped: result.redemptionRulesSkipped });
}

export async function PATCH(request: Request) {
  const ctx = await getOwnedMerchant();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { merchant, db } = ctx as {
    merchant: { id: string; slug: string; social_links: SocialLinks };
    db: SupabaseClient;
  };

  let body: PrizeBody;
  try {
    body = (await request.json()) as PrizeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Missing prize id" }, { status: 400 });
  }

  if (body.active !== undefined && body.label === undefined) {
    const { data: existing } = await db
      .from("prizes")
      .select("*")
      .eq("id", body.id)
      .eq("merchant_id", merchant.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Prize not found" }, { status: 404 });
    }

    const draft = { ...(existing as Prize), active: Boolean(body.active) };
    const chanceError = await validateActiveWinChances(db, merchant.id, draft, body.id);
    if (chanceError) {
      return NextResponse.json({ error: chanceError }, { status: 400 });
    }

    const { data: allPrizes } = await db.from("prizes").select("*").eq("merchant_id", merchant.id);
    const afterToggle = ((allPrizes ?? []) as Prize[]).map((p) =>
      p.id === body.id ? { ...p, active: Boolean(body.active) } : p,
    );
    const minError = validateMinWheelPrizes(afterToggle);
    if (minError) {
      return NextResponse.json({ error: minError }, { status: 400 });
    }

    const { data, error } = await db
      .from("prizes")
      .update({ active: body.active })
      .eq("id", body.id)
      .eq("merchant_id", merchant.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const oddsMode = await getMerchantOddsMode(db, merchant.id);
    if (oddsMode === "simple") {
      const prizes = await syncSimpleModeChances(db, merchant.id);
      revalidateMerchantPages(merchant.slug);
      return NextResponse.json({ prize: data as Prize, prizes });
    }

    revalidateMerchantPages(merchant.slug);
    return NextResponse.json({ prize: data as Prize });
  }

  const built = buildPayload(body);
  if ("error" in built) {
    return NextResponse.json({ error: built.error }, { status: 400 });
  }

  const socialError = validateSocialUnlockUrl(built.payload, merchant.social_links ?? {});
  if (socialError) {
    return NextResponse.json({ error: socialError }, { status: 400 });
  }

  const draft: Prize = {
    id: body.id,
    merchant_id: merchant.id,
    active: true,
    created_at: new Date().toISOString(),
    stock_remaining: built.payload.stock_remaining,
    probability_weight: built.payload.probability_weight,
    label: built.payload.label,
    icon: built.payload.icon,
    prize_mechanic: built.payload.prize_mechanic,
    social_unlock_platform: built.payload.social_unlock_platform,
  };

  const chanceError = await validateActiveWinChances(db, merchant.id, draft, body.id);
  if (chanceError) {
    return NextResponse.json({ error: chanceError }, { status: 400 });
  }

  const { data, error } = await updateMerchantPrize(db, body.id, merchant.id, built.payload);
  const result = prizeMutationResult(data as Prize | null, error, built.payload);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const oddsMode = await getMerchantOddsMode(db, merchant.id);
  if (oddsMode === "simple") {
    const prizes = await syncSimpleModeChances(db, merchant.id);
    revalidateMerchantPages(merchant.slug);
    const synced = prizes.find((p) => p.id === result.prize?.id) ?? result.prize;
    return NextResponse.json({ prize: synced, prizes, redemptionRulesSkipped: result.redemptionRulesSkipped });
  }

  revalidateMerchantPages(merchant.slug);
  return NextResponse.json({ prize: result.prize, redemptionRulesSkipped: result.redemptionRulesSkipped });
}

export async function DELETE(request: Request) {
  const ctx = await getOwnedMerchant();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { merchant, db } = ctx as {
    merchant: { id: string; slug: string; social_links: SocialLinks };
    db: SupabaseClient;
  };

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Missing prize id" }, { status: 400 });
  }

  const { data: allPrizes } = await db.from("prizes").select("*").eq("merchant_id", merchant.id);
  const afterDelete = ((allPrizes ?? []) as Prize[]).filter((p) => p.id !== id);
  const minError = validateMinWheelPrizes(afterDelete);
  if (minError) {
    return NextResponse.json({ error: minError }, { status: 400 });
  }

  const { error } = await deleteMerchantPrize(db, id, merchant.id);
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("foreign key") || msg.includes("violates") || error.code === "23503") {
      return NextResponse.json({ error: "prize_has_spins" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const oddsMode = await getMerchantOddsMode(db, merchant.id);
  if (oddsMode === "simple") {
    const prizes = await syncSimpleModeChances(db, merchant.id);
    revalidateMerchantPages(merchant.slug);
    return NextResponse.json({ ok: true, prizes });
  }

  revalidateMerchantPages(merchant.slug);
  return NextResponse.json({ ok: true });
}
