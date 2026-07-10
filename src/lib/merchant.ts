import { createClient } from "@/lib/supabase/server";
import type { Merchant } from "@/lib/types";
import { ACTIVE_MERCHANT_COOKIE } from "@/lib/active-merchant";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const getOwnerMerchants = cache(async (): Promise<Merchant[]> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data } = await supabase
      .from("merchants")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });

    return (data as Merchant[]) ?? [];
  } catch {
    return [];
  }
});

export const getCurrentMerchant = cache(async (): Promise<Merchant | null> => {
  const merchants = await getOwnerMerchants();
  if (merchants.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_MERCHANT_COOKIE)?.value;

  if (activeId) {
    const match = merchants.find((m) => m.id === activeId);
    if (match) return match;
  }

  return merchants[0];
});

export async function requireMerchant(): Promise<Merchant> {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect("/setup");
  return merchant;
}

export function merchantBillingAccount(
  merchant: Merchant,
): { stripe_customer_id: string; stripe_subscription_id: string | null } | null {
  if (!merchant.stripe_customer_id) return null;
  return {
    stripe_customer_id: merchant.stripe_customer_id,
    stripe_subscription_id: merchant.stripe_subscription_id ?? null,
  };
}
