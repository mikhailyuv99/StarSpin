import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { User } from "@supabase/supabase-js";
import type { BillingPlan } from "@/lib/billing";
import { SUBSCRIPTION_TRIAL_DAYS, isBillingPlan } from "@/lib/billing";
import type { PricingMarket } from "@/lib/pricing-market";
import type { SubscriptionProduct, SubscriptionStatus } from "@/lib/types";
import {
  priceIdForPlan,
  multiBusinessPriceIdForPlan,
  subscriptionStatusFromStripe,
  isConfirmedStripeSubscription,
} from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const RESIDUAL_SUBSCRIPTION_STATUSES: Stripe.SubscriptionListParams.Status[] = [
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "paused",
];

export async function ensureAccountStripeCustomer(
  supabase: SupabaseClient,
  stripe: Stripe,
  user: User,
  account: { id: string; stripe_customer_id: string | null },
): Promise<string> {
  if (account.stripe_customer_id) {
    return account.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    name: "STARSPIN merchant",
    metadata: {
      account_id: account.id,
      owner_id: user.id,
      product: "starspin",
    },
  });

  await supabase
    .from("merchant_accounts")
    .update({ stripe_customer_id: customer.id })
    .eq("id", account.id);

  await supabase
    .from("merchants")
    .update({ stripe_customer_id: customer.id })
    .eq("account_id", account.id);

  return customer.id;
}

/**
 * Cancelled/never-live accounts must check out like brand-new ones.
 * Leftover Stripe customers + prior trials block resubscribe, so wipe local
 * billing ids and create a fresh Stripe customer before subscription-setup.
 */
export async function ensureAccountStripeCustomerForSubscribe(
  supabase: SupabaseClient,
  stripe: Stripe,
  user: User,
  account: {
    id: string;
    subscription_status: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  },
): Promise<string> {
  const isCancelledLike =
    account.subscription_status === "cancelled" || account.subscription_status === "trial";

  if (!isCancelledLike) {
    return ensureAccountStripeCustomer(supabase, stripe, user, {
      id: account.id,
      stripe_customer_id: account.stripe_customer_id,
    });
  }

  if (account.stripe_customer_id) {
    await cancelResidualSubscriptions(stripe, account.stripe_customer_id);
  }

  if (account.stripe_customer_id || account.stripe_subscription_id) {
    await clearAccountStripeBillingIds(supabase, account.id);
  }

  return ensureAccountStripeCustomer(supabase, stripe, user, {
    id: account.id,
    stripe_customer_id: null,
  });
}

export async function clearAccountStripeBillingIds(
  supabase: SupabaseClient,
  accountId: string,
): Promise<void> {
  await supabase
    .from("merchant_accounts")
    .update({
      stripe_customer_id: null,
      stripe_subscription_id: null,
      billing_plan: null,
      subscription_product: "starspin",
      multi_business_status: "cancelled",
      multi_business_stripe_subscription_id: null,
      multi_business_billing_plan: null,
    })
    .eq("id", accountId);

  await supabase
    .from("merchants")
    .update({
      stripe_customer_id: null,
      stripe_subscription_id: null,
      billing_plan: null,
    })
    .eq("account_id", accountId);
}

export async function cancelResidualSubscriptions(
  stripe: Stripe,
  customerId: string,
): Promise<void> {
  const lists = await Promise.all(
    RESIDUAL_SUBSCRIPTION_STATUSES.map((status) =>
      stripe.subscriptions.list({
        customer: customerId,
        status,
        limit: 20,
      }),
    ),
  );

  await Promise.all(
    lists.flatMap((listed) =>
      listed.data.map((sub) => stripe.subscriptions.cancel(sub.id).catch(() => undefined)),
    ),
  );
}

/** @deprecated Use ensureAccountStripeCustomer */
export async function ensureStripeCustomer(
  supabase: SupabaseClient,
  stripe: Stripe,
  user: User,
  merchant: { id: string; stripe_customer_id: string | null },
): Promise<string> {
  return ensureAccountStripeCustomer(supabase, stripe, user, merchant);
}

export function subscriptionHasDefaultPaymentMethod(subscription: Stripe.Subscription): boolean {
  return Boolean(subscription.default_payment_method || subscription.default_source);
}

/**
 * Write Stripe subscription state into merchant_accounts (+ merchants via trigger).
 * Used after checkout confirm so activation does not depend on webhooks alone.
 */
export async function persistAccountFromStripeSubscription(
  accountId: string,
  subscription: Stripe.Subscription,
  customerId?: string | null,
): Promise<void> {
  if (!isConfirmedStripeSubscription(subscription)) {
    return;
  }
  if (
    subscription.status === "trialing" &&
    !subscriptionHasDefaultPaymentMethod(subscription)
  ) {
    return;
  }

  const plan = subscription.metadata?.plan;
  const product = (subscription.metadata?.product ?? "starspin") as SubscriptionProduct;
  const status = subscriptionStatusFromStripe(subscription.status);
  const resolvedCustomerId =
    customerId ??
    (typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null);

  const updates: Record<string, unknown> = {
    subscription_status: status,
    stripe_subscription_id: subscription.id,
    subscription_product: product,
  };

  if (resolvedCustomerId) {
    updates.stripe_customer_id = resolvedCustomerId;
  }
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

  const admin = createAdminClient();
  await admin.from("merchant_accounts").update(updates).eq("id", accountId);

  // Trigger syncs subscription_status; also keep merchant Stripe ids in sync.
  const merchantUpdates: Record<string, unknown> = {
    subscription_status: status,
  };
  if (resolvedCustomerId) merchantUpdates.stripe_customer_id = resolvedCustomerId;
  merchantUpdates.stripe_subscription_id = subscription.id;
  if (plan && isBillingPlan(plan)) merchantUpdates.billing_plan = plan;

  await admin.from("merchants").update(merchantUpdates).eq("account_id", accountId);
}

/** Heal cancelled/local-desynced accounts that already have a live Stripe subscription. */
export async function reconcileAccountSubscriptionFromStripe(
  stripe: Stripe,
  account: {
    id: string;
    subscription_status: string;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
  },
): Promise<{ healed: boolean; status?: SubscriptionStatus }> {
  if (account.subscription_status === "active" && account.stripe_subscription_id) {
    return { healed: false };
  }

  let subscription: Stripe.Subscription | null = null;

  if (account.stripe_subscription_id) {
    try {
      subscription = await stripe.subscriptions.retrieve(account.stripe_subscription_id);
    } catch {
      subscription = null;
    }
  }

  if (!subscription && account.stripe_customer_id) {
    const listed = await stripe.subscriptions.list({
      customer: account.stripe_customer_id,
      status: "all",
      limit: 20,
    });
    subscription =
      listed.data.find(
        (sub) =>
          isConfirmedStripeSubscription(sub) &&
          (sub.status === "active" || sub.status === "trialing") &&
          (sub.status !== "trialing" || subscriptionHasDefaultPaymentMethod(sub)),
      ) ?? null;
  }

  if (!subscription) return { healed: false };

  await persistAccountFromStripeSubscription(
    account.id,
    subscription,
    account.stripe_customer_id,
  );
  return {
    healed: true,
    status: subscriptionStatusFromStripe(subscription.status),
  };
}

export async function clientSecretFromSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<string | null> {
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

export async function listOpenCheckoutSubscriptions(
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
  accountId: string,
  market: PricingMarket,
  product: SubscriptionProduct = "starspin",
): Promise<{ clientSecret: string; subscriptionId: string }> {
  const open = await listOpenCheckoutSubscriptions(stripe, customerId);

  const reusable = open.find(
    (sub) =>
      sub.metadata?.account_id === accountId &&
      sub.metadata?.product === product &&
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

  return createSubscriptionPaymentSecret(stripe, customerId, plan, accountId, market, product);
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

export async function createSubscriptionPaymentSecret(
  stripe: Stripe,
  customerId: string,
  plan: BillingPlan,
  accountId: string,
  market: PricingMarket,
  product: SubscriptionProduct = "starspin",
  options: { withTrial?: boolean } = {},
): Promise<{ clientSecret: string; subscriptionId: string }> {
  const withTrial = options.withTrial ?? true;

  const baseParams: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: priceIdForPlan(plan, market) }],
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    metadata: {
      account_id: accountId,
      plan,
      product,
      pricing_market: market,
    },
    description:
      product === "starspin_multi_business"
        ? "STARSPIN Multi-business subscription"
        : "STARSPIN Pro subscription",
    expand: ["pending_setup_intent", "latest_invoice.confirmation_secret"],
  };

  const createWithTrial = (): Promise<Stripe.Subscription> =>
    stripe.subscriptions.create({
      ...baseParams,
      trial_period_days: SUBSCRIPTION_TRIAL_DAYS,
      trial_settings: {
        end_behavior: { missing_payment_method: "cancel" },
      },
    });

  const createWithoutTrial = (): Promise<Stripe.Subscription> => stripe.subscriptions.create(baseParams);

  let subscription: Stripe.Subscription;
  if (withTrial) {
    try {
      subscription = await createWithTrial();
    } catch (err) {
      if (!isTrialNotAllowedError(err)) throw err;
      subscription = await createWithoutTrial();
    }
  } else {
    subscription = await createWithoutTrial();
  }

  const clientSecret = await clientSecretFromSubscription(stripe, subscription);

  if (!clientSecret) {
    throw new Error("Payment client secret missing");
  }

  return { clientSecret, subscriptionId: subscription.id };
}

/**
 * Create the trial subscription only after SetupIntent succeeded
 * (Apple Pay / Google Pay / 3DS / bank verification already done).
 */
export async function createSubscriptionWithPaymentMethod(
  stripe: Stripe,
  customerId: string,
  paymentMethodId: string,
  plan: BillingPlan,
  accountId: string,
  market: PricingMarket,
  product: SubscriptionProduct = "starspin",
): Promise<{ subscriptionId: string }> {
  try {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : "";
    if (!message.includes("already been attached")) throw err;
  }

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  const baseParams: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [
      {
        price:
          product === "starspin_multi_business"
            ? multiBusinessPriceIdForPlan(plan, market)
            : priceIdForPlan(plan, market),
      },
    ],
    default_payment_method: paymentMethodId,
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    metadata: {
      account_id: accountId,
      plan,
      product,
      pricing_market: market,
    },
    description:
      product === "starspin_multi_business"
        ? "STARSPIN Multi-business subscription"
        : "STARSPIN Pro subscription",
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

  // Never rely on webhooks alone — activate immediately after Stripe accepts the sub.
  await persistAccountFromStripeSubscription(accountId, subscription, customerId);

  return { subscriptionId: subscription.id };
}
