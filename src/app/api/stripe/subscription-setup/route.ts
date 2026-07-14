import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBillingPlan } from "@/lib/billing";
import { prepareStarspinCheckout } from "@/lib/create-subscription-checkout";

/** Phase 1: create SetupIntent only — no trial / subscription yet. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = (await request.json()) as { plan?: string };
  if (!body.plan || !isBillingPlan(body.plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const result = await prepareStarspinCheckout(supabase, body.plan);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    setupIntentId: result.setupIntentId,
    clientSecret: result.clientSecret,
    plan: result.plan,
  });
}
