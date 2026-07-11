import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { RESERVED_SLUGS } from "@/lib/app-url";
import { isMerchantLive } from "@/lib/merchant-access";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "@/i18n/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { MenuPublicView } from "@/components/menu/MenuPublicView";
import type { Merchant } from "@/lib/types";
import type { MenuNode } from "@/lib/menu";
import { parseMenuBackground, parseMenuInfo, parseMenuStyle } from "@/lib/menu";

export const dynamic = "force-dynamic";

export default async function PublicMerchantMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  noStore();
  const t = await getTranslations();
  const locale = await getLocale();
  const { slug: rawSlug } = await params;
  const slug = rawSlug.trim().toLowerCase();
  if (RESERVED_SLUGS.has(slug)) notFound();

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    notFound();
  }

  const { data: merchantRow, error } = await supabase
    .from("merchants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !merchantRow) notFound();
  if (!isMerchantLive(merchantRow.subscription_status)) {
    notFound();
  }

  const merchant = merchantRow as Merchant;
  if (!merchant.menu_enabled) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-center text-sm text-zinc-600">
        {t("public.menuDisabled")}
      </div>
    );
  }

  const { data: nodes } = await supabase
    .from("menu_nodes")
    .select("*")
    .eq("merchant_id", merchant.id)
    .eq("visible", true)
    .order("position", { ascending: true });

  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex max-w-[430px] justify-end px-4 pt-3">
        <LocaleSwitcher variant="journey" />
      </div>
      <MenuPublicView
        merchantName={merchant.name}
        logoUrl={merchant.logo_url}
        primaryColor={merchant.primary_color}
        nodes={(nodes as MenuNode[]) ?? []}
        style={parseMenuStyle(merchant.menu_style, merchant.primary_color)}
        background={parseMenuBackground(merchant.menu_background)}
        info={parseMenuInfo(merchant.menu_info)}
        locale={locale}
      />
    </div>
  );
}
