import { requireMerchant } from "@/lib/merchant";
import { QRDesignStudio } from "./QRDesignStudio";
import { ui } from "@/components/ui/styles";
import { getTranslations } from "@/i18n/server";

export default async function QRPage() {
  const merchant = await requireMerchant();
  const t = await getTranslations();

  return (
    <div className="qr-design-studio-page space-y-4 pb-0 lg:space-y-6">
      <div>
        <h1 className={ui.h1}>{t("dashboard.qrTitle")}</h1>
        <p className={ui.muted}>{t("dashboard.qrSubtitle")}</p>
      </div>
      <QRDesignStudio merchant={merchant} />
    </div>
  );
}
