import { Suspense } from "react";
import LoginPage from "./LoginForm";
import { getTranslations } from "@/i18n/server";

export default async function Page() {
  const t = await getTranslations();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">{t("common.loading")}</div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
