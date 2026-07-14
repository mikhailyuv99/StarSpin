import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBillingPlan } from "@/lib/billing";
import { confirmStarspinCheckout } from "@/lib/create-subscription-checkout";
import { pricingMarketFromRequest } from "@/lib/pricing-market";

/**
 * Phase 2: only after SetupIntent succeeded (Apple Pay / bank / 3DS done).
 * This is when the trial subscription is created.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = (await request.json()) as { plan?: string; setupIntentId?: string };
  if (!body.plan || !isBillingPlan(body.plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  if (!body.setupIntentId) {
    return NextResponse.json({ error: "Missing setup intent" }, { status: 400 });
  }

  const result = await confirmStarspinCheckout(
    supabase,
    body.plan,
    pricingMarketFromRequest(request),
    body.setupIntentId,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    subscriptionId: result.subscriptionId,
    plan: result.plan,
  });
}
