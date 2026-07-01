import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PublicFlow } from "@/components/PublicFlow";
import type { Merchant, Prize } from "@/lib/types";

export default async function PublicMerchantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("slug", slug)
    .in("subscription_status", ["active", "trial"])
    .maybeSingle();

  if (!merchant) notFound();

  const { data: prizes } = await supabase
    .from("prizes")
    .select("*")
    .eq("merchant_id", merchant.id)
    .eq("active", true);

  return <PublicFlow merchant={merchant as Merchant} prizes={(prizes ?? []) as Prize[]} />;
}
