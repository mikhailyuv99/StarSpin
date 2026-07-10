import { NextResponse } from "next/server";
import { createPaymentSetupSecret } from "@/lib/billing-summary";
import { accountBillingAccount, getMerchantAccount } from "@/lib/merchant-account";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await getMerchantAccount();
    const billing = account ? accountBillingAccount(account) : null;

    if (!billing) {
      return NextResponse.json({ error: "No billing account" }, { status: 400 });
    }

    const stripe = getStripe();
    const clientSecret = await createPaymentSetupSecret(stripe, billing.stripe_customer_id);
    return NextResponse.json({ clientSecret });
  } catch (err) {
    console.error("[stripe/billing/setup-payment]", err);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
