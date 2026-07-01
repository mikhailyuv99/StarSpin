import { createClient } from "@/lib/supabase/server";
import type { Merchant } from "@/lib/types";
import { cache } from "react";
import { redirect } from "next/navigation";

export const getCurrentMerchant = cache(async (): Promise<Merchant | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("merchants")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  return data as Merchant | null;
});

export async function requireMerchant(): Promise<Merchant> {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect("/setup");
  return merchant;
}
