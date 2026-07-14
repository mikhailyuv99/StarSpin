import { redirect } from "next/navigation";
import {
  getMerchantAccount,
  isAccountLive,
  isMultiBusinessAccount,
} from "@/lib/merchant-account";
import { MultiBusinessCheckout } from "@/components/billing/MultiBusinessCheckout";
import { getCurrentMerchant } from "@/lib/merchant";
import { createClient } from "@/lib/supabase/server";
import { isBillingPlan, type BillingPlan } from "@/lib/billing";
import { getStripePublishableKey } from "@/lib/stripe-client";

export default async function MultiBusinessCheckoutPage({
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
    redirect(`/login?redirect=${encodeURIComponent(`/subscribe/multi-business?plan=${plan}`)}`);
  }

  const merchant = await getCurrentMerchant();
  if (!merchant) {
    redirect("/setup");
  }

  const account = await getMerchantAccount();
  if (account && isAccountLive(account) && isMultiBusinessAccount(account)) {
    redirect("/dashboard/establishments");
  }

  let publishableKey: string;
  try {
    publishableKey = getStripePublishableKey();
  } catch {
    redirect("/dashboard/establishments?checkout=error");
  }

  return <MultiBusinessCheckout plan={plan} publishableKey={publishableKey} />;
}
