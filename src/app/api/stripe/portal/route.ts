import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";
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
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: `${getAppUrl()}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/portal]", err);
    return NextResponse.json({ error: "Portal failed" }, { status: 500 });
  }
}
