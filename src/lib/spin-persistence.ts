import type { SupabaseClient } from "@supabase/supabase-js";
import type { Prize } from "@/lib/types";

export function isMissingResolvedPrizeIdError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("resolved_prize_id") &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find"))
  );
}

type SpinInsertRow = {
  merchant_id: string;
  prize_id: string;
  resolved_prize_id?: string | null;
  device_fingerprint: string;
  phone_number: string | null;
  followed_social: boolean;
  review_screenshot_url: string | null;
  review_screenshot_status: string;
  completed_flow_steps: string[];
};

export async function insertSpinRow(
  supabase: SupabaseClient,
  row: SpinInsertRow,
) {
  let result = await supabase.from("spins").insert(row).select("*, prize:prizes(*)").single();

  if (result.error && isMissingResolvedPrizeIdError(result.error.message)) {
    const { resolved_prize_id: _resolved, ...withoutResolved } = row;
    result = await supabase
      .from("spins")
      .insert(withoutResolved)
      .select("*, prize:prizes(*)")
      .single();
  }

  return result;
}

export async function updateSpinPrizeResolution(
  supabase: SupabaseClient,
  spinId: string,
  prizeId: string,
  resolvedPrizeId: string | null,
) {
  let result = await supabase
    .from("spins")
    .update({ prize_id: prizeId, resolved_prize_id: resolvedPrizeId })
    .eq("id", spinId)
    .is("prize_code", null);

  if (result.error && isMissingResolvedPrizeIdError(result.error.message)) {
    result = await supabase
      .from("spins")
      .update({ prize_id: prizeId })
      .eq("id", spinId)
      .is("prize_code", null);
  }

  return result;
}

export function wheelEligibleFromList(prizes: Prize[]): Prize[] {
  return prizes.filter((p) => p.active && (p.stock_remaining === null || p.stock_remaining > 0));
}
