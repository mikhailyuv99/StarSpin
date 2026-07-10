import { redirect } from "next/navigation";
import { isAccountLive, getMerchantAccount } from "@/lib/merchant-account";
import { SubscribeSalesPage } from "@/components/billing/SubscribeSalesPage";
import { getCurrentMerchant } from "@/lib/merchant";
import { createClient } from "@/lib/supabase/server";

export default async function SubscribePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/subscribe");
  }

  const merchant = await getCurrentMerchant();
  if (!merchant) {
    redirect("/setup");
  }

  const account = await getMerchantAccount();
  if (account && isAccountLive(account)) {
    redirect("/dashboard");
  }

  return <SubscribeSalesPage merchantName={merchant.name} />;
}
