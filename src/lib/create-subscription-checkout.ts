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
  ensureAccountStripeCustomerForSubscribe,
  getOrCreateSubscriptionPaymentSecret,
} from "@/lib/stripe-billing";
import { getOrCreateMultiBusinessPaymentSecret } from "@/lib/stripe-multi-business";

export type CheckoutSetupResult =
  | { ok: true; clientSecret: string; plan: BillingPlan }
  | { ok: false; error: string; status: number };

export async function setupStarspinCheckout(
  supabase: SupabaseClient,
  plan: BillingPlan,
  market: PricingMarket,
): Promise<CheckoutSetupResult> {
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
    const { clientSecret } = await getOrCreateSubscriptionPaymentSecret(
      stripe,
      customerId,
      plan,
      account.id,
      market,
      "starspin",
    );
    return { ok: true, clientSecret, plan };
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
): Promise<CheckoutSetupResult> {
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
    const { clientSecret } = await getOrCreateMultiBusinessPaymentSecret(
      stripe,
      customerId,
      plan,
      account.id,
      market,
    );
    return { ok: true, clientSecret, plan };
  } catch (err) {
    console.error("[setupMultiBusinessCheckout]", err);
    const message = err instanceof Error ? err.message : "Subscription setup failed";
    return { ok: false, error: message, status: 500 };
  }
}
