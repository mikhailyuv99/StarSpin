import { NextResponse } from "next/server";
import { attachPaymentMethodFromSetup } from "@/lib/billing-summary";
import { accountBillingAccount, getMerchantAccount } from "@/lib/merchant-account";
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

    const account = await getMerchantAccount();
    const billing = account ? accountBillingAccount(account) : null;

    if (!billing) {
      return NextResponse.json({ error: "No billing account" }, { status: 400 });
    }

    const stripe = getStripe();
    await attachPaymentMethodFromSetup(stripe, body.setupIntentId, billing);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[stripe/billing/confirm-payment]", err);
    return NextResponse.json({ error: "Payment update failed" }, { status: 500 });
  }
}
