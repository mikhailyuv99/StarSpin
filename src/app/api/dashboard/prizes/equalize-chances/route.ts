import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMerchant } from "@/lib/merchant";
import { equalWinChances } from "@/lib/prize-chances";
import type { Prize } from "@/lib/types";

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

  let db;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  return { merchant, db };
}

export async function POST() {
  const ctx = await getOwnedMerchant();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { merchant, db } = ctx as {
    merchant: { id: string; slug: string };
    db: ReturnType<typeof createAdminClient>;
  };

  const { data: rows, error: fetchError } = await db
    .from("prizes")
    .select("*")
    .eq("merchant_id", merchant.id)
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const active = (rows ?? []) as Prize[];
  if (active.length === 0) {
    return NextResponse.json({ prizes: [] as Prize[] });
  }

  const shares = equalWinChances(active.length);
  const updated: Prize[] = [];

  for (let i = 0; i < active.length; i++) {
    const prize = active[i]!;
    const share = shares[i] ?? 0;
    const { data, error } = await db
      .from("prizes")
      .update({ probability_weight: share })
      .eq("id", prize.id)
      .eq("merchant_id", merchant.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    updated.push(data as Prize);
  }

  revalidatePath(`/${merchant.slug}`);
  revalidatePath("/dashboard/prizes");

  return NextResponse.json({ prizes: updated });
}
