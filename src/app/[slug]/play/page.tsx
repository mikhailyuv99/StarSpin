import { createAdminClient } from "@/lib/supabase/admin";
import { RESERVED_SLUGS } from "@/lib/app-url";
import { isMerchantLive } from "@/lib/merchant-access";
import { getCachedPublicMerchant } from "@/lib/public-merchant";
import { notFound } from "next/navigation";
import { PublicFlow } from "@/components/PublicFlow";
import { MerchantInactiveNotice } from "../MerchantInactiveNotice";
import { journeyFontHref, parseJourneyTheme } from "@/lib/journey-theme";

export default async function PublicMerchantPlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.trim().toLowerCase();
  if (RESERVED_SLUGS.has(slug)) notFound();

  let payload;
  try {
    payload = await getCachedPublicMerchant(slug);
  } catch {
    notFound();
  }

  if (!payload.found || !payload.merchant) notFound();
  const merchant = payload.merchant;

  if (!isMerchantLive(merchant.subscription_status)) {
    return <MerchantInactiveNotice businessName={merchant.name} />;
  }

  if (merchant.google_review_link && !merchant.google_place_id) {
    void import("@/lib/google-place-id.server")
      .then(async ({ resolveAndPersistMerchantPlaceId }) => {
        try {
          const supabase = createAdminClient();
          await resolveAndPersistMerchantPlaceId(supabase, {
            id: merchant.id,
            name: merchant.name,
            google_place_id: merchant.google_place_id,
            google_review_link: merchant.google_review_link,
          });
        } catch {
          // Best-effort warmup only.
        }
      })
      .catch(() => {});
  }

  const fontHref = journeyFontHref(parseJourneyTheme(merchant.journey_theme).template);

  return (
    <>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <PublicFlow merchant={merchant} prizes={payload.prizes} />
    </>
  );
}
