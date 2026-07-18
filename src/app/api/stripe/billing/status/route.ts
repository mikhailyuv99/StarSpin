import { NextResponse } from "next/server";
import { isAccountLive, getMerchantAccount } from "@/lib/merchant-account";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { reconcileAccountSubscriptionFromStripe } from "@/lib/stripe-billing";
import type { SubscriptionStatus } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await getMerchantAccount();

  if (!account) {
    return NextResponse.json({ live: false, status: null });
  }

  let status: SubscriptionStatus = account.subscription_status;
  let live = isAccountLive(account);

  // Heal accounts where Stripe checkout succeeded but webhooks never flipped DB status.
  if (!live) {
    try {
      const stripe = getStripe();
      const result = await reconcileAccountSubscriptionFromStripe(stripe, {
        id: account.id,
        subscription_status: account.subscription_status,
        stripe_customer_id: account.stripe_customer_id,
        stripe_subscription_id: account.stripe_subscription_id,
      });
      if (result.healed && result.status) {
        status = result.status;
        live = status === "active";
      }
    } catch (err) {
      console.warn("[billing/status] reconcile failed", err);
    }
  }

  return NextResponse.json({ live, status });
}
