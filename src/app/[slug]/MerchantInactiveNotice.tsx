import Link from "next/link";
import { StarspinLogo } from "@/components/StarspinLogo";
import { ui } from "@/components/ui/styles";
import { getTranslations } from "@/i18n/server";

export async function MerchantInactiveNotice({
  businessName,
}: {
  businessName?: string | null;
}) {
  const t = await getTranslations();
  const name = businessName?.trim();

  return (
    <main className={`${ui.page} flex min-h-screen flex-col items-center justify-center px-4 py-12`}>
      <div className={`${ui.card} w-full max-w-md space-y-6 text-center`}>
        <div className="flex justify-center">
          <StarspinLogo href="/" variant="light" size="lg" />
        </div>

        <div className="space-y-3">
          <h1 className={ui.h1}>{t("inactive.title")}</h1>
          <p className={ui.muted}>
            {name ? t("inactive.bodyNamed", { name }) : t("inactive.body")}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/" className={`flex-1 ${ui.btnOutline}`}>
            {t("inactive.home")}
          </Link>
          <Link href="/#pricing" className={`flex-1 ${ui.btnYellow}`}>
            {t("inactive.plans")}
          </Link>
        </div>
      </div>
    </main>
  );
}
