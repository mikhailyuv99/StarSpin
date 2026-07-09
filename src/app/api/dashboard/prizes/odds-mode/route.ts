import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  applyTierWinChances,
  normalizePrizeOddsMode,
  type PrizeOddsMode,
} from "@/lib/prize-rarity";
import type { Prize } from "@/lib/types";
import { activePrizes } from "@/lib/prize-chances";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, slug")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!merchant) return NextResponse.json({ error: "No merchant" }, { status: 400 });

  let mode: PrizeOddsMode = "simple";
  try {
    const body = (await request.json()) as { mode?: string };
    mode = normalizePrizeOddsMode(body.mode);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { error: modeError } = await supabase
    .from("merchants")
    .update({ prize_odds_mode: mode })
    .eq("id", merchant.id);
  if (modeError) {
    return NextResponse.json({ error: modeError.message }, { status: 500 });
  }

  const { data: prizeRows } = await supabase
    .from("prizes")
    .select("*")
    .eq("merchant_id", merchant.id);

  let prizes = (prizeRows ?? []) as Prize[];

  if (mode === "simple" && activePrizes(prizes).length > 0) {
    const synced = applyTierWinChances(prizes);
    for (const prize of synced.filter((p) => p.active)) {
      await supabase
        .from("prizes")
        .update({ probability_weight: prize.probability_weight })
        .eq("id", prize.id)
        .eq("merchant_id", merchant.id);
    }
    prizes = synced;
  }

  revalidatePath(`/${merchant.slug}`);
  revalidatePath("/dashboard/prizes");

  return NextResponse.json({ mode, prizes });
}
