import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_MERCHANT_COOKIE } from "@/lib/active-merchant";
import { canAddEstablishment, getMerchantAccount } from "@/lib/merchant-account";
import { getOwnerMerchants } from "@/lib/merchant";
import { pickAvailableSlug, slugFromName } from "@/lib/establishment-slug";
import type { FlowActionStep } from "@/lib/flow-steps";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string };
  const businessName = body.name?.trim();
  if (!businessName) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }

  const merchants = await getOwnerMerchants();
  const account = await getMerchantAccount();

  if (!canAddEstablishment(account, merchants.length)) {
    return NextResponse.json(
      { error: "Multi-business subscription required", code: "multi_business_required" },
      { status: 403 },
    );
  }

  let accountId = account?.id;
  if (!accountId) {
    const { data: createdAccount, error: accountError } = await supabase
      .from("merchant_accounts")
      .insert({ owner_id: user.id })
      .select("id")
      .single();

    if (accountError || !createdAccount) {
      return NextResponse.json({ error: accountError?.message ?? "Account creation failed" }, { status: 500 });
    }
    accountId = createdAccount.id;
  }

  const cleanSlug = await pickAvailableSlug(supabase, slugFromName(businessName));
  if (!cleanSlug) {
    return NextResponse.json({ error: "Slug unavailable" }, { status: 400 });
  }

  const flow_steps: FlowActionStep[] = ["google_review"];

  // One account subscription covers every establishment — inherit live status.
  const { data: merchant, error: insertError } = await supabase
    .from("merchants")
    .insert({
      name: businessName,
      slug: cleanSlug,
      owner_id: user.id,
      account_id: accountId,
      flow_steps,
      subscription_status: account?.subscription_status ?? "cancelled",
    })
    .select("id, name, slug")
    .single();

  if (insertError || !merchant) {
    return NextResponse.json({ error: insertError?.message ?? "Creation failed" }, { status: 500 });
  }

  const defaultPrizes = [
    { label: "10% off", icon: "percent_10", probability_weight: 40, stock_remaining: null },
    { label: "Free drink", icon: "soda", probability_weight: 30, stock_remaining: 50 },
    { label: "Free dessert", icon: "cupcake", probability_weight: 20, stock_remaining: 30 },
    { label: "Try again", icon: "try_again", probability_weight: 10, stock_remaining: null },
  ];

  await supabase.from("prizes").insert(
    defaultPrizes.map((prize) => ({ ...prize, merchant_id: merchant.id })),
  );

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_MERCHANT_COOKIE, merchant.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ merchant });
}
