import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAccountLive, getMerchantAccount } from "@/lib/merchant-account";
import { StarspinCheckout } from "@/components/billing/StarspinCheckout";
import { getCurrentMerchant } from "@/lib/merchant";
import { createClient } from "@/lib/supabase/server";
import { isBillingPlan, type BillingPlan } from "@/lib/billing";
import { setupStarspinCheckout } from "@/lib/create-subscription-checkout";
import { pricingMarketFromHeaders } from "@/lib/pricing-market";
import { getStripePublishableKey } from "@/lib/stripe-client";

export default async function SubscribeCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: planParam } = await searchParams;
  const plan = planParam && isBillingPlan(planParam) ? (planParam as BillingPlan) : "monthly";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/subscribe/checkout?plan=${plan}`)}`);
  }

  const merchant = await getCurrentMerchant();
  if (!merchant) {
    redirect("/setup");
  }

  const account = await getMerchantAccount();
  if (account && isAccountLive(account)) {
    redirect("/dashboard");
  }

  let publishableKey: string;
  try {
    publishableKey = getStripePublishableKey();
  } catch {
    redirect("/subscribe?checkout=error");
  }

  const headerStore = await headers();
  const setup = await setupStarspinCheckout(supabase, plan, pricingMarketFromHeaders(headerStore));

  return (
    <StarspinCheckout
      merchantName={merchant.name}
      plan={plan}
      publishableKey={publishableKey}
      initialClientSecret={setup.ok ? setup.clientSecret : null}
      initialError={setup.ok ? null : setup.error}
    />
  );
}
