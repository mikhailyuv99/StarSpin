import { requireMerchant } from "@/lib/merchant";
import { JourneySettingsForm } from "@/app/dashboard/flow/JourneySettingsForm";
import { publicMerchantPath } from "@/lib/app-url";
import { ui } from "@/components/ui/styles";
import { getTranslations } from "@/i18n/server";

export default async function FlowPage() {
  const merchant = await requireMerchant();
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={ui.h1}>{t("dashboard.flowTitle")}</h1>
          <p className={ui.muted}>{t("dashboard.flowSubtitleCombined")}</p>
        </div>
        <a
          href={publicMerchantPath(merchant.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ui.btnYellow} shrink-0 text-sm !w-auto px-5 py-2.5`}
        >
          {t("dashboard.testJourney")} ↗
        </a>
      </div>
      <JourneySettingsForm merchant={merchant} />
    </div>
  );
}
