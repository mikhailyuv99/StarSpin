import type { SupabaseClient } from "@supabase/supabase-js";
import type { BillingPlan } from "@/lib/billing";
import {
  getMerchantAccount,
  isAccountLive,
  isMultiBusinessAccount,
} from "@/lib/merchant-account";
import { getCurrentMerchant } from "@/lib/merchant";
import type { PricingMarket } from "@/lib/pricing-market";
import type { SubscriptionProduct } from "@/lib/types";
import { getStripe } from "@/lib/stripe";
import {
  createSubscriptionWithPaymentMethod,
  ensureAccountStripeCustomerForSubscribe,
} from "@/lib/stripe-billing";

export type CheckoutPrepareResult =
  | { ok: true; setupIntentId: string; clientSecret: string; plan: BillingPlan }
  | { ok: false; error: string; status: number };

export type CheckoutConfirmResult =
  | { ok: true; subscriptionId: string; plan: BillingPlan }
  | { ok: false; error: string; status: number };

async function loadSubscribeContext(
  supabase: SupabaseClient,
  opts: { requireMultiGate?: boolean },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const, status: 401 as const };

  const merchant = await getCurrentMerchant();
  if (!merchant) return { error: "Create your business first" as const, status: 400 as const };

  const account = await getMerchantAccount();
  if (!account) return { error: "Account not found" as const, status: 400 as const };

  if (opts.requireMultiGate) {
    if (isAccountLive(account) && isMultiBusinessAccount(account)) {
      return { error: "Already subscribed" as const, status: 400 as const };
    }
  } else if (isAccountLive(account)) {
    return { error: "Already subscribed" as const, status: 400 as const };
  }

  return { user, merchant, account };
}

async function prepareSetupIntent(
  supabase: SupabaseClient,
  plan: BillingPlan,
  product: SubscriptionProduct,
  requireMultiGate: boolean,
): Promise<CheckoutPrepareResult> {
  const ctx = await loadSubscribeContext(supabase, { requireMultiGate });
  if ("error" in ctx) return { ok: false, error: ctx.error, status: ctx.status };

  try {
    const stripe = getStripe();
    const customerId = await ensureAccountStripeCustomerForSubscribe(supabase, stripe, ctx.user, {
      id: ctx.account.id,
      subscription_status: ctx.account.subscription_status,
      stripe_customer_id: ctx.account.stripe_customer_id ?? null,
      stripe_subscription_id: ctx.account.stripe_subscription_id ?? null,
    });

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: "off_session",
      payment_method_types: ["card"],
      metadata: {
        account_id: ctx.account.id,
        plan,
        product,
      },
    });

    if (!setupIntent.client_secret) {
      return { ok: false, error: "Setup client secret missing", status: 500 };
    }

    return {
      ok: true,
      setupIntentId: setupIntent.id,
      clientSecret: setupIntent.client_secret,
      plan,
    };
  } catch (err) {
    console.error("[prepareSetupIntent]", err);
    const message = err instanceof Error ? err.message : "Subscription setup failed";
    return { ok: false, error: message, status: 500 };
  }
}

async function confirmSetupAndCreateSubscription(
  supabase: SupabaseClient,
  plan: BillingPlan,
  market: PricingMarket,
  setupIntentId: string,
  product: SubscriptionProduct,
  requireMultiGate: boolean,
): Promise<CheckoutConfirmResult> {
  if (!setupIntentId) {
    return { ok: false, error: "Missing setup intent", status: 400 };
  }

  const ctx = await loadSubscribeContext(supabase, { requireMultiGate });
  if ("error" in ctx) return { ok: false, error: ctx.error, status: ctx.status };

  try {
    const stripe = getStripe();
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

    if (setupIntent.status !== "succeeded") {
      return {
        ok: false,
        error: "Payment method not verified yet. Complete bank / Apple Pay confirmation first.",
        status: 400,
      };
    }

    const setupCustomer =
      typeof setupIntent.customer === "string"
        ? setupIntent.customer
        : setupIntent.customer?.id ?? null;
    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id ?? null;

    if (!paymentMethodId) {
      return { ok: false, error: "No payment method on verified setup", status: 400 };
    }

    if (setupIntent.metadata?.account_id && setupIntent.metadata.account_id !== ctx.account.id) {
      return { ok: false, error: "Setup does not match this account", status: 403 };
    }

    const customerId =
      setupCustomer ?? ctx.account.stripe_customer_id ?? null;
    if (!customerId) {
      return { ok: false, error: "Missing Stripe customer for verified setup", status: 400 };
    }
    if (setupCustomer && ctx.account.stripe_customer_id && setupCustomer !== ctx.account.stripe_customer_id) {
      return { ok: false, error: "Setup customer mismatch", status: 400 };
    }

    const created = await createSubscriptionWithPaymentMethod(
      stripe,
      customerId,
      paymentMethodId,
      plan,
      ctx.account.id,
      market,
      product,
    );

    return { ok: true, subscriptionId: created.subscriptionId, plan };
  } catch (err) {
    console.error("[confirmSetupAndCreateSubscription]", err);
    const message = err instanceof Error ? err.message : "Subscription setup failed";
    return { ok: false, error: message, status: 500 };
  }
}

export function prepareStarspinCheckout(
  supabase: SupabaseClient,
  plan: BillingPlan,
): Promise<CheckoutPrepareResult> {
  return prepareSetupIntent(supabase, plan, "starspin", false);
}

export function prepareMultiBusinessCheckout(
  supabase: SupabaseClient,
  plan: BillingPlan,
): Promise<CheckoutPrepareResult> {
  return prepareSetupIntent(supabase, plan, "starspin_multi_business", true);
}

export function confirmStarspinCheckout(
  supabase: SupabaseClient,
  plan: BillingPlan,
  market: PricingMarket,
  setupIntentId: string,
): Promise<CheckoutConfirmResult> {
  return confirmSetupAndCreateSubscription(
    supabase,
    plan,
    market,
    setupIntentId,
    "starspin",
    false,
  );
}

export function confirmMultiBusinessCheckout(
  supabase: SupabaseClient,
  plan: BillingPlan,
  market: PricingMarket,
  setupIntentId: string,
): Promise<CheckoutConfirmResult> {
  return confirmSetupAndCreateSubscription(
    supabase,
    plan,
    market,
    setupIntentId,
    "starspin_multi_business",
    true,
  );
}
