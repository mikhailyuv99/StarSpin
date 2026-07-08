import { NextResponse } from "next/server";
import { changeSubscriptionPlan, getBillingSummary } from "@/lib/billing-summary";
import { isBillingPlan } from "@/lib/billing";
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
    await changeSubscriptionPlan(stripe, merchant, body.plan);

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
