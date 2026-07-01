import { SetupForm } from "./SetupForm";
import { getCurrentMerchant } from "@/lib/merchant";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ui } from "@/components/ui/styles";
import { getTranslations } from "@/i18n/server";

export default async function SetupPage() {
  const merchant = await getCurrentMerchant();
  if (merchant) redirect("/dashboard");
  const t = await getTranslations();

  return (
    <div className={ui.page}>
      <header className="border-b border-border px-5 py-4 sm:px-8">
        <Link href="/" className="text-sm font-semibold text-ink">
          {t("setup.back")}
        </Link>
      </header>
      <div className={ui.shellNarrow}>
        <h1 className={ui.h1}>{t("setup.title")}</h1>
        <p className={`mt-2 ${ui.muted}`}>{t("setup.subtitle")}</p>
        <div className="mt-8">
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
