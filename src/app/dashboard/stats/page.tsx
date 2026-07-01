import { requireMerchant } from "@/lib/merchant";
import { createClient } from "@/lib/supabase/server";

export default async function StatsPage() {
  const merchant = await requireMerchant();
  const supabase = await createClient();

  const { count: spinCount } = await supabase
    .from("spins")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", merchant.id);

  const { count: followCount } = await supabase
    .from("spins")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", merchant.id)
    .eq("followed_social", true);

  const { data: reviewHistory } = await supabase
    .from("review_counts_history")
    .select("*")
    .eq("merchant_id", merchant.id)
    .order("checked_at", { ascending: false })
    .limit(30);

  const { data: recentSpins } = await supabase
    .from("spins")
    .select("created_at, prize:prizes(label)")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Statistiques</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total spins</p>
          <p className="text-3xl font-bold">{spinCount ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Follows sociaux</p>
          <p className="text-3xl font-bold">{followCount ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Dernier count avis Google</p>
          <p className="text-3xl font-bold">{reviewHistory?.[0]?.count ?? "—"}</p>
        </div>
      </div>

      {reviewHistory && reviewHistory.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Historique avis Google (cron)</h3>
          <div className="space-y-2">
            {reviewHistory.map((row) => (
              <div key={row.id} className="flex justify-between text-sm">
                <span>{new Date(row.checked_at).toLocaleDateString("fr-FR")}</span>
                <span className="font-medium">{row.count} avis</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold">Derniers spins</h3>
        <div className="space-y-2">
          {(recentSpins ?? []).map((spin, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{new Date(spin.created_at).toLocaleString("fr-FR")}</span>
              <span>
                {(() => {
                  const prize = spin.prize;
                  if (Array.isArray(prize)) return prize[0]?.label ?? "—";
                  return (prize as { label: string } | null)?.label ?? "—";
                })()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
