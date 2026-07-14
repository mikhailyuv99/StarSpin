import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { revalidatePublicMerchant } from "@/lib/revalidate-public-merchant";
import { getCurrentMerchant } from "@/lib/merchant";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Prize } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const merchant = await getCurrentMerchant();
  if (!merchant) return NextResponse.json({ error: "No merchant" }, { status: 400 });

  let body: { orderedIds?: unknown };
  try {
    body = (await request.json()) as { orderedIds?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderedIds = Array.isArray(body.orderedIds)
    ? body.orderedIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];

  if (orderedIds.length === 0) {
    return NextResponse.json({ error: "orderedIds required" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: existing, error: listError } = await db
    .from("prizes")
    .select("id")
    .eq("merchant_id", merchant.id);

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const ownedIds = new Set((existing ?? []).map((row) => row.id as string));
  if (orderedIds.length !== ownedIds.size || orderedIds.some((id) => !ownedIds.has(id))) {
    return NextResponse.json({ error: "invalid_order" }, { status: 400 });
  }

  const updates = await Promise.all(
    orderedIds.map((id, index) =>
      db
        .from("prizes")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("merchant_id", merchant.id),
    ),
  );

  const failed = updates.find((result) => result.error);
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 });
  }

  const { data: prizes, error } = await db
    .from("prizes")
    .select("*")
    .eq("merchant_id", merchant.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePublicMerchant(merchant.slug);
  revalidatePath("/dashboard/prizes");

  return NextResponse.json({ prizes: (prizes ?? []) as Prize[] });
}
