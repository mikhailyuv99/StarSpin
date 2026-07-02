import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, subscriptionStatusFromStripe } from "@/lib/stripe";
import { isBillingPlan } from "@/lib/billing";

export const runtime = "nodejs";

async function updateMerchantFromSubscription(
  subscription: Stripe.Subscription,
  admin: ReturnType<typeof createAdminClient>,
) {
  const merchantId = subscription.metadata?.merchant_id;
  if (!merchantId) return;

  const plan = subscription.metadata?.plan;
  const updates: Record<string, unknown> = {
    subscription_status: subscriptionStatusFromStripe(subscription.status),
    stripe_subscription_id: subscription.status === "canceled" ? null : subscription.id,
  };

  if (plan && isBillingPlan(plan)) {
    updates.billing_plan = plan;
  }

  await admin.from("merchants").update(updates).eq("id", merchantId);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const headerStore = await headers();
  const signature = headerStore.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const merchantId = session.metadata?.merchant_id;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

        if (merchantId && subscriptionId) {
          const plan = session.metadata?.plan;
          await admin
            .from("merchants")
            .update({
              subscription_status: "active",
              stripe_subscription_id: subscriptionId,
              ...(plan && isBillingPlan(plan) ? { billing_plan: plan } : {}),
            })
            .eq("id", merchantId);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await updateMerchantFromSubscription(subscription, admin);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] handler", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
