import { requireMerchant } from "@/lib/merchant";
import { createClient } from "@/lib/supabase/server";
import { ui } from "@/components/ui/styles";
import { getLocale, getTranslations } from "@/i18n/server";
import { localeToIntl } from "@/i18n/config";
import { aggregateCrmContacts, computeCrmFunnel } from "@/lib/crm";
import type { Spin } from "@/lib/types";
import { CrmExportButton } from "@/app/dashboard/crm/CrmExportButton";
import { reviewScreenshotHref } from "@/lib/review-screenshot";
import Link from "next/link";

export default async function CrmPage() {
  const merchant = await requireMerchant();
  const t = await getTranslations();
  const locale = await getLocale();
  const intl = localeToIntl(locale);
  const supabase = await createClient();

  const [{ data: spinsRaw }, { data: reviewHistory }] = await Promise.all([
    supabase
      .from("spins")
      .select(
        "id, created_at, claim_email, claim_first_name, phone_number, prize_code, followed_social, review_screenshot_url, review_screenshot_status, completed_flow_steps, prize:prizes(label)",
      )
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("review_counts_history")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("checked_at", { ascending: false })
      .limit(30),
  ]);

  const spins = (spinsRaw ?? []).map((spin) => {
    const prize = spin.prize;
    const label = Array.isArray(prize) ? prize[0]?.label : (prize as { label: string } | null)?.label;
    return { ...spin, prize: label ? { label } : undefined };
  }) as Spin[];

  const funnel = computeCrmFunnel(spins);
  const contacts = aggregateCrmContacts(spins);
  const recent = spins.slice(0, 20);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={ui.h1}>{t("dashboard.crmTitle")}</h1>
          <p className={ui.muted}>{t("dashboard.crmSubtitle")}</p>
        </div>
        <CrmExportButton contacts={contacts} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className={ui.stat}>
          <p className={ui.statLabel}>{t("dashboard.totalSpins")}</p>
          <p className={ui.statValue}>{funnel.totalSpins}</p>
        </div>
        <div className={ui.stat}>
          <p className={ui.statLabel}>{t("dashboard.crmFunnelReview")}</p>
          <p className={ui.statValue}>{funnel.withReview}</p>
        </div>
        <div className={ui.stat}>
          <p className={ui.statLabel}>{t("dashboard.crmFunnelSocial")}</p>
          <p className={ui.statValue}>{funnel.withSocial}</p>
        </div>
        <div className={ui.stat}>
          <p className={ui.statLabel}>{t("dashboard.crmFunnelEmail")}</p>
          <p className={ui.statValue}>{funnel.withEmail}</p>
        </div>
        <div className={ui.stat}>
          <p className={ui.statLabel}>{t("dashboard.crmFunnelClaimed")}</p>
          <p className={ui.statValue}>{funnel.withClaim}</p>
        </div>
      </div>

      <div className={ui.card}>
        <h2 className={ui.h2}>{t("dashboard.crmContactsTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("dashboard.crmContactsHint")}</p>
        <div className="mt-4 overflow-x-auto rounded-[14px] border-2 border-black">
          <table className={ui.table}>
            <thead>
              <tr>
                <th className={ui.th}>{t("common.email")}</th>
                <th className={ui.th}>{t("public.claimFirstName")}</th>
                <th className={ui.th}>{t("public.claimPhoneOptional")}</th>
                <th className={ui.th}>{t("dashboard.crmSpins")}</th>
                <th className={ui.th}>{t("dashboard.crmLastVisit")}</th>
                <th className={ui.th}>{t("dashboard.crmPrizes")}</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={6} className={`${ui.td} text-center text-muted`}>
                    {t("dashboard.crmNoContacts")}
                  </td>
                </tr>
              )}
              {contacts.map((contact) => (
                <tr key={contact.email}>
                  <td className={ui.td}>{contact.email}</td>
                  <td className={ui.td}>{contact.firstName ?? "-"}</td>
                  <td className={ui.td}>{contact.phone ?? "-"}</td>
                  <td className={ui.td}>{contact.spinCount}</td>
                  <td className={`${ui.td} font-mono text-xs`}>
                    {new Date(contact.lastSpinAt).toLocaleString(intl)}
                  </td>
                  <td className={ui.td}>{contact.prizes.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {reviewHistory && reviewHistory.length > 0 && (
        <div className={ui.card}>
          <h2 className={ui.h2}>{t("dashboard.reviewHistory")}</h2>
          <div className="mt-4 overflow-hidden rounded-[14px] border-2 border-black">
            {reviewHistory.map((row) => (
              <div
                key={row.id}
                className="flex justify-between border-b-2 border-black/10 bg-white px-4 py-2.5 font-mono text-xs last:border-b-0"
              >
                <span className="text-muted">{new Date(row.checked_at).toLocaleDateString(intl)}</span>
                <span className="text-ink">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={ui.card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={ui.h2}>{t("dashboard.recentSpins")}</h2>
          <Link href="/dashboard/reviews" className={ui.link}>
            {t("dashboard.reviewsTitle")} →
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-[14px] border-2 border-black">
          {recent.map((spin) => (
            <div
              key={spin.id}
              className="grid grid-cols-1 items-center gap-2 border-b-2 border-black/10 bg-white px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]"
            >
              <span className="font-mono text-xs text-muted">
                {new Date(spin.created_at).toLocaleString(intl)}
              </span>
              <span className="truncate font-extrabold text-ink">
                {spin.prize?.label ?? "-"}
              </span>
              <span className="truncate text-xs text-muted">
                {spin.claim_email ?? t("dashboard.crmAnonymous")}
                {spin.prize_code ? ` · ${spin.prize_code}` : ""}
              </span>
              {spin.review_screenshot_url ? (
                <a
                  href={reviewScreenshotHref(spin.review_screenshot_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs font-bold ${ui.link}`}
                >
                  {t("dashboard.viewScreenshot")}
                </a>
              ) : (
                <span className="text-xs text-muted">—</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
