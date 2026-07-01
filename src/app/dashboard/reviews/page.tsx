import { requireMerchant } from "@/lib/merchant";
import { createClient } from "@/lib/supabase/server";
import { ReviewsManager } from "./ReviewsManager";
import type { Spin } from "@/lib/types";

export default async function ReviewsPage() {
  const merchant = await requireMerchant();
  const supabase = await createClient();
  const { data: spins } = await supabase
    .from("spins")
    .select("*, prize:prizes(label)")
    .eq("merchant_id", merchant.id)
    .not("review_screenshot_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold">Captures d&apos;avis</h2>
      <ReviewsManager spins={(spins ?? []) as Spin[]} />
    </div>
  );
}
