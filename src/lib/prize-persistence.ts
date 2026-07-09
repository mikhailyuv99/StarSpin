import type { SupabaseClient } from "@supabase/supabase-js";
import type { Prize } from "@/lib/types";

import type { PrizeMechanic, SocialUnlockPlatform } from "@/lib/prize-mechanics";
import type { PrizeRarityTier } from "@/lib/prize-rarity";

export type PrizeWritePayload = {
  label: string;
  icon: string;
  probability_weight: number;
  rarity_tier?: PrizeRarityTier;
  prize_mechanic?: PrizeMechanic;
  social_unlock_platform?: SocialUnlockPlatform | null;
  stock_remaining: number | null;
  redeem_next_visit?: boolean;
  redeem_min_spend_cents?: number | null;
  redeem_valid_days?: number | null;
};

export function isMissingRedemptionSchemaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    (lower.includes("redeem_next_visit") ||
      lower.includes("redeem_min_spend_cents") ||
      lower.includes("redeem_valid_days")) &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find"))
  );
}

export function isMissingIconSchemaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("icon") &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find"))
  );
}

export function isMissingRaritySchemaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("rarity_tier") &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find"))
  );
}

export function corePrizePayload(payload: PrizeWritePayload) {
  return {
    label: payload.label,
    probability_weight: payload.probability_weight,
    stock_remaining: payload.stock_remaining,
  };
}

export function isMissingMechanicSchemaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("prize_mechanic") &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find"))
  );
}

export function isMissingSocialUnlockPlatformSchemaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("social_unlock_platform") &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find"))
  );
}

export function corePrizePayloadWithIcon(payload: PrizeWritePayload) {
  return {
    ...corePrizePayload(payload),
    icon: payload.icon,
  };
}

/** Best-effort: applies prize redemption columns if the DB function exists. */
export async function ensurePrizeRedemptionSchema(admin: SupabaseClient): Promise<void> {
  const { error } = await admin.rpc("ensure_prize_redemption_columns");
  if (error && !error.message.includes("Could not find the function")) {
    console.warn("ensure_prize_redemption_columns:", error.message);
  }
}

export async function insertMerchantPrize(
  admin: SupabaseClient,
  merchantId: string,
  payload: PrizeWritePayload,
) {
  await ensurePrizeRedemptionSchema(admin);

  const fullRow = {
    merchant_id: merchantId,
    ...payload,
    prize_mechanic: payload.prize_mechanic ?? "standard",
  };
  let result = await admin.from("prizes").insert(fullRow).select().single();

  if (result.error && isMissingMechanicSchemaError(result.error.message)) {
    const { prize_mechanic: _m, social_unlock_platform: _p, ...withoutMechanic } = fullRow;
    result = await admin.from("prizes").insert(withoutMechanic).select().single();
  }

  if (result.error && isMissingSocialUnlockPlatformSchemaError(result.error.message)) {
    const { social_unlock_platform: _p, ...withoutPlatform } = fullRow;
    result = await admin.from("prizes").insert(withoutPlatform).select().single();
  }

  if (result.error && isMissingIconSchemaError(result.error.message)) {
    result = await admin
      .from("prizes")
      .insert({
        merchant_id: merchantId,
        ...corePrizePayload(payload),
        redeem_next_visit: payload.redeem_next_visit,
        redeem_min_spend_cents: payload.redeem_min_spend_cents,
        redeem_valid_days: payload.redeem_valid_days,
      })
      .select()
      .single();
  }

  if (result.error && isMissingRedemptionSchemaError(result.error.message)) {
    result = await admin
      .from("prizes")
      .insert({ merchant_id: merchantId, ...corePrizePayloadWithIcon(payload) })
      .select()
      .single();
  }

  if (result.error && isMissingRedemptionSchemaError(result.error.message)) {
    result = await admin
      .from("prizes")
      .insert({ merchant_id: merchantId, ...corePrizePayload(payload) })
      .select()
      .single();
  }

  return result;
}

export async function updateMerchantPrize(
  admin: SupabaseClient,
  prizeId: string,
  merchantId: string,
  payload: PrizeWritePayload,
) {
  await ensurePrizeRedemptionSchema(admin);

  let result = await admin
    .from("prizes")
    .update({ ...payload, prize_mechanic: payload.prize_mechanic ?? "standard" })
    .eq("id", prizeId)
    .eq("merchant_id", merchantId)
    .select()
    .single();

  if (result.error && isMissingMechanicSchemaError(result.error.message)) {
    const { prize_mechanic: _m, social_unlock_platform: _p, ...withoutMechanic } = payload;
    result = await admin
      .from("prizes")
      .update(withoutMechanic)
      .eq("id", prizeId)
      .eq("merchant_id", merchantId)
      .select()
      .single();
  }

  if (result.error && isMissingSocialUnlockPlatformSchemaError(result.error.message)) {
    const { social_unlock_platform: _p, ...withoutPlatform } = payload;
    result = await admin
      .from("prizes")
      .update(withoutPlatform)
      .eq("id", prizeId)
      .eq("merchant_id", merchantId)
      .select()
      .single();
  }

  if (result.error && isMissingIconSchemaError(result.error.message)) {
    const { icon: _icon, ...withoutIcon } = payload;
    result = await admin
      .from("prizes")
      .update(withoutIcon)
      .eq("id", prizeId)
      .eq("merchant_id", merchantId)
      .select()
      .single();
  }

  if (result.error && isMissingRedemptionSchemaError(result.error.message)) {
    result = await admin
      .from("prizes")
      .update(corePrizePayloadWithIcon(payload))
      .eq("id", prizeId)
      .eq("merchant_id", merchantId)
      .select()
      .single();
  }

  if (result.error && isMissingRedemptionSchemaError(result.error.message)) {
    result = await admin
      .from("prizes")
      .update(corePrizePayload(payload))
      .eq("id", prizeId)
      .eq("merchant_id", merchantId)
      .select()
      .single();
  }

  return result;
}

export type PrizeMutationResult = {
  prize: Prize | null;
  error: string | null;
  redemptionRulesSkipped: boolean;
};

export function prizeMutationResult(
  data: Prize | null,
  error: { message: string } | null,
  payload: PrizeWritePayload,
): PrizeMutationResult {
  if (error) {
    return { prize: null, error: error.message, redemptionRulesSkipped: false };
  }

  const redemptionRulesSkipped =
    Boolean(payload.redeem_next_visit) ||
    payload.redeem_min_spend_cents != null ||
    payload.redeem_valid_days != null
      ? !data ||
        (payload.redeem_next_visit && !data.redeem_next_visit) ||
        (payload.redeem_min_spend_cents != null &&
          data.redeem_min_spend_cents !== payload.redeem_min_spend_cents) ||
        (payload.redeem_valid_days != null && data.redeem_valid_days !== payload.redeem_valid_days)
      : false;

  return { prize: data, error: null, redemptionRulesSkipped };
}

export async function deleteMerchantPrize(
  admin: SupabaseClient,
  prizeId: string,
  merchantId: string,
) {
  return admin.from("prizes").delete().eq("id", prizeId).eq("merchant_id", merchantId);
}
