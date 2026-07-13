import { requireMerchant } from "@/lib/merchant";
import { createClient } from "@/lib/supabase/server";
import { ReviewsManager } from "./ReviewsManager";
import type { Spin } from "@/lib/types";
import { ui } from "@/components/ui/styles";
import { getTranslations } from "@/i18n/server";

export default async function ReviewsPage() {
  const merchant = await requireMerchant();
  const t = await getTranslations();
  const supabase = await createClient();
  const { data: spins, error } = await supabase
    .from("spins")
    .select("*, prize:prizes!prize_id(label)")
    .eq("merchant_id", merchant.id)
    .not("review_screenshot_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Reviews spins select failed:", error.message);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className={ui.h1}>{t("dashboard.reviewsTitle")}</h1>
        <p className={ui.muted}>{t("dashboard.reviewsSubtitle")}</p>
      </div>
      <ReviewsManager spins={(spins ?? []) as Spin[]} />
    </div>
  );
}
