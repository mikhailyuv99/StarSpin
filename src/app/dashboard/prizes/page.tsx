import { requireMerchant } from "@/lib/merchant";
import { createClient } from "@/lib/supabase/server";
import { PrizesManager } from "./PrizesManager";
import type { Prize } from "@/lib/types";
import { ui } from "@/components/ui/styles";

export default async function PrizesPage() {
  const merchant = await requireMerchant();
  const supabase = await createClient();
  const { data: prizes } = await supabase
    .from("prizes")
    .select("*")
    .eq("merchant_id", merchant.id)
    .order("created_at");

  return (
    <div className="space-y-8">
      <div>
        <h1 className={ui.h1}>Prix de la roue</h1>
        <p className={ui.muted}>Probabilités, stocks et libellés des récompenses.</p>
      </div>
      <PrizesManager merchantId={merchant.id} initialPrizes={(prizes ?? []) as Prize[]} />
    </div>
  );
}
