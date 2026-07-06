import { requireMerchant } from "@/lib/merchant";
import { QRCodeManager } from "./QRCodeManager";
import { ui } from "@/components/ui/styles";
import { getTranslations } from "@/i18n/server";

export default async function QRPage() {
  const merchant = await requireMerchant();
  const t = await getTranslations();

  return (
    <div className="space-y-8">
      <div>
        <h1 className={ui.h1}>{t("dashboard.qrTitle")}</h1>
        <p className={ui.muted}>{t("dashboard.qrSubtitle")}</p>
      </div>
      <QRCodeManager merchant={merchant} />
    </div>
  );
}
