import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";
import { getStripe, priceIdForPlan } from "@/lib/stripe";
import { isBillingPlan, SUBSCRIPTION_TRIAL_DAYS } from "@/lib/billing";

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
      .select("id, stripe_customer_id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!merchant) {
      return NextResponse.json({ error: "Create your business first" }, { status: 400 });
    }

    const stripe = getStripe();
    let customerId = merchant.stripe_customer_id as string | null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          merchant_id: merchant.id,
          owner_id: user.id,
        },
      });
      customerId = customer.id;
      await supabase
        .from("merchants")
        .update({ stripe_customer_id: customerId })
        .eq("id", merchant.id);
    }

    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceIdForPlan(body.plan), quantity: 1 }],
      success_url: `${appUrl}/dashboard?billing=success`,
      cancel_url: `${appUrl}/subscribe`,
      metadata: {
        merchant_id: merchant.id,
        plan: body.plan,
      },
      subscription_data: {
        trial_period_days: SUBSCRIPTION_TRIAL_DAYS,
        metadata: {
          merchant_id: merchant.id,
          plan: body.plan,
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
