import { apiT, resolveRequestLocale } from "@/i18n/api";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePrizeCode } from "@/lib/prize-code";
import { sendPrizeEmail } from "@/lib/email";
import { sendSmsMessage } from "@/lib/sms";

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("0")) return `+84${cleaned.slice(1)}`;
  return `+84${cleaned}`;
}

export async function POST(request: Request) {
  const locale = resolveRequestLocale(request);
  const t = apiT(locale);

  try {
    const body = await request.json();
    const { spinId, firstName, email, phoneNumber } = body;

    if (!spinId || !firstName?.trim() || !email?.trim()) {
      return NextResponse.json({ error: t("api.missingFields") }, { status: 400 });
    }

    const emailAddress = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      return NextResponse.json({ error: t("api.invalidEmail") }, { status: 400 });
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

    if (spin.prize_code) {
      return NextResponse.json({
        prizeCode: spin.prize_code,
        emailSent: Boolean(spin.claim_notified_at),
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
    const merchantName = merchant?.name ?? "STARSPIN";

    const emailSent = await sendPrizeEmail({
      to: emailAddress,
      firstName: firstName.trim(),
      prizeLabel: prizeLabel ?? "Prize",
      prizeCode,
      merchantName,
      locale,
    });

    let smsSent = false;
    if (phoneNumber?.trim()) {
      const normalized = normalizePhone(String(phoneNumber));
      const smsBody = t("api.prizeSmsBody", {
        prize: prizeLabel ?? "Prize",
        code: prizeCode,
        merchant: merchantName,
      });
      smsSent = await sendSmsMessage(normalized, smsBody);
    }

    const updatePayload: Record<string, string | null> = {
      claim_first_name: firstName.trim(),
      claim_email: emailAddress,
      prize_code: prizeCode,
      claim_notified_at: new Date().toISOString(),
    };

    if (phoneNumber?.trim()) {
      updatePayload.phone_number = normalizePhone(String(phoneNumber));
    }

    const { error: updateError } = await supabase.from("spins").update(updatePayload).eq("id", spinId);

    if (updateError) {
      console.error("Claim DB update error:", updateError);
      return NextResponse.json({ error: t("api.claimError") }, { status: 500 });
    }

    return NextResponse.json({
      prizeCode,
      emailSent,
      smsSent,
      alreadyClaimed: false,
    });
  } catch (err) {
    console.error("Claim error:", err);
    return NextResponse.json({ error: t("api.claimError") }, { status: 500 });
  }
}
