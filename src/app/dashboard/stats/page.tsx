import { requireMerchant } from "@/lib/merchant";
import { createClient } from "@/lib/supabase/server";
import { ui } from "@/components/ui/styles";
import { getLocale, getTranslations } from "@/i18n/server";
import { localeToIntl } from "@/i18n/config";

export default async function StatsPage() {
  const merchant = await requireMerchant();
  const t = await getTranslations();
  const locale = await getLocale();
  const intl = localeToIntl(locale);
  const supabase = await createClient();

  const [
    { count: spinCount },
    { count: followCount },
    { data: reviewHistory },
    { data: recentSpins },
  ] = await Promise.all([
    supabase
      .from("spins")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", merchant.id),
    supabase
      .from("spins")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", merchant.id)
      .eq("followed_social", true),
    supabase
      .from("review_counts_history")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("checked_at", { ascending: false })
      .limit(30),
    supabase
      .from("spins")
      .select("created_at, prize:prizes(label)")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className={ui.h1}>{t("dashboard.statsTitle")}</h1>
        <p className={ui.muted}>{t("dashboard.statsSubtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={ui.stat}>
          <p className={ui.statLabel}>{t("dashboard.totalSpins")}</p>
          <p className={ui.statValue}>{spinCount ?? 0}</p>
        </div>
        <div className={ui.stat}>
          <p className={ui.statLabel}>{t("dashboard.socialFollows")}</p>
          <p className={ui.statValue}>{followCount ?? 0}</p>
        </div>
        <div className={ui.stat}>
          <p className={ui.statLabel}>{t("dashboard.googleReviews")}</p>
          <p className={ui.statValue}>{reviewHistory?.[0]?.count ?? "-"}</p>
        </div>
      </div>

      {reviewHistory && reviewHistory.length > 0 && (
        <div className={ui.card}>
          <h2 className={ui.h2}>{t("dashboard.reviewHistory")}</h2>
          <div className="mt-4 overflow-hidden rounded-[14px] border-2 border-black">
            {reviewHistory.map((row) => (
              <div key={row.id} className="flex justify-between border-b-2 border-black/10 bg-white px-4 py-2.5 font-mono text-xs last:border-b-0">
                <span className="text-muted">
                  {new Date(row.checked_at).toLocaleDateString(intl)}
                </span>
                <span className="text-ink">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={ui.card}>
        <h2 className={ui.h2}>{t("dashboard.recentSpins")}</h2>
        <div className="mt-4 overflow-hidden rounded-[14px] border-2 border-black">
          {(recentSpins ?? []).map((spin, i) => (
            <div key={i} className="flex justify-between border-b-2 border-black/10 bg-white px-4 py-2.5 text-sm last:border-b-0">
              <span className="font-mono text-xs text-muted">
                {new Date(spin.created_at).toLocaleString(intl)}
              </span>
              <span className="text-ink">
                {(() => {
                  const prize = spin.prize;
                  if (Array.isArray(prize)) return prize[0]?.label ?? "-";
                  return (prize as { label: string } | null)?.label ?? "-";
                })()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
