import { createAdminClient } from "@/lib/supabase/admin";
import { RESERVED_SLUGS } from "@/lib/app-url";
import { notFound } from "next/navigation";
import { PublicFlow } from "@/components/PublicFlow";
import type { Merchant, Prize } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PublicMerchantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.trim().toLowerCase();

  if (RESERVED_SLUGS.has(slug)) notFound();

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    notFound();
  }

  const { data: merchant, error } = await supabase
    .from("merchants")
    .select("*")
    .eq("slug", slug)
    .in("subscription_status", ["active", "trial"])
    .maybeSingle();

  if (error || !merchant) notFound();

  const { data: prizes } = await supabase
    .from("prizes")
    .select("*")
    .eq("merchant_id", merchant.id)
    .eq("active", true);

  return <PublicFlow merchant={merchant as Merchant} prizes={(prizes ?? []) as Prize[]} />;
}
