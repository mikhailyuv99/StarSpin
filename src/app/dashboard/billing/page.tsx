import { redirect } from "next/navigation";
import { BillingManagePage } from "@/components/billing/BillingManagePage";
import { getBillingSummary } from "@/lib/billing-summary";
import { accountBillingAccount, getMerchantAccount, isAccountLive } from "@/lib/merchant-account";
import { getCurrentMerchant } from "@/lib/merchant";
import { getStripe } from "@/lib/stripe";
import { getStripePublishableKey } from "@/lib/stripe-client";

export default async function DashboardBillingPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect("/setup");

  const account = await getMerchantAccount();
  if (!account) redirect("/setup");

  const billing = accountBillingAccount(account);
  if (!billing) {
    redirect("/subscribe");
  }

  let publishableKey: string;
  try {
    publishableKey = getStripePublishableKey();
  } catch {
    redirect("/dashboard");
  }

  const stripe = getStripe();
  const summary = await getBillingSummary(stripe, { ...account, ...billing });

  return (
    <BillingManagePage
      merchantName={merchant.name}
      summary={summary}
      publishableKey={publishableKey}
      isSubscribed={isAccountLive(account)}
    />
  );
}
