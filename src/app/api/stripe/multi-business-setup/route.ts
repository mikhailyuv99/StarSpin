import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBillingPlan } from "@/lib/billing";
import { setupMultiBusinessCheckout } from "@/lib/create-subscription-checkout";
import { pricingMarketFromRequest } from "@/lib/pricing-market";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = (await request.json()) as { plan?: string };
  if (!body.plan || !isBillingPlan(body.plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const result = await setupMultiBusinessCheckout(
    supabase,
    body.plan,
    pricingMarketFromRequest(request),
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ clientSecret: result.clientSecret, plan: result.plan });
}
