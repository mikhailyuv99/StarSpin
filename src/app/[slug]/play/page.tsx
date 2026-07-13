import { createAdminClient } from "@/lib/supabase/admin";
import { RESERVED_SLUGS } from "@/lib/app-url";
import { isMerchantLive } from "@/lib/merchant-access";
import { getCachedPublicMerchant } from "@/lib/public-merchant";
import { merchantLogoDisplayUrl } from "@/lib/merchant-logo-url";
import { notFound } from "next/navigation";
import { PublicFlow } from "@/components/PublicFlow";
import { MerchantInactiveNotice } from "../MerchantInactiveNotice";

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

  const logoSrc = merchantLogoDisplayUrl(merchant.logo_url, 128);
  const hasGoogleReview = Boolean(merchant.google_review_link?.trim());

  return (
    <>
      {logoSrc ? <link rel="preload" as="image" href={logoSrc} fetchPriority="high" /> : null}
      {hasGoogleReview ? (
        <>
          <link rel="dns-prefetch" href="https://search.google.com" />
          <link rel="preconnect" href="https://search.google.com" crossOrigin="" />
        </>
      ) : null}
      <PublicFlow merchant={merchant} prizes={payload.prizes} />
    </>
  );
}
