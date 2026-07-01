import { requireMerchant } from "@/lib/merchant";
import { createClient } from "@/lib/supabase/server";
import { PrizesManager } from "./PrizesManager";
import type { Prize } from "@/lib/types";

export default async function PrizesPage() {
  const merchant = await requireMerchant();
  const supabase = await createClient();
  const { data: prizes } = await supabase
    .from("prizes")
    .select("*")
    .eq("merchant_id", merchant.id)
    .order("created_at");

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold">Prix de la roue</h2>
      <PrizesManager merchantId={merchant.id} initialPrizes={(prizes ?? []) as Prize[]} />
    </div>
  );
}
