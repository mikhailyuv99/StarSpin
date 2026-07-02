import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBillingPlan } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";
import { createSubscriptionPaymentSecret, ensureStripeCustomer } from "@/lib/stripe-billing";

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
      .select("id, stripe_customer_id, subscription_status")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!merchant) {
      return NextResponse.json({ error: "Create your business first" }, { status: 400 });
    }

    if (merchant.subscription_status === "active") {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
    }

    const stripe = getStripe();
    const customerId = await ensureStripeCustomer(supabase, stripe, user, merchant);
    const { clientSecret } = await createSubscriptionPaymentSecret(
      stripe,
      customerId,
      body.plan,
      merchant.id,
    );

    return NextResponse.json({ clientSecret, plan: body.plan });
  } catch (err) {
    console.error("[stripe/subscription-setup]", err);
    const message =
      err instanceof Error && err.message.includes("STRIPE")
        ? err.message
        : err instanceof Error
          ? err.message
          : "Subscription setup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
