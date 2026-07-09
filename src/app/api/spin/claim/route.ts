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
import {
  getMerchantOwnerEmail,
  sendMerchantJourneyCompleteEmail,
  signedReviewScreenshotForEmail,
} from "@/lib/merchant-journey-email";

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

type ClaimFields = Record<string, string | boolean | number | null>;

async function readPrizeCode(
  supabase: ReturnType<typeof createAdminClient>,
  spinId: string,
): Promise<string | null> {
  const { data } = await supabase.from("spins").select("prize_code").eq("id", spinId).maybeSingle();
  return data?.prize_code ?? null;
}

async function tryClaimUpdate(
  supabase: ReturnType<typeof createAdminClient>,
  spinId: string,
  fields: ClaimFields,
  prizeCode: string,
): Promise<{ ok: true; prizeCode: string } | { ok: false; retry: boolean; message?: string }> {
  const { data, error } = await supabase
    .from("spins")
    .update({ ...fields, prize_code: prizeCode })
    .eq("id", spinId)
    .is("prize_code", null)
    .select("prize_code")
    .maybeSingle();

  if (data?.prize_code) {
    return { ok: true, prizeCode: data.prize_code };
  }

  const existing = await readPrizeCode(supabase, spinId);
  if (existing) {
    return { ok: true, prizeCode: existing };
  }

  if (!error) {
    return { ok: false, retry: true };
  }

  if (error.code === "23505") {
    return { ok: false, retry: true };
  }

  // PostgREST returns this when the update matched zero rows.
  if (error.code === "PGRST116") {
    const raced = await readPrizeCode(supabase, spinId);
    if (raced) return { ok: true, prizeCode: raced };
    return { ok: false, retry: true };
  }

  return { ok: false, retry: false, message: error.message };
}

async function persistClaim(
  supabase: ReturnType<typeof createAdminClient>,
  spinId: string,
  fullPayload: ClaimFields,
  minimalPayload: ClaimFields,
): Promise<{ prizeCode: string } | { error: string }> {
  const payloads = [fullPayload, minimalPayload];

  for (const payload of payloads) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const prizeCode = generatePrizeCode();
      const result = await tryClaimUpdate(supabase, spinId, payload, prizeCode);
      if (result.ok) {
        return { prizeCode: result.prizeCode };
      }
      if (!result.retry) {
        console.error("Claim DB update error:", result.message);
        break;
      }
    }
  }

  const existing = await readPrizeCode(supabase, spinId);
  if (existing) {
    return { prizeCode: existing };
  }

  return { error: "persist_failed" };
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

    const displayPrize = Array.isArray(spin.prize) ? spin.prize[0] : spin.prize;
    let prize = displayPrize;
    const resolvedId = (spin as { resolved_prize_id?: string | null }).resolved_prize_id;
    if (resolvedId) {
      const { data: resolved } = await supabase.from("prizes").select("*").eq("id", resolvedId).maybeSingle();
      if (resolved) prize = resolved;
    }
    const prizeLabel = prize?.label ?? "Prize";
    const redemptionRules = prize ? snapshotFromPrize(prize) : snapshotFromSpin(spin);

    if (spin.prize_code) {
      return NextResponse.json({
        prizeCode: spin.prize_code,
        emailSent: Boolean(spin.claim_notified_at),
        alreadyClaimed: true,
        redemptionRules: snapshotFromSpin(spin),
      });
    }

    const { data: merchant } = await supabase
      .from("merchants")
      .select("name, owner_id")
      .eq("id", spin.merchant_id)
      .maybeSingle();

    const ruleLines = formatRedemptionRuleLines(redemptionRules, t, locale);
    const merchantName = merchant?.name ?? "STARSPIN";

    const minimalPayload: ClaimFields = {
      claim_first_name: firstName.trim(),
      claim_email: emailAddress,
    };

    const fullPayload: ClaimFields = {
      ...minimalPayload,
      redeem_next_visit: redemptionRules.redeem_next_visit,
      redeem_min_spend_cents: redemptionRules.redeem_min_spend_cents,
      redeem_expires_at: redemptionRules.redeem_expires_at,
    };

    if (phoneNumber?.trim()) {
      const normalized = normalizePhone(String(phoneNumber));
      minimalPayload.phone_number = normalized;
      fullPayload.phone_number = normalized;
    }

    const persisted = await persistClaim(supabase, spinId, fullPayload, minimalPayload);
    if ("error" in persisted) {
      console.error("Claim persist failed for spin", spinId);
      return NextResponse.json({ error: t("api.claimError") }, { status: 500 });
    }

    const { prizeCode } = persisted;

    let emailSent = false;
    try {
      emailSent = await sendPrizeEmail({
        to: emailAddress,
        firstName: firstName.trim(),
        prizeLabel,
        prizeCode,
        merchantName,
        locale,
        ruleLines,
      });
    } catch (emailErr) {
      console.error("Prize email error:", emailErr);
    }

    let smsSent = false;
    if (phoneNumber?.trim()) {
      try {
        const normalized = normalizePhone(String(phoneNumber));
        const smsBody = t("api.prizeSmsBody", {
          prize: prizeLabel,
          code: prizeCode,
          merchant: merchantName,
        });
        smsSent = await sendSmsMessage(normalized, smsBody);
      } catch (smsErr) {
        console.error("Prize SMS error:", smsErr);
      }
    }

    if (emailSent || smsSent) {
      await supabase
        .from("spins")
        .update({ claim_notified_at: new Date().toISOString() })
        .eq("id", spinId);
    }

    if (merchant?.owner_id) {
      try {
        const ownerEmail = await getMerchantOwnerEmail(supabase, merchant.owner_id);
        if (ownerEmail) {
          const screenshotSignedUrl = await signedReviewScreenshotForEmail(
            spin.review_screenshot_url,
          );
          await sendMerchantJourneyCompleteEmail({
            merchantEmail: ownerEmail,
            merchantName: merchant.name ?? "STARSPIN",
            customerFirstName: firstName.trim(),
            customerEmail: emailAddress,
            customerPhone: phoneNumber?.trim()
              ? normalizePhone(String(phoneNumber))
              : spin.phone_number,
            prizeLabel,
            prizeCode,
            reviewScreenshotSignedUrl: screenshotSignedUrl,
          });
        }
      } catch (notifyErr) {
        console.error("Merchant journey notification error:", notifyErr);
      }
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
