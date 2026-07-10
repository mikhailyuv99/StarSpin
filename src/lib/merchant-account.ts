import { createClient } from "@/lib/supabase/server";
import type { MerchantAccount } from "@/lib/types";
import { cache } from "react";
import { isMerchantLive } from "@/lib/merchant-access";

export const getMerchantAccount = cache(async (): Promise<MerchantAccount | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
      .from("merchant_accounts")
      .select(
        "id, owner_id, subscription_status, stripe_customer_id, stripe_subscription_id, billing_plan, subscription_product, created_at",
      )
      .eq("owner_id", user.id)
      .maybeSingle();

    return data as MerchantAccount | null;
  } catch {
    return null;
  }
});

export function isAccountLive(account: MerchantAccount | null): boolean {
  return isMerchantLive(account?.subscription_status ?? "cancelled");
}

export function isMultiBusinessAccount(account: MerchantAccount | null): boolean {
  return account?.subscription_product === "starspin_multi_business";
}

/** Second+ establishments require an active multi-business plan (one subscription covers all). */
export function canAddEstablishment(
  account: MerchantAccount | null,
  establishmentCount: number,
): boolean {
  if (establishmentCount === 0) return true;
  return isAccountLive(account) && isMultiBusinessAccount(account);
}

export function accountBillingAccount(
  account: MerchantAccount,
): { stripe_customer_id: string; stripe_subscription_id: string | null } | null {
  if (!account.stripe_customer_id) return null;
  return {
    stripe_customer_id: account.stripe_customer_id,
    stripe_subscription_id: account.stripe_subscription_id ?? null,
  };
}
