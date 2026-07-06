import type { SupabaseClient } from "@supabase/supabase-js";
import type { Prize } from "@/lib/types";

export type PrizeWritePayload = {
  label: string;
  probability_weight: number;
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

export function corePrizePayload(payload: PrizeWritePayload) {
  return {
    label: payload.label,
    probability_weight: payload.probability_weight,
    stock_remaining: payload.stock_remaining,
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

  const fullRow = { merchant_id: merchantId, ...payload };
  let result = await admin.from("prizes").insert(fullRow).select().single();

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
    .update(payload)
    .eq("id", prizeId)
    .eq("merchant_id", merchantId)
    .select()
    .single();

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
