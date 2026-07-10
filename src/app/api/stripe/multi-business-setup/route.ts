import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBillingPlan } from "@/lib/billing";
import {
  getMerchantAccount,
  isAccountLive,
  isMultiBusinessAccount,
} from "@/lib/merchant-account";
import { getCurrentMerchant } from "@/lib/merchant";
import { pricingMarketFromRequest } from "@/lib/pricing-market";
import { getStripe } from "@/lib/stripe";
import { ensureAccountStripeCustomer } from "@/lib/stripe-billing";
import { getOrCreateMultiBusinessPaymentSecret } from "@/lib/stripe-multi-business";

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
    if (!account) {
      return NextResponse.json({ error: "Create your first business first" }, { status: 400 });
    }

    if (isAccountLive(account) && isMultiBusinessAccount(account)) {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
    }

    const merchant = await getCurrentMerchant();
    if (!merchant) {
      return NextResponse.json({ error: "Create your business first" }, { status: 400 });
    }

    const stripe = getStripe();
    const market = pricingMarketFromRequest(request);
    const customerId = await ensureAccountStripeCustomer(supabase, stripe, user, {
      id: account.id,
      stripe_customer_id: account.stripe_customer_id ?? null,
    });
    const { clientSecret } = await getOrCreateMultiBusinessPaymentSecret(
      stripe,
      customerId,
      body.plan,
      account.id,
      market,
    );

    return NextResponse.json({ clientSecret, plan: body.plan });
  } catch (err) {
    console.error("[stripe/multi-business-setup]", err);
    const message =
      err instanceof Error && err.message.includes("STRIPE")
        ? err.message
        : err instanceof Error
          ? err.message
          : "Subscription setup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
