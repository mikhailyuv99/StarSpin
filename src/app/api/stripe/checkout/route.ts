import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import { getCurrentMerchant } from "@/lib/merchant";
import { getMerchantAccount } from "@/lib/merchant-account";
import { createClient } from "@/lib/supabase/server";
import { pricingMarketFromRequest } from "@/lib/pricing-market";
import { getStripe, priceIdForPlan } from "@/lib/stripe";
import { isBillingPlan, SUBSCRIPTION_TRIAL_DAYS } from "@/lib/billing";
import { ensureAccountStripeCustomerForSubscribe } from "@/lib/stripe-billing";

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

    const merchant = await getCurrentMerchant();
    const account = await getMerchantAccount();

    if (!merchant || !account) {
      return NextResponse.json({ error: "Create your business first" }, { status: 400 });
    }

    const stripe = getStripe();
    const customerId = await ensureAccountStripeCustomerForSubscribe(supabase, stripe, user, {
      id: account.id,
      subscription_status: account.subscription_status,
      stripe_customer_id: account.stripe_customer_id ?? null,
      stripe_subscription_id: account.stripe_subscription_id ?? null,
    });

    const appUrl = getAppUrl();
    const market = pricingMarketFromRequest(request);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceIdForPlan(body.plan, market), quantity: 1 }],
      success_url: `${appUrl}/dashboard?billing=success`,
      cancel_url: `${appUrl}/subscribe`,
      metadata: {
        account_id: account.id,
        plan: body.plan,
        product: "starspin",
        pricing_market: market,
      },
      subscription_data: {
        trial_period_days: SUBSCRIPTION_TRIAL_DAYS,
        metadata: {
          account_id: account.id,
          plan: body.plan,
          product: "starspin",
          pricing_market: market,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      payment_method_types: ["card"],
      payment_method_options: {
        card: {
          request_three_d_secure: "automatic",
        },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Checkout session failed" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    const message =
      err instanceof Error && err.message.includes("STRIPE_SECRET_KEY")
        ? "Stripe is not configured"
        : err instanceof Error
          ? err.message
          : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
