import { SetupForm } from "./SetupForm";
import { getCurrentMerchant } from "@/lib/merchant";
import { redirect } from "next/navigation";
import { ui } from "@/components/ui/styles";
import { StarspinLogo } from "@/components/StarspinLogo";
import { getTranslations } from "@/i18n/server";

export default async function SetupPage() {
  const merchant = await getCurrentMerchant();
  if (merchant) redirect("/dashboard");
  const t = await getTranslations();

  return (
    <div className={ui.page}>
      <header className="border-b-[2.5px] border-black px-5 py-4 sm:px-8">
        <StarspinLogo href="/" variant="dark" size="sm" />
      </header>
      <div className={ui.shellNarrow}>
        <h1 className={ui.h1}>{t("setup.title")}</h1>
        <p className={`mt-2 ${ui.muted}`}>{t("setup.onboardingIntro")}</p>
        <div className="mt-8">
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
