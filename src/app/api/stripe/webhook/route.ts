import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isConfirmedStripeSubscription, subscriptionStatusFromStripe } from "@/lib/stripe";
import { isBillingPlan } from "@/lib/billing";
import type { SubscriptionProduct } from "@/lib/types";
import { sendMerchantBillingEmail } from "@/lib/merchant-email";
import { subscriptionHasDefaultPaymentMethod } from "@/lib/stripe-billing";

export const runtime = "nodejs";

async function syncMerchantsSubscriptionStatus(
  admin: ReturnType<typeof createAdminClient>,
  accountId: string,
  status: ReturnType<typeof subscriptionStatusFromStripe>,
) {
  await admin.from("merchants").update({ subscription_status: status }).eq("account_id", accountId);
}

async function resolveAccountId(
  admin: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
): Promise<string | null> {
  if (subscription.metadata?.account_id) {
    return subscription.metadata.account_id;
  }

  const merchantId = subscription.metadata?.merchant_id;
  if (!merchantId) return null;

  const { data: merchant } = await admin
    .from("merchants")
    .select("account_id")
    .eq("id", merchantId)
    .maybeSingle();

  return merchant?.account_id ?? null;
}

async function updateAccountFromSubscription(
  subscription: Stripe.Subscription,
  admin: ReturnType<typeof createAdminClient>,
) {
  const accountId = await resolveAccountId(admin, subscription);
  if (!accountId) return;

  const canceled = subscription.status === "canceled";

  // Abandoned checkout stubs must never activate (or mark past_due) accounts.
  if (!canceled && !isConfirmedStripeSubscription(subscription)) {
    return;
  }

  const plan = subscription.metadata?.plan;
  const product = (subscription.metadata?.product ?? "starspin") as SubscriptionProduct;
  const status = subscriptionStatusFromStripe(subscription.status);
  const canceledCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  if (canceled) {
    const { data: current } = await admin
      .from("merchant_accounts")
      .select("stripe_subscription_id, stripe_customer_id")
      .eq("id", accountId)
      .maybeSingle();

    // Ignore stale cancels from an old customer/subscription after resubscribe.
    if (
      current?.stripe_subscription_id &&
      current.stripe_subscription_id !== subscription.id
    ) {
      return;
    }
    if (
      current?.stripe_customer_id &&
      canceledCustomerId &&
      current.stripe_customer_id !== canceledCustomerId
    ) {
      return;
    }

    await admin
      .from("merchant_accounts")
      .update({
        subscription_status: status,
        subscription_product: "starspin",
        stripe_subscription_id: null,
        stripe_customer_id: null,
        billing_plan: null,
        multi_business_status: "cancelled",
        multi_business_stripe_subscription_id: null,
        multi_business_billing_plan: null,
      })
      .eq("id", accountId);

    await admin
      .from("merchants")
      .update({
        subscription_status: status,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        billing_plan: null,
      })
      .eq("account_id", accountId);
    return;
  }

  // Extra guard: never flip live from a trialing stub without a card on file.
  if (
    subscription.status === "trialing" &&
    !subscriptionHasDefaultPaymentMethod(subscription)
  ) {
    return;
  }

  const updates: Record<string, unknown> = {
    subscription_status: status,
    stripe_subscription_id: subscription.id,
    subscription_product: product,
  };

  if (plan && isBillingPlan(plan)) {
    updates.billing_plan = plan;
  }

  if (product === "starspin_multi_business") {
    updates.multi_business_status = status;
    updates.multi_business_stripe_subscription_id = subscription.id;
    if (plan && isBillingPlan(plan)) {
      updates.multi_business_billing_plan = plan;
    }
  }

  await admin.from("merchant_accounts").update(updates).eq("id", accountId);
  await syncMerchantsSubscriptionStatus(admin, accountId, status);
}

async function accountOwnerEmail(
  admin: ReturnType<typeof createAdminClient>,
  accountId: string,
): Promise<string | null> {
  const { data: account } = await admin
    .from("merchant_accounts")
    .select("owner_id")
    .eq("id", accountId)
    .maybeSingle();

  if (!account?.owner_id) return null;

  const { data: user } = await admin.auth.admin.getUserById(account.owner_id);
  return user?.user?.email ?? null;
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
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

        if (!subscriptionId) break;

        const accountId = session.metadata?.account_id;
        const plan = session.metadata?.plan;
        const product = (session.metadata?.product ?? "starspin") as SubscriptionProduct;

        if (accountId) {
          await admin
            .from("merchant_accounts")
            .update({
              subscription_status: "active",
              stripe_subscription_id: subscriptionId,
              subscription_product: product,
              ...(plan && isBillingPlan(plan) ? { billing_plan: plan } : {}),
            })
            .eq("id", accountId);
          await syncMerchantsSubscriptionStatus(admin, accountId, "active");
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await updateAccountFromSubscription(subscription, admin);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionRef = invoice.parent?.subscription_details?.subscription;
        const subscriptionId =
          typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await updateAccountFromSubscription(subscription, admin);

        const accountId = await resolveAccountId(admin, subscription);
        if (accountId) {
          const email = await accountOwnerEmail(admin, accountId);
          if (email) {
            await sendMerchantBillingEmail({
              to: email,
              subject: "STARSPIN — payment issue on your subscription",
              body: "We couldn't process your latest STARSPIN payment. Update your card in Billing to keep your wheel live.",
            });
          }
        }
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
