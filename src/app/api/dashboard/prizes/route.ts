import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseMinSpendInput } from "@/lib/redemption-rules";
import {
  deleteMerchantPrize,
  insertMerchantPrize,
  prizeMutationResult,
  updateMerchantPrize,
  type PrizeWritePayload,
} from "@/lib/prize-persistence";
import { clampPrizeLabel } from "@/lib/wheel";
import type { Prize } from "@/lib/types";

type PrizeBody = {
  id?: string;
  active?: boolean;
  label?: string;
  probability_weight?: number;
  stock_remaining?: number | null;
  redeem_next_visit?: boolean;
  redeem_min_spend?: string;
  redeem_valid_days?: number | null;
};

function normalizeWeight(value: unknown): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

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

  return {
    payload: {
      label,
      probability_weight: normalizeWeight(body.probability_weight),
      stock_remaining: stock ?? null,
      redeem_next_visit: Boolean(body.redeem_next_visit),
      redeem_min_spend_cents: parseMinSpendInput(body.redeem_min_spend ?? ""),
      redeem_valid_days: validDays && validDays > 0 ? validDays : null,
    },
  };
}

async function getOwnedMerchant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, slug")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!merchant) {
    return { error: NextResponse.json({ error: "No merchant" }, { status: 400 }) };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: NextResponse.json({ error: "Server misconfigured" }, { status: 500 }) };
  }

  return { merchant, admin };
}

function revalidateMerchantPages(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath("/dashboard/prizes");
}

export async function POST(request: Request) {
  const ctx = await getOwnedMerchant();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { merchant, admin } = ctx as {
    merchant: { id: string; slug: string };
    admin: ReturnType<typeof createAdminClient>;
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

  const { data, error } = await insertMerchantPrize(admin, merchant.id, built.payload);
  const result = prizeMutationResult(data as Prize | null, error, built.payload);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  revalidateMerchantPages(merchant.slug);
  return NextResponse.json({ prize: result.prize, redemptionRulesSkipped: result.redemptionRulesSkipped });
}

export async function PATCH(request: Request) {
  const ctx = await getOwnedMerchant();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { merchant, admin } = ctx as {
    merchant: { id: string; slug: string };
    admin: ReturnType<typeof createAdminClient>;
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
    const { data, error } = await admin
      .from("prizes")
      .update({ active: body.active })
      .eq("id", body.id)
      .eq("merchant_id", merchant.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateMerchantPages(merchant.slug);
    return NextResponse.json({ prize: data as Prize });
  }

  const built = buildPayload(body);
  if ("error" in built) {
    return NextResponse.json({ error: built.error }, { status: 400 });
  }

  const { data, error } = await updateMerchantPrize(admin, body.id, merchant.id, built.payload);
  const result = prizeMutationResult(data as Prize | null, error, built.payload);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  revalidateMerchantPages(merchant.slug);
  return NextResponse.json({ prize: result.prize, redemptionRulesSkipped: result.redemptionRulesSkipped });
}

export async function DELETE(request: Request) {
  const ctx = await getOwnedMerchant();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { merchant, admin } = ctx as {
    merchant: { id: string; slug: string };
    admin: ReturnType<typeof createAdminClient>;
  };

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Missing prize id" }, { status: 400 });
  }

  const { error } = await deleteMerchantPrize(admin, id, merchant.id);
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("foreign key") || msg.includes("violates") || error.code === "23503") {
      return NextResponse.json({ error: "prize_has_spins" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateMerchantPages(merchant.slug);
  return NextResponse.json({ ok: true });
}
