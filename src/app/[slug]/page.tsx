import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { RESERVED_SLUGS } from "@/lib/app-url";
import { resolveAndPersistMerchantPlaceId } from "@/lib/google-place-id.server";
import { activeWheelPrizes } from "@/lib/prizes";
import { notFound } from "next/navigation";
import { PublicFlow } from "@/components/PublicFlow";
import type { Merchant, Prize } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PublicMerchantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  noStore();
  const { slug: rawSlug } = await params;
  const slug = rawSlug.trim().toLowerCase();

  if (RESERVED_SLUGS.has(slug)) notFound();

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    notFound();
  }

  const { data: merchantRow, error } = await supabase
    .from("merchants")
    .select("*")
    .eq("slug", slug)
    .eq("subscription_status", "active")
    .maybeSingle();

  if (error || !merchantRow) notFound();

  const resolution = await resolveAndPersistMerchantPlaceId(supabase, {
    id: merchantRow.id,
    name: merchantRow.name,
    google_place_id: merchantRow.google_place_id,
    google_review_link: merchantRow.google_review_link,
  });

  const merchant = {
    ...merchantRow,
    google_place_id: resolution.placeId ?? null,
  } as Merchant;

  const { data: prizes } = await supabase
    .from("prizes")
    .select("*")
    .eq("merchant_id", merchant.id)
    .eq("active", true)
    .order("created_at");

  return (
    <PublicFlow merchant={merchant} prizes={activeWheelPrizes((prizes ?? []) as Prize[])} />
  );
}
