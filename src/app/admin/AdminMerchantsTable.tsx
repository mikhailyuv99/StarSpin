"use client";

import { createClient } from "@/lib/supabase/client";
import type { Merchant, SubscriptionStatus } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ui } from "@/components/ui/styles";
import { useI18n } from "@/i18n/client";
import { localeToIntl } from "@/i18n/config";

const STATUSES: SubscriptionStatus[] = ["active", "trial", "past_due", "cancelled"];

export function AdminMerchantsTable({ merchants }: { merchants: Merchant[] }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const intl = localeToIntl(locale);

  const updateStatus = async (id: string, status: SubscriptionStatus) => {
    const supabase = createClient();
    await supabase.from("merchants").update({ subscription_status: status }).eq("id", id);
    router.refresh();
  };

  return (
    <div className="overflow-x-auto border border-border">
      <table className={ui.table}>
        <thead>
          <tr>
            <th className={ui.th}>{t("admin.colBusiness")}</th>
            <th className={ui.th}>{t("admin.colSlug")}</th>
            <th className={ui.th}>{t("admin.colStatus")}</th>
            <th className={ui.th}>{t("admin.colCreated")}</th>
            <th className={ui.th}>{t("admin.colAction")}</th>
          </tr>
        </thead>
        <tbody>
          {merchants.map((m) => (
            <tr key={m.id}>
              <td className={ui.td}>{m.name}</td>
              <td className={ui.td}>
                <a href={`/${m.slug}`} className={ui.link} target="_blank" rel="noreferrer">
                  {m.slug}
                </a>
              </td>
              <td className={`${ui.td} font-mono text-xs uppercase`}>{m.subscription_status}</td>
              <td className={`${ui.td} font-mono text-xs text-muted`}>
                {new Date(m.created_at).toLocaleDateString(intl)}
              </td>
              <td className={ui.td}>
                <select
                  value={m.subscription_status}
                  onChange={(e) => updateStatus(m.id, e.target.value as SubscriptionStatus)}
                  className={ui.input}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
