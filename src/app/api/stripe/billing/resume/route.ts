import { NextResponse } from "next/server";
import { resumeSubscription } from "@/lib/billing-summary";
import { accountBillingAccount, getMerchantAccount } from "@/lib/merchant-account";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await getMerchantAccount();
    const billing = account ? accountBillingAccount(account) : null;

    if (!billing) {
      return NextResponse.json({ error: "No billing account" }, { status: 400 });
    }

    const stripe = getStripe();
    await resumeSubscription(stripe, billing);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[stripe/billing/resume]", err);
    return NextResponse.json({ error: "Resume failed" }, { status: 500 });
  }
}
