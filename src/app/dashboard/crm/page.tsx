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

const SPIN_SELECT_FULL =
  "id, created_at, claim_email, claim_first_name, phone_number, prize_code, followed_social, review_screenshot_url, review_screenshot_status, completed_flow_steps, client_locale, client_user_agent, client_ip, device_fingerprint, prize:prizes(label)";

const SPIN_SELECT_CORE =
  "id, created_at, claim_email, claim_first_name, phone_number, prize_code, followed_social, review_screenshot_url, review_screenshot_status, completed_flow_steps, device_fingerprint, prize:prizes(label)";

async function loadMerchantSpins(
  supabase: Awaited<ReturnType<typeof createClient>>,
  merchantId: string,
) {
  const full = await supabase
    .from("spins")
    .select(SPIN_SELECT_FULL)
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false })
    .limit(10000);

  if (!full.error) return full.data ?? [];

  // Migration 025 not applied yet — don't blank the whole CRM.
  console.warn("CRM spins full select failed, falling back:", full.error.message);
  const core = await supabase
    .from("spins")
    .select(SPIN_SELECT_CORE)
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false })
    .limit(10000);

  if (core.error) {
    console.error("CRM spins core select failed:", core.error.message);
    return [];
  }
  return core.data ?? [];
}

export default async function CrmPage() {
  const merchant = await requireMerchant();
  const t = await getTranslations();
  const locale = await getLocale();
  const intl = localeToIntl(locale);
  const supabase = await createClient();

  const [spinsRaw, { data: reviewHistory }] = await Promise.all([
    loadMerchantSpins(supabase, merchant.id),
    supabase
      .from("review_counts_history")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("checked_at", { ascending: false })
      .limit(30),
  ]);

  const spins = spinsRaw.map((spin) => {
    const prize = spin.prize;
    const label = Array.isArray(prize) ? prize[0]?.label : (prize as { label: string } | null)?.label;
    return { ...spin, prize: label ? { label } : undefined };
  }) as Spin[];

  const funnel = computeCrmFunnel(spins);
  const contacts = aggregateCrmContacts(spins);
  const activity = spins.slice(0, 200);

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={ui.h2}>{t("dashboard.crmActivityTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{t("dashboard.crmActivityHint")}</p>
          </div>
          <Link href="/dashboard/reviews" className={ui.link}>
            {t("dashboard.reviewsTitle")} →
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto rounded-[14px] border-2 border-black">
          <table className={ui.table}>
            <thead>
              <tr>
                <th className={ui.th}>{t("dashboard.crmColWhen")}</th>
                <th className={ui.th}>{t("dashboard.crmColPrize")}</th>
                <th className={ui.th}>{t("dashboard.crmColCustomer")}</th>
                <th className={ui.th}>{t("dashboard.crmColDevice")}</th>
                <th className={ui.th}>{t("dashboard.crmColProof")}</th>
                <th className={ui.th}>{t("dashboard.crmColStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {activity.length === 0 && (
                <tr>
                  <td colSpan={6} className={`${ui.td} text-center text-muted`}>
                    {t("dashboard.crmNoActivity")}
                  </td>
                </tr>
              )}
              {activity.map((spin) => {
                const name = spin.claim_first_name?.trim();
                const email = spin.claim_email?.trim();
                const phone = spin.phone_number?.trim();
                const customer =
                  [name, email, phone].filter(Boolean).join(" · ") || t("dashboard.crmAnonymous");
                const deviceBits = [
                  spin.client_locale,
                  spin.client_ip,
                  spin.device_fingerprint ? `${spin.device_fingerprint.slice(0, 8)}…` : null,
                ].filter(Boolean);
                const steps = Array.isArray(spin.completed_flow_steps)
                  ? spin.completed_flow_steps.join(", ")
                  : "";
                return (
                  <tr key={spin.id}>
                    <td className={`${ui.td} whitespace-nowrap font-mono text-xs`}>
                      {new Date(spin.created_at).toLocaleString(intl)}
                    </td>
                    <td className={ui.td}>
                      <div className="font-extrabold">{spin.prize?.label ?? "—"}</div>
                      {steps ? <div className="mt-0.5 text-[11px] text-muted">{steps}</div> : null}
                    </td>
                    <td className={ui.td}>
                      <div className="max-w-[16rem] truncate text-sm">{customer}</div>
                      {spin.prize_code ? (
                        <div className="mt-0.5 font-mono text-[11px] text-muted">{spin.prize_code}</div>
                      ) : null}
                    </td>
                    <td className={`${ui.td} max-w-[12rem] truncate text-[11px] text-muted`}>
                      {deviceBits.length ? deviceBits.join(" · ") : "—"}
                    </td>
                    <td className={ui.td}>
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
                    </td>
                    <td className={ui.td}>
                      <span className="text-xs font-bold">
                        {spin.prize_code
                          ? t("dashboard.crmStatusClaimed")
                          : t("dashboard.crmStatusOpen")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
    </div>
  );
}
