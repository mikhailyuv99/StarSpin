import { requireMerchant } from "@/lib/merchant";
import { JourneySettingsForm } from "@/app/dashboard/flow/JourneySettingsForm";
import { ui } from "@/components/ui/styles";
import { getTranslations } from "@/i18n/server";

export default async function FlowPage() {
  const merchant = await requireMerchant();
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className={ui.h1}>{t("dashboard.flowTitle")}</h1>
        <p className={ui.muted}>{t("dashboard.flowSubtitleCombined")}</p>
      </div>
      <JourneySettingsForm merchant={merchant} />
    </div>
  );
}
