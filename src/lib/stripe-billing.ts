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

  const invoice = subscription.latest_invoice;
  if (!invoice || typeof invoice === "string") {
    throw new Error("Subscription invoice missing");
  }

  const expandedInvoice = invoice as Stripe.Invoice & {
    confirmation_secret?: { client_secret?: string | null } | null;
  };

  const clientSecret = expandedInvoice.confirmation_secret?.client_secret ?? null;

  if (!clientSecret) {
    throw new Error("Payment client secret missing");
  }

  return { clientSecret, subscriptionId: subscription.id };
}
