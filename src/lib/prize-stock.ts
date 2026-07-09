import type { SupabaseClient } from "@supabase/supabase-js";
import type { Prize } from "@/lib/types";

export async function decrementPrizeStock(
  supabase: SupabaseClient,
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

export async function incrementPrizeStock(
  supabase: SupabaseClient,
  prizeId: string,
): Promise<void> {
  const { data } = await supabase.from("prizes").select("stock_remaining").eq("id", prizeId).maybeSingle();
  if (!data || data.stock_remaining === null) return;
  await supabase
    .from("prizes")
    .update({ stock_remaining: data.stock_remaining + 1 })
    .eq("id", prizeId);
}
