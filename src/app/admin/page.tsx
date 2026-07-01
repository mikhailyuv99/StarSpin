import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminMerchantsTable } from "./AdminMerchantsTable";
import type { Merchant } from "@/lib/types";
import { ui } from "@/components/ui/styles";
import { StarspinLogo } from "@/components/StarspinLogo";
import { getTranslations } from "@/i18n/server";

export default async function AdminPage() {
  const t = await getTranslations();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) redirect("/dashboard");

  const { data: merchants } = await supabase
    .from("merchants")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className={ui.page}>
      <div className="brutal-nav-wrap">
        <header className="brutal-nav">
          <StarspinLogo href="/" variant="light" size="sm" />
          <h1 className="text-sm font-extrabold uppercase">{t("admin.title")}</h1>
          <Link href="/dashboard" className="brutal-btn brutal-btn-yellow text-sm">
            {t("common.dashboard")}
          </Link>
        </header>
      </div>
      <main className={`${ui.shell} space-y-8`}>
        <div>
          <h2 className={ui.h1}>{t("admin.merchantsTitle")}</h2>
          <p className={ui.muted}>{t("admin.merchantsSubtitle")}</p>
        </div>
        <AdminMerchantsTable merchants={(merchants ?? []) as Merchant[]} />
      </main>
    </div>
  );
}
