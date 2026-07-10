import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/i18n/server";
import { ui } from "@/components/ui/styles";
import { AccountPasswordForm } from "./AccountPasswordForm";

export default async function DashboardAccountPage() {
  const t = await getTranslations();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect("/login");

  const hasEmailPassword = Boolean(
    user.identities?.some((identity) => identity.provider === "email"),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className={ui.h1}>{t("auth.accountTitle")}</h1>
        <p className={ui.muted}>{t("auth.accountSubtitle")}</p>
      </div>

      <AccountPasswordForm email={user.email} hasEmailPassword={hasEmailPassword} />
    </div>
  );
}
