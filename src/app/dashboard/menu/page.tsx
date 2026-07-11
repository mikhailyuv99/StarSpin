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
    <div className="menu-design-studio-page -mx-4 flex min-h-0 flex-1 flex-col overflow-hidden sm:-mx-6">
      <MenuStudio
        merchant={merchant}
        initialNodes={error ? [] : ((data as MenuNode[]) ?? [])}
        pageTitle={t("dashboard.menuTitle")}
      />
    </div>
  );
}
