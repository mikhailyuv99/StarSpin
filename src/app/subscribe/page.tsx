import { redirect } from "next/navigation";
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

  if (merchant.subscription_status === "active") {
    redirect("/dashboard");
  }

  return <SubscribeSalesPage merchantName={merchant.name} />;
}
