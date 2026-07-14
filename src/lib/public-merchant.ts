import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { activeWheelPrizes } from "@/lib/prizes";
import type { Merchant, Prize, SocialLinks } from "@/lib/types";

/** Cache tag for a public merchant journey — use with revalidateTag. */
export function publicMerchantTag(slug: string): string {
  return `public-merchant:${slug.trim().toLowerCase()}`;
}

const MERCHANT_COLUMNS =
  "id, slug, name, logo_url, primary_color, secondary_color, google_review_link, google_place_id, social_links, subscription_status, flow_steps, customer_page_headline, customer_page_subtitle, spin_button_label, journey_theme, menu_enabled, menu_entry_mode";

const PRIZE_COLUMNS =
  "id, merchant_id, label, icon, probability_weight, rarity_tier, prize_mechanic, social_unlock_platform, stock_remaining, active, sort_order, redeem_next_visit, redeem_min_spend_cents, redeem_valid_days, created_at";

export type PublicMerchantPayload = {
  merchant: Merchant | null;
  prizes: Prize[];
  found: boolean;
};

async function fetchPublicMerchantBySlug(slug: string): Promise<PublicMerchantPayload> {
  const supabase = createAdminClient();

  const { data: merchantRow, error } = await supabase
    .from("merchants")
    .select(MERCHANT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !merchantRow) {
    return { merchant: null, prizes: [], found: false };
  }

  const merchant = {
    ...merchantRow,
    social_links: (merchantRow.social_links ?? {}) as SocialLinks,
  } as Merchant;

  const { data: prizes } = await supabase
    .from("prizes")
    .select(PRIZE_COLUMNS)
    .eq("merchant_id", merchant.id)
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return {
    merchant,
    prizes: activeWheelPrizes((prizes ?? []) as Prize[]),
    found: true,
  };
}

/** Cached merchant + wheel prizes for QR journey pages (~30s). */
export function getCachedPublicMerchant(slug: string): Promise<PublicMerchantPayload> {
  const normalized = slug.trim().toLowerCase();
  return unstable_cache(
    () => fetchPublicMerchantBySlug(normalized),
    ["public-merchant", normalized],
    {
      revalidate: 30,
      tags: [publicMerchantTag(normalized)],
    },
  )();
}
