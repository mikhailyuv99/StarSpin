import { apiT, resolveRequestLocale } from "@/i18n/api";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePrizeCode } from "@/lib/prize-code";
import { sendPrizeEmail } from "@/lib/email";
import { sendSmsMessage } from "@/lib/sms";
import {
  formatRedemptionRuleLines,
  snapshotFromPrize,
  type RedemptionRulesSnapshot,
} from "@/lib/redemption-rules";
import { normalizePhone } from "@/lib/phone";
import { clientIpKey, rateLimit } from "@/lib/rate-limit";

function snapshotFromSpin(spin: {
  redeem_next_visit?: boolean | null;
  redeem_min_spend_cents?: number | null;
  redeem_expires_at?: string | null;
}): RedemptionRulesSnapshot {
  return {
    redeem_next_visit: Boolean(spin.redeem_next_visit),
    redeem_min_spend_cents: spin.redeem_min_spend_cents ?? null,
    redeem_expires_at: spin.redeem_expires_at ?? null,
  };
}

export async function POST(request: Request) {
  const locale = resolveRequestLocale(request);
  const t = apiT(locale);

  const limited = rateLimit(clientIpKey(request, "claim"), 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: t("api.rateLimited") },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

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
      .select("*, prize:prizes(*)")
      .eq("id", spinId)
      .maybeSingle();

    if (spinError || !spin) {
      return NextResponse.json({ error: t("api.spinNotFound") }, { status: 404 });
    }

    const prize = Array.isArray(spin.prize) ? spin.prize[0] : spin.prize;
    const prizeLabel = prize?.label ?? "Prize";

    if (spin.prize_code) {
      const redemptionRules = snapshotFromSpin(spin);
      return NextResponse.json({
        prizeCode: spin.prize_code,
        emailSent: Boolean(spin.claim_notified_at),
        alreadyClaimed: true,
        redemptionRules,
      });
    }

    const { data: merchant } = await supabase
      .from("merchants")
      .select("name")
      .eq("id", spin.merchant_id)
      .maybeSingle();

    const redemptionRules = prize ? snapshotFromPrize(prize) : snapshotFromSpin({});
    const ruleLines = formatRedemptionRuleLines(redemptionRules, t, locale);
    const prizeCode = generatePrizeCode();
    const merchantName = merchant?.name ?? "STARSPIN";

    const emailSent = await sendPrizeEmail({
      to: emailAddress,
      firstName: firstName.trim(),
      prizeLabel,
      prizeCode,
      merchantName,
      locale,
      ruleLines,
    });

    let smsSent = false;
    if (phoneNumber?.trim()) {
      const normalized = normalizePhone(String(phoneNumber));
      const smsBody = t("api.prizeSmsBody", {
        prize: prizeLabel,
        code: prizeCode,
        merchant: merchantName,
      });
      smsSent = await sendSmsMessage(normalized, smsBody);
    }

    const updatePayload: Record<string, string | boolean | number | null> = {
      claim_first_name: firstName.trim(),
      claim_email: emailAddress,
      prize_code: prizeCode,
      claim_notified_at: new Date().toISOString(),
      redeem_next_visit: redemptionRules.redeem_next_visit,
      redeem_min_spend_cents: redemptionRules.redeem_min_spend_cents,
      redeem_expires_at: redemptionRules.redeem_expires_at,
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
      redemptionRules,
    });
  } catch (err) {
    console.error("Claim error:", err);
    return NextResponse.json({ error: t("api.claimError") }, { status: 500 });
  }
}
