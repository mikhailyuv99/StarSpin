import { NextResponse } from "next/server";
import { isAccountLive, getMerchantAccount } from "@/lib/merchant-account";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await getMerchantAccount();

  if (!account) {
    return NextResponse.json({ live: false, status: null });
  }

  return NextResponse.json({
    live: isAccountLive(account),
    status: account.subscription_status,
  });
}
