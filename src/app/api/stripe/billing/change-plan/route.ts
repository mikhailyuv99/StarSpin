import { NextResponse } from "next/server";
import { changeSubscriptionPlan, getBillingSummary } from "@/lib/billing-summary";
import { isBillingPlan } from "@/lib/billing";
import { pricingMarketForBilling } from "@/lib/pricing-market";
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

    const body = (await request.json()) as { plan?: string };
    if (!body.plan || !isBillingPlan(body.plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const account = await getMerchantAccount();
    const billing = account ? accountBillingAccount(account) : null;

    if (!billing || !account) {
      return NextResponse.json({ error: "No billing account" }, { status: 400 });
    }

    const stripe = getStripe();
    let subscriptionPriceId: string | null = null;
    if (billing.stripe_subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(billing.stripe_subscription_id);
        subscriptionPriceId = sub.items.data[0]?.price?.id ?? null;
      } catch {
        /* list fallback handled in changeSubscriptionPlan */
      }
    }

    const market = pricingMarketForBilling(request.headers, subscriptionPriceId);
    await changeSubscriptionPlan(stripe, billing, body.plan, market);

    await supabase
      .from("merchant_accounts")
      .update({ billing_plan: body.plan })
      .eq("id", account.id);

    const summary = await getBillingSummary(stripe, {
      ...account,
      ...billing,
      billing_plan: body.plan,
    });

    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    console.error("[stripe/billing/change-plan]", err);
    return NextResponse.json({ error: "Plan change failed" }, { status: 500 });
  }
}
