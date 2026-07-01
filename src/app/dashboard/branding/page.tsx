import { requireMerchant } from "@/lib/merchant";
import { BrandingForm } from "./BrandingForm";
import { ui } from "@/components/ui/styles";
import { getTranslations } from "@/i18n/server";

export default async function BrandingPage() {
  const merchant = await requireMerchant();
  const t = await getTranslations();
  return (
    <div className="space-y-8">
      <div>
        <h1 className={ui.h1}>{t("dashboard.brandingTitle")}</h1>
        <p className={ui.muted}>{t("dashboard.brandingSubtitle")}</p>
      </div>
      <BrandingForm merchant={merchant} />
    </div>
  );
}
