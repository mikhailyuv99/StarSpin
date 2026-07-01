import type { SupabaseClient } from "@supabase/supabase-js";
import { SPIN_COOLDOWN_DAYS } from "@/lib/constants";

export async function findRecentSpinBlocker(
  supabase: SupabaseClient,
  merchantId: string,
  phoneNumber: string,
  deviceFingerprint: string,
): Promise<"phone" | "device" | null> {
  if (SPIN_COOLDOWN_DAYS <= 0) return null;

  const cooldownDate = new Date();
  cooldownDate.setDate(cooldownDate.getDate() - SPIN_COOLDOWN_DAYS);

  const { data: byPhone } = await supabase
    .from("spins")
    .select("id")
    .eq("merchant_id", merchantId)
    .eq("phone_number", phoneNumber)
    .gte("created_at", cooldownDate.toISOString())
    .limit(1)
    .maybeSingle();

  if (byPhone) return "phone";

  const { data: byDevice } = await supabase
    .from("spins")
    .select("id")
    .eq("merchant_id", merchantId)
    .eq("device_fingerprint", deviceFingerprint)
    .gte("created_at", cooldownDate.toISOString())
    .limit(1)
    .maybeSingle();

  if (byDevice) return "device";

  return null;
}
