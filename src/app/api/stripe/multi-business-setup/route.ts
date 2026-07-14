import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBillingPlan } from "@/lib/billing";
import { prepareMultiBusinessCheckout } from "@/lib/create-subscription-checkout";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = (await request.json()) as { plan?: string };
  if (!body.plan || !isBillingPlan(body.plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const result = await prepareMultiBusinessCheckout(supabase, body.plan);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    setupIntentId: result.setupIntentId,
    clientSecret: result.clientSecret,
    plan: result.plan,
  });
}
