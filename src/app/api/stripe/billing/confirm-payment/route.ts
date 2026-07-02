import { NextResponse } from "next/server";
import { attachPaymentMethodFromSetup } from "@/lib/billing-summary";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { setupIntentId?: string };
    if (!body.setupIntentId) {
      return NextResponse.json({ error: "Missing setup intent" }, { status: 400 });
    }

    const { data: merchant } = await supabase
      .from("merchants")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!merchant?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account" }, { status: 400 });
    }

    const stripe = getStripe();
    await attachPaymentMethodFromSetup(stripe, body.setupIntentId, merchant);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[stripe/billing/confirm-payment]", err);
    return NextResponse.json({ error: "Payment update failed" }, { status: 500 });
  }
}
