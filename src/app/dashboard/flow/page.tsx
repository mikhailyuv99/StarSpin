import { requireMerchant } from "@/lib/merchant";
import { FlowStepsForm } from "@/app/dashboard/flow/FlowStepsForm";
import { ui } from "@/components/ui/styles";
import { getTranslations } from "@/i18n/server";
import Link from "next/link";

export default async function FlowPage() {
  const merchant = await requireMerchant();
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className={ui.h1}>{t("dashboard.flowTitle")}</h1>
        <p className={ui.muted}>{t("dashboard.flowSubtitle")}</p>
        <p className="mt-2 text-sm text-muted">
          {t("dashboard.flowBrandingHint")}{" "}
          <Link href="/dashboard/branding" className={ui.link}>
            {t("dashboard.navBranding")}
          </Link>
        </p>
      </div>
      <FlowStepsForm merchant={merchant} />
    </div>
  );
}
