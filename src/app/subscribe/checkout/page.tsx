import { redirect } from "next/navigation";
import { isMerchantLive } from "@/lib/merchant-access";
import { StarspinCheckout } from "@/components/billing/StarspinCheckout";
import { getCurrentMerchant } from "@/lib/merchant";
import { createClient } from "@/lib/supabase/server";
import { isBillingPlan, type BillingPlan } from "@/lib/billing";
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

  if (isMerchantLive(merchant.subscription_status)) {
    redirect("/dashboard");
  }

  let publishableKey: string;
  try {
    publishableKey = getStripePublishableKey();
  } catch {
    redirect("/subscribe?checkout=error");
  }

  return <StarspinCheckout merchantName={merchant.name} plan={plan} publishableKey={publishableKey} />;
}
