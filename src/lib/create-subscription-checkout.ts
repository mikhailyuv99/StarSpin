import type { SupabaseClient } from "@supabase/supabase-js";
import type { BillingPlan } from "@/lib/billing";
import {
  getMerchantAccount,
  isAccountLive,
  isMultiBusinessAccount,
} from "@/lib/merchant-account";
import { getCurrentMerchant } from "@/lib/merchant";
import type { PricingMarket } from "@/lib/pricing-market";
import { getStripe } from "@/lib/stripe";
import {
  createSubscriptionWithPaymentMethod,
  ensureAccountStripeCustomerForSubscribe,
} from "@/lib/stripe-billing";

export type CheckoutSetupResult =
  | { ok: true; subscriptionId: string; clientSecret: string | null; plan: BillingPlan }
  | { ok: false; error: string; status: number };

export async function setupStarspinCheckout(
  supabase: SupabaseClient,
  plan: BillingPlan,
  market: PricingMarket,
  paymentMethodId: string,
): Promise<CheckoutSetupResult> {
  if (!paymentMethodId) {
    return { ok: false, error: "Missing payment method", status: 400 };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized", status: 401 };

  const merchant = await getCurrentMerchant();
  if (!merchant) return { ok: false, error: "Create your business first", status: 400 };

  const account = await getMerchantAccount();
  if (!account) return { ok: false, error: "Account not found", status: 400 };

  if (isAccountLive(account)) {
    return { ok: false, error: "Already subscribed", status: 400 };
  }

  try {
    const stripe = getStripe();
    const customerId = await ensureAccountStripeCustomerForSubscribe(supabase, stripe, user, {
      id: account.id,
      subscription_status: account.subscription_status,
      stripe_customer_id: account.stripe_customer_id ?? null,
      stripe_subscription_id: account.stripe_subscription_id ?? null,
    });
    const created = await createSubscriptionWithPaymentMethod(
      stripe,
      customerId,
      paymentMethodId,
      plan,
      account.id,
      market,
      "starspin",
    );
    return {
      ok: true,
      subscriptionId: created.subscriptionId,
      clientSecret: created.clientSecret,
      plan,
    };
  } catch (err) {
    console.error("[setupStarspinCheckout]", err);
    const message = err instanceof Error ? err.message : "Subscription setup failed";
    return { ok: false, error: message, status: 500 };
  }
}

export async function setupMultiBusinessCheckout(
  supabase: SupabaseClient,
  plan: BillingPlan,
  market: PricingMarket,
  paymentMethodId: string,
): Promise<CheckoutSetupResult> {
  if (!paymentMethodId) {
    return { ok: false, error: "Missing payment method", status: 400 };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized", status: 401 };

  const account = await getMerchantAccount();
  if (!account) {
    return { ok: false, error: "Create your first business first", status: 400 };
  }

  if (isAccountLive(account) && isMultiBusinessAccount(account)) {
    return { ok: false, error: "Already subscribed", status: 400 };
  }

  const merchant = await getCurrentMerchant();
  if (!merchant) return { ok: false, error: "Create your business first", status: 400 };

  try {
    const stripe = getStripe();
    const customerId = await ensureAccountStripeCustomerForSubscribe(supabase, stripe, user, {
      id: account.id,
      subscription_status: account.subscription_status,
      stripe_customer_id: account.stripe_customer_id ?? null,
      stripe_subscription_id: account.stripe_subscription_id ?? null,
    });
    const created = await createSubscriptionWithPaymentMethod(
      stripe,
      customerId,
      paymentMethodId,
      plan,
      account.id,
      market,
      "starspin_multi_business",
    );
    return {
      ok: true,
      subscriptionId: created.subscriptionId,
      clientSecret: created.clientSecret,
      plan,
    };
  } catch (err) {
    console.error("[setupMultiBusinessCheckout]", err);
    const message = err instanceof Error ? err.message : "Subscription setup failed";
    return { ok: false, error: message, status: 500 };
  }
}
