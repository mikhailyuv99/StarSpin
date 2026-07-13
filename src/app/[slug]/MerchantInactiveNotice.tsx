import Link from "next/link";
import { StarspinLogo } from "@/components/StarspinLogo";
import { getTranslations } from "@/i18n/server";

export async function MerchantInactiveNotice({
  businessName,
}: {
  businessName?: string | null;
}) {
  const t = await getTranslations();
  const name = businessName?.trim();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#ececec] px-4 py-12 text-[#0a0a0a]">
      <div className="w-full max-w-md space-y-6 rounded-[20px] border-[2.5px] border-black bg-white p-6 text-center">
        <div className="flex justify-center">
          <StarspinLogo href="/" variant="light" size="lg" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-extrabold uppercase tracking-tight">{t("inactive.title")}</h1>
          <p className="text-sm font-medium text-zinc-600">
            {name ? t("inactive.bodyNamed", { name }) : t("inactive.body")}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="flex-1 rounded-[14px] border-[2.5px] border-black bg-white px-4 py-3 text-sm font-extrabold"
          >
            {t("inactive.home")}
          </Link>
          <Link
            href="/#pricing"
            className="flex-1 rounded-[14px] border-[2.5px] border-black bg-[#f5e08e] px-4 py-3 text-sm font-extrabold"
          >
            {t("inactive.plans")}
          </Link>
        </div>
      </div>
    </main>
  );
}
