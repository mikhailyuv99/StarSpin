import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { User } from "@supabase/supabase-js";
import type { BillingPlan } from "@/lib/billing";
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

async function clientSecretFromSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const invoice = subscription.latest_invoice;
  if (!invoice || typeof invoice === "string") return null;

  const expanded =
    typeof invoice === "object"
      ? invoice
      : await stripe.invoices.retrieve(invoice, { expand: ["confirmation_secret"] });

  const withSecret = expanded as Stripe.Invoice & {
    confirmation_secret?: { client_secret?: string | null } | null;
  };

  return withSecret.confirmation_secret?.client_secret ?? null;
}

export async function getOrCreateSubscriptionPaymentSecret(
  stripe: Stripe,
  customerId: string,
  plan: BillingPlan,
  merchantId: string,
): Promise<{ clientSecret: string; subscriptionId: string }> {
  const open = await stripe.subscriptions.list({
    customer: customerId,
    status: "incomplete",
    limit: 10,
    expand: ["data.latest_invoice.confirmation_secret"],
  });

  const reusable = open.data.find(
    (sub) => sub.metadata?.merchant_id === merchantId && sub.metadata?.plan === plan,
  );

  if (reusable) {
    const clientSecret = await clientSecretFromSubscription(stripe, reusable);
    if (clientSecret) {
      return { clientSecret, subscriptionId: reusable.id };
    }
  }

  for (const sub of open.data) {
    if (sub.id !== reusable?.id) {
      try {
        await stripe.subscriptions.cancel(sub.id);
      } catch {
        /* ignore stale incomplete subs */
      }
    }
  }

  return createSubscriptionPaymentSecret(stripe, customerId, plan, merchantId);
}

export async function createSubscriptionPaymentSecret(
  stripe: Stripe,
  customerId: string,
  plan: BillingPlan,
  merchantId: string,
): Promise<{ clientSecret: string; subscriptionId: string }> {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceIdForPlan(plan) }],
    trial_period_days: 7,
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
      payment_method_types: ["card"],
    },
    metadata: {
      merchant_id: merchantId,
      plan,
      product: "starspin",
    },
    description: "STARSPIN Pro subscription",
    expand: ["latest_invoice.confirmation_secret"],
  });

  const clientSecret = await clientSecretFromSubscription(stripe, subscription);

  if (!clientSecret) {
    throw new Error("Payment client secret missing");
  }

  return { clientSecret, subscriptionId: subscription.id };
}
