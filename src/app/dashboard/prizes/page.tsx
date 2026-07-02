import { requireMerchant } from "@/lib/merchant";
import { createClient } from "@/lib/supabase/server";
import { PrizesManager } from "./PrizesManager";
import { SpinCooldownForm } from "./SpinCooldownForm";
import type { Prize } from "@/lib/types";
import { ui } from "@/components/ui/styles";
import { getTranslations } from "@/i18n/server";

export default async function PrizesPage() {
  const merchant = await requireMerchant();
  const t = await getTranslations();
  const supabase = await createClient();
  const { data: prizes } = await supabase
    .from("prizes")
    .select("*")
    .eq("merchant_id", merchant.id)
    .order("created_at");

  return (
    <div className="space-y-8">
      <div>
        <h1 className={ui.h1}>{t("dashboard.prizesTitle")}</h1>
        <p className={ui.muted}>{t("dashboard.prizesSubtitle")}</p>
      </div>
      <SpinCooldownForm merchantId={merchant.id} initialDays={merchant.spin_cooldown_days ?? 0} />
      <PrizesManager merchantId={merchant.id} initialPrizes={(prizes ?? []) as Prize[]} />
    </div>
  );
}
