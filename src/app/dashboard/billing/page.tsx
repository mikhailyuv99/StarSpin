import { redirect } from "next/navigation";
import { BillingManagePage } from "@/components/billing/BillingManagePage";
import { getBillingSummary } from "@/lib/billing-summary";
import { getCurrentMerchant } from "@/lib/merchant";
import { getStripe } from "@/lib/stripe";
import { getStripePublishableKey } from "@/lib/stripe-client";

export default async function DashboardBillingPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect("/setup");

  if (!merchant.stripe_customer_id) {
    redirect("/subscribe");
  }

  let publishableKey: string;
  try {
    publishableKey = getStripePublishableKey();
  } catch {
    redirect("/dashboard");
  }

  const stripe = getStripe();
  const summary = await getBillingSummary(stripe, merchant);

  return (
    <BillingManagePage
      merchantName={merchant.name}
      summary={summary}
      publishableKey={publishableKey}
    />
  );
}
