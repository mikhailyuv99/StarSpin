import { NextResponse } from "next/server";
import { isMerchantLive } from "@/lib/merchant-access";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("subscription_status")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!merchant) {
    return NextResponse.json({ live: false, status: null });
  }

  return NextResponse.json({
    live: isMerchantLive(merchant.subscription_status),
    status: merchant.subscription_status,
  });
}
