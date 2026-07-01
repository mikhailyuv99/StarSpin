"use client";

import { createClient } from "@/lib/supabase/client";
import type { Merchant, SubscriptionStatus } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ui } from "@/components/ui/styles";

const STATUSES: SubscriptionStatus[] = ["active", "trial", "past_due", "cancelled"];

export function AdminMerchantsTable({ merchants }: { merchants: Merchant[] }) {
  const router = useRouter();

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
            <th className={ui.th}>Commerce</th>
            <th className={ui.th}>Slug</th>
            <th className={ui.th}>Statut</th>
            <th className={ui.th}>Créé</th>
            <th className={ui.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {merchants.map((m) => (
            <tr key={m.id}>
              <td className={ui.td}>{m.name}</td>
              <td className={ui.td}>
                <a href={`/r/${m.slug}`} className={ui.link} target="_blank" rel="noreferrer">
                  {m.slug}
                </a>
              </td>
              <td className={`${ui.td} font-mono text-xs uppercase`}>{m.subscription_status}</td>
              <td className={`${ui.td} font-mono text-xs text-muted`}>
                {new Date(m.created_at).toLocaleDateString("fr-FR")}
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
