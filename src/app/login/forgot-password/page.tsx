import { Suspense } from "react";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { getTranslations } from "@/i18n/server";

export default async function ForgotPasswordPage() {
  const t = await getTranslations();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">{t("common.loading")}</div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
