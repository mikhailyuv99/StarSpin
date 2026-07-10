import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { User } from "@supabase/supabase-js";
import type { BillingPlan } from "@/lib/billing";
import { SUBSCRIPTION_TRIAL_DAYS } from "@/lib/billing";
import type { PricingMarket } from "@/lib/pricing-market";
import { getStripe, priceIdForPlan } from "@/lib/stripe";

export async function ensureStripeCustomer(
  supabase: SupabaseClient,
  stripe: Stripe,
  user: User,
  merchant: { id: string; stripe_customer_id: string | null },
): Promise<string> {
  if (merchant.stripe_customer_id) {
    return merchant.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    name: "STARSPIN merchant",
    metadata: {
      merchant_id: merchant.id,
      owner_id: user.id,
      product: "starspin",
    },
  });

  await supabase
    .from("merchants")
    .update({ stripe_customer_id: customer.id })
    .eq("id", merchant.id);

  return customer.id;
}

function subscriptionHasDefaultPaymentMethod(subscription: Stripe.Subscription): boolean {
  return Boolean(subscription.default_payment_method || subscription.default_source);
}

async function clientSecretFromSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<string | null> {
  // Trials create a SetupIntent (seti_…), not an invoice PaymentIntent.
  const pending = subscription.pending_setup_intent;
  if (pending) {
    if (typeof pending === "string") {
      const setupIntent = await stripe.setupIntents.retrieve(pending);
      if (setupIntent.client_secret) return setupIntent.client_secret;
    } else if (pending.client_secret) {
      return pending.client_secret;
    }
  }

  const invoice = subscription.latest_invoice;
  if (!invoice) return null;

  const expanded =
    typeof invoice === "string"
      ? await stripe.invoices.retrieve(invoice, { expand: ["confirmation_secret", "payment_intent"] })
      : invoice;

  const withSecret = expanded as Stripe.Invoice & {
    confirmation_secret?: { client_secret?: string | null } | null;
    payment_intent?: string | Stripe.PaymentIntent | null;
  };

  if (withSecret.confirmation_secret?.client_secret) {
    return withSecret.confirmation_secret.client_secret;
  }

  const paymentIntent = withSecret.payment_intent;
  if (paymentIntent && typeof paymentIntent !== "string" && paymentIntent.client_secret) {
    return paymentIntent.client_secret;
  }
  if (typeof paymentIntent === "string") {
    const pi = await stripe.paymentIntents.retrieve(paymentIntent);
    if (pi.client_secret) return pi.client_secret;
  }

  return null;
}

async function listOpenCheckoutSubscriptions(
  stripe: Stripe,
  customerId: string,
): Promise<Stripe.Subscription[]> {
  const expand = ["data.pending_setup_intent", "data.latest_invoice.confirmation_secret"] as const;
  const [incomplete, trialing] = await Promise.all([
    stripe.subscriptions.list({
      customer: customerId,
      status: "incomplete",
      limit: 10,
      expand: [...expand],
    }),
    stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 10,
      expand: [...expand],
    }),
  ]);

  return [...incomplete.data, ...trialing.data];
}

export async function getOrCreateSubscriptionPaymentSecret(
  stripe: Stripe,
  customerId: string,
  plan: BillingPlan,
  merchantId: string,
  market: PricingMarket,
): Promise<{ clientSecret: string; subscriptionId: string }> {
  const open = await listOpenCheckoutSubscriptions(stripe, customerId);

  const reusable = open.find(
    (sub) =>
      sub.metadata?.merchant_id === merchantId &&
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
    // Wipe unfinished checkouts with no card (including a reusable stub with no secret).
    if (subscriptionHasDefaultPaymentMethod(sub)) continue;
    try {
      await stripe.subscriptions.cancel(sub.id);
    } catch {
      /* ignore stale incomplete/trialing stubs */
    }
  }

  return createSubscriptionPaymentSecret(stripe, customerId, plan, merchantId, market);
}

export async function createSubscriptionPaymentSecret(
  stripe: Stripe,
  customerId: string,
  plan: BillingPlan,
  merchantId: string,
  market: PricingMarket,
): Promise<{ clientSecret: string; subscriptionId: string }> {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceIdForPlan(plan, market) }],
    trial_period_days: SUBSCRIPTION_TRIAL_DAYS,
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
      payment_method_types: ["card"],
    },
    trial_settings: {
      end_behavior: { missing_payment_method: "cancel" },
    },
    metadata: {
      merchant_id: merchantId,
      plan,
      product: "starspin",
      pricing_market: market,
    },
    description: "STARSPIN Pro subscription",
    expand: ["pending_setup_intent", "latest_invoice.confirmation_secret"],
  });

  const clientSecret = await clientSecretFromSubscription(stripe, subscription);

  if (!clientSecret) {
    throw new Error("Payment client secret missing");
  }

  return { clientSecret, subscriptionId: subscription.id };
}
