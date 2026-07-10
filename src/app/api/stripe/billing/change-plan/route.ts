import { NextResponse } from "next/server";
import { changeSubscriptionPlan, getBillingSummary } from "@/lib/billing-summary";
import { isBillingPlan } from "@/lib/billing";
import { pricingMarketForBilling } from "@/lib/pricing-market";
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

    const { data: merchant } = await supabase
      .from("merchants")
      .select("id, stripe_customer_id, stripe_subscription_id, billing_plan")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!merchant?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account" }, { status: 400 });
    }

    const stripe = getStripe();
    let subscriptionPriceId: string | null = null;
    if (merchant.stripe_subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(merchant.stripe_subscription_id);
        subscriptionPriceId = sub.items.data[0]?.price?.id ?? null;
      } catch {
        /* list fallback handled in changeSubscriptionPlan */
      }
    }

    const market = pricingMarketForBilling(request.headers, subscriptionPriceId);
    await changeSubscriptionPlan(stripe, merchant, body.plan, market);

    await supabase
      .from("merchants")
      .update({ billing_plan: body.plan })
      .eq("id", merchant.id);

    const summary = await getBillingSummary(stripe, {
      ...merchant,
      billing_plan: body.plan,
    });

    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    console.error("[stripe/billing/change-plan]", err);
    return NextResponse.json({ error: "Plan change failed" }, { status: 500 });
  }
}
