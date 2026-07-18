import type Stripe from "stripe";
import type { BillingPlan } from "@/lib/billing";
import { SUBSCRIPTION_TRIAL_DAYS } from "@/lib/billing";
import type { PricingMarket } from "@/lib/pricing-market";
import { multiBusinessPriceIdForPlan } from "@/lib/stripe";
import {
  clientSecretFromSubscription,
  createSubscriptionPaymentSecret,
  getOrCreateSubscriptionPaymentSecret,
  listOpenCheckoutSubscriptions,
  subscriptionHasDefaultPaymentMethod,
} from "@/lib/stripe-billing";

export async function getOrCreateMultiBusinessPaymentSecret(
  stripe: Stripe,
  customerId: string,
  plan: BillingPlan,
  accountId: string,
  market: PricingMarket,
): Promise<{ clientSecret: string; subscriptionId: string }> {
  const open = await listOpenCheckoutSubscriptions(stripe, customerId);

  const reusable = open.find(
    (sub) =>
      sub.metadata?.account_id === accountId &&
      sub.metadata?.product === "starspin_multi_business" &&
      sub.metadata?.plan === plan &&
      !subscriptionHasDefaultPaymentMethod(sub),
  );

  if (reusable) {
    const clientSecret = await clientSecretFromSubscription(stripe, reusable);
    if (clientSecret) {
      return { clientSecret, subscriptionId: reusable.id };
    }
  }

  for (const sub of open) {
    if (subscriptionHasDefaultPaymentMethod(sub)) continue;
    if (sub.metadata?.account_id !== accountId) continue;
    try {
      await stripe.subscriptions.cancel(sub.id);
    } catch {
      /* ignore stale incomplete/trialing stubs */
    }
  }

  return createMultiBusinessPaymentSecret(stripe, customerId, plan, accountId, market);
}

function isTrialNotAllowedError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const message = "message" in err && typeof err.message === "string" ? err.message.toLowerCase() : "";
  return (
    message.includes("trial") ||
    message.includes("free trial") ||
    ("code" in err && err.code === "customer_max_subscriptions")
  );
}

export async function createMultiBusinessPaymentSecret(
  stripe: Stripe,
  customerId: string,
  plan: BillingPlan,
  accountId: string,
  market: PricingMarket,
): Promise<{ clientSecret: string; subscriptionId: string }> {
  const baseParams: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: multiBusinessPriceIdForPlan(plan, market) }],
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    metadata: {
      account_id: accountId,
      plan,
      product: "starspin_multi_business",
      pricing_market: market,
    },
    description: "STARSPIN Multi-business subscription",
    expand: ["pending_setup_intent", "latest_invoice.confirmation_secret"],
  };

  let subscription: Stripe.Subscription;
  try {
    subscription = await stripe.subscriptions.create({
      ...baseParams,
      trial_period_days: SUBSCRIPTION_TRIAL_DAYS,
      trial_settings: {
        end_behavior: { missing_payment_method: "cancel" },
      },
    });
  } catch (err) {
    if (!isTrialNotAllowedError(err)) throw err;
    subscription = await stripe.subscriptions.create(baseParams);
  }

  const clientSecret = await clientSecretFromSubscription(stripe, subscription);

  if (!clientSecret) {
    throw new Error("Payment client secret missing");
  }

  return { clientSecret, subscriptionId: subscription.id };
}

/** Re-export standard account checkout for multi-business upgrade path. */
export { getOrCreateSubscriptionPaymentSecret, createSubscriptionPaymentSecret };
