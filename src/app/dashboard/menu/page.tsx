import { requireMerchant } from "@/lib/merchant";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/i18n/server";
import type { MenuNode } from "@/lib/menu";
import { MenuStudio } from "./MenuStudio";

export default async function DashboardMenuPage() {
  const merchant = await requireMerchant();
  const t = await getTranslations();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_nodes")
    .select("*")
    .eq("merchant_id", merchant.id)
    .order("position", { ascending: true });

  // Migration 023 not applied yet → table missing; still open the studio empty.
  if (error) {
    console.warn("menu_nodes load skipped:", error.message);
  }

  return (
    <div className="qr-design-studio-page menu-design-studio-page -mx-4 sm:-mx-6">
      <div className="mb-2 px-4 sm:px-6">
        <h1 className="text-lg font-bold tracking-tight">{t("dashboard.menuTitle")}</h1>
        <p className="text-sm text-zinc-600">{t("dashboard.menuSubtitle")}</p>
      </div>
      <MenuStudio
        merchant={merchant}
        initialNodes={error ? [] : ((data as MenuNode[]) ?? [])}
      />
    </div>
  );
}
