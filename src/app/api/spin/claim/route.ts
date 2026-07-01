import { apiT, resolveRequestLocale } from "@/i18n/api";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePrizeCode } from "@/lib/prize-code";
import { sendSmsMessage } from "@/lib/sms";

export async function POST(request: Request) {
  const locale = resolveRequestLocale(request);
  const t = apiT(locale);

  try {
    const body = await request.json();
    const { spinId, firstName, email, phoneNumber } = body;

    if (!spinId || !firstName?.trim() || !phoneNumber?.trim()) {
      return NextResponse.json({ error: t("api.missingFields") }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: spin, error: spinError } = await supabase
      .from("spins")
      .select("*, prize:prizes(label)")
      .eq("id", spinId)
      .maybeSingle();

    if (spinError || !spin) {
      return NextResponse.json({ error: t("api.spinNotFound") }, { status: 404 });
    }

    if (spin.phone_number !== phoneNumber) {
      return NextResponse.json({ error: t("api.phoneMismatch") }, { status: 403 });
    }

    if (spin.prize_code) {
      return NextResponse.json({
        prizeCode: spin.prize_code,
        smsSent: Boolean(spin.claim_notified_at),
        alreadyClaimed: true,
      });
    }

    const { data: merchant } = await supabase
      .from("merchants")
      .select("name")
      .eq("id", spin.merchant_id)
      .maybeSingle();

    const prizeLabel = Array.isArray(spin.prize)
      ? spin.prize[0]?.label
      : (spin.prize as { label: string } | null)?.label;

    const prizeCode = generatePrizeCode();
    const smsBody = t("api.prizeSmsBody", {
      prize: prizeLabel ?? "Prize",
      code: prizeCode,
      merchant: merchant?.name ?? "STARSPIN",
    });

    const smsSent = await sendSmsMessage(phoneNumber, smsBody);

    const { error: updateError } = await supabase
      .from("spins")
      .update({
        claim_first_name: firstName.trim(),
        claim_email: email?.trim() || null,
        prize_code: prizeCode,
        claim_notified_at: new Date().toISOString(),
      })
      .eq("id", spinId);

    if (updateError) throw updateError;

    return NextResponse.json({
      prizeCode,
      smsSent,
      alreadyClaimed: false,
    });
  } catch (err) {
    console.error("Claim error:", err);
    return NextResponse.json({ error: t("api.claimError") }, { status: 500 });
  }
}
