"use client";

import { createClient } from "@/lib/supabase/client";
import type { Merchant, SubscriptionStatus } from "@/lib/types";
import { useRouter } from "next/navigation";

const STATUSES: SubscriptionStatus[] = ["active", "trial", "past_due", "cancelled"];

export function AdminMerchantsTable({ merchants }: { merchants: Merchant[] }) {
  const router = useRouter();

  const updateStatus = async (id: string, status: SubscriptionStatus) => {
    const supabase = createClient();
    await supabase.from("merchants").update({ subscription_status: status }).eq("id", id);
    router.refresh();
  };

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-gray-50">
          <tr>
            <th className="px-4 py-3">Commerce</th>
            <th className="px-4 py-3">Slug</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Créé le</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {merchants.map((m) => (
            <tr key={m.id} className="border-b">
              <td className="px-4 py-3 font-medium">{m.name}</td>
              <td className="px-4 py-3">
                <a href={`/r/${m.slug}`} className="text-orange-600 underline" target="_blank">
                  {m.slug}
                </a>
              </td>
              <td className="px-4 py-3">{m.subscription_status}</td>
              <td className="px-4 py-3">
                {new Date(m.created_at).toLocaleDateString("fr-FR")}
              </td>
              <td className="px-4 py-3">
                <select
                  value={m.subscription_status}
                  onChange={(e) => updateStatus(m.id, e.target.value as SubscriptionStatus)}
                  className="rounded border px-2 py-1"
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
