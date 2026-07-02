import type Stripe from "stripe";
import type { BillingPlan } from "@/lib/billing";
import { isBillingPlan } from "@/lib/billing";
import { getAnnualPriceId, getMonthlyPriceId } from "@/lib/stripe";

export type BillingSummary = {
  hasAccount: boolean;
  plan: BillingPlan | null;
  stripeStatus: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  amountCents: number | null;
  currency: string | null;
  interval: "month" | "year" | null;
  paymentMethodBrand: string | null;
  paymentMethodLast4: string | null;
};

function planFromPriceId(priceId: string): BillingPlan | null {
  if (priceId === getMonthlyPriceId()) return "monthly";
  if (priceId === getAnnualPriceId()) return "annual";
  return null;
}

function paymentMethodDetails(
  pm: Stripe.PaymentMethod | string | null | undefined,
): { brand: string | null; last4: string | null } {
  if (!pm || typeof pm === "string") return { brand: null, last4: null };
  if (pm.type !== "card" || !pm.card) return { brand: pm.type, last4: null };
  return { brand: pm.card.brand ?? "card", last4: pm.card.last4 ?? null };
}

export async function getBillingSummary(
  stripe: Stripe,
  merchant: {
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    billing_plan?: BillingPlan | null;
  },
): Promise<BillingSummary> {
  const empty: BillingSummary = {
    hasAccount: false,
    plan: null,
    stripeStatus: null,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    trialEnd: null,
    amountCents: null,
    currency: null,
    interval: null,
    paymentMethodBrand: null,
    paymentMethodLast4: null,
  };

  if (!merchant.stripe_customer_id) return empty;

  let subscription: Stripe.Subscription | null = null;

  if (merchant.stripe_subscription_id) {
    try {
      subscription = await stripe.subscriptions.retrieve(merchant.stripe_subscription_id, {
        expand: ["default_payment_method", "items.data.price"],
      });
      if (subscription.status === "canceled") subscription = null;
    } catch {
      subscription = null;
    }
  }

  if (!subscription) {
    const list = await stripe.subscriptions.list({
      customer: merchant.stripe_customer_id,
      status: "all",
      limit: 3,
      expand: ["data.default_payment_method", "data.items.data.price"],
    });
    subscription =
      list.data.find((sub) => sub.status !== "canceled" && sub.status !== "incomplete_expired") ??
      null;
  }

  if (!subscription) {
    return {
      ...empty,
      hasAccount: true,
      plan: merchant.billing_plan && isBillingPlan(merchant.billing_plan) ? merchant.billing_plan : null,
    };
  }

  const item = subscription.items.data[0];
  const price = item?.price;
  const metadataPlan = subscription.metadata?.plan;
  const plan =
    (metadataPlan && isBillingPlan(metadataPlan) ? metadataPlan : null) ??
    (price?.id ? planFromPriceId(price.id) : null) ??
    (merchant.billing_plan && isBillingPlan(merchant.billing_plan) ? merchant.billing_plan : null);

  const pm = paymentMethodDetails(subscription.default_payment_method);
  const periodEnd = item?.current_period_end ?? null;

  return {
    hasAccount: true,
    plan,
    stripeStatus: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    trialEnd: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    amountCents: price?.unit_amount ?? null,
    currency: price?.currency ?? null,
    interval: price?.recurring?.interval === "year" ? "year" : price?.recurring?.interval === "month" ? "month" : null,
    paymentMethodBrand: pm.brand,
    paymentMethodLast4: pm.last4,
  };
}

async function getMerchantSubscription(
  stripe: Stripe,
  merchant: { stripe_customer_id: string; stripe_subscription_id: string | null },
): Promise<Stripe.Subscription> {
  if (merchant.stripe_subscription_id) {
    try {
      const sub = await stripe.subscriptions.retrieve(merchant.stripe_subscription_id);
      if (sub.status !== "canceled") return sub;
    } catch {
      /* list fallback */
    }
  }

  const list = await stripe.subscriptions.list({
    customer: merchant.stripe_customer_id,
    status: "all",
    limit: 3,
  });
  const active = list.data.find((sub) => sub.status !== "canceled" && sub.status !== "incomplete_expired");
  if (!active) throw new Error("No active subscription");
  return active;
}

export async function createPaymentSetupSecret(
  stripe: Stripe,
  customerId: string,
): Promise<string> {
  const intent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    metadata: { product: "starspin" },
  });
  if (!intent.client_secret) throw new Error("Setup secret missing");
  return intent.client_secret;
}

export async function attachPaymentMethodFromSetup(
  stripe: Stripe,
  setupIntentId: string,
  merchant: { stripe_customer_id: string; stripe_subscription_id: string | null },
): Promise<void> {
  const intent = await stripe.setupIntents.retrieve(setupIntentId);
  if (intent.status !== "succeeded") throw new Error("Setup not completed");
  const paymentMethodId =
    typeof intent.payment_method === "string" ? intent.payment_method : intent.payment_method?.id;
  if (!paymentMethodId) throw new Error("Payment method missing");

  await stripe.customers.update(merchant.stripe_customer_id, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  const subscription = await getMerchantSubscription(stripe, merchant);
  await stripe.subscriptions.update(subscription.id, {
    default_payment_method: paymentMethodId,
  });
}

export async function cancelSubscriptionAtPeriodEnd(
  stripe: Stripe,
  merchant: { stripe_customer_id: string; stripe_subscription_id: string | null },
): Promise<void> {
  const subscription = await getMerchantSubscription(stripe, merchant);
  await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });
}

export async function resumeSubscription(
  stripe: Stripe,
  merchant: { stripe_customer_id: string; stripe_subscription_id: string | null },
): Promise<void> {
  const subscription = await getMerchantSubscription(stripe, merchant);
  await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: false });
}
