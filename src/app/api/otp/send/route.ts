import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OTP_EXPIRY_MINUTES, OTP_LENGTH } from "@/lib/constants";
import { createDeviceFingerprint, getClientIp } from "@/lib/fingerprint";
import { findRecentSpinBlocker } from "@/lib/spin-limits";
import { sendSmsMessage } from "@/lib/sms";
import { apiT, resolveRequestLocale } from "@/i18n/api";
import { isMerchantLive } from "@/lib/merchant-access";
import { normalizePhone } from "@/lib/phone";
import { clientIpKey, rateLimit } from "@/lib/rate-limit";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString().slice(0, OTP_LENGTH);
}

export async function POST(request: Request) {
  const locale = resolveRequestLocale(request);
  const t = apiT(locale);

  const limited = rateLimit(clientIpKey(request, "otp-send"), 8, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: t("api.rateLimited") },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  try {
    const { merchantId, phone } = await request.json();
    if (!merchantId || !phone) {
      return NextResponse.json({ error: t("api.merchantPhoneRequired") }, { status: 400 });
    }

    const phoneNumber = normalizePhone(String(phone));
    const supabase = createAdminClient();

    const { data: merchant } = await supabase
      .from("merchants")
      .select("id, subscription_status, spin_cooldown_days")
      .eq("id", merchantId)
      .single();

    if (!merchant || !isMerchantLive(merchant.subscription_status)) {
      return NextResponse.json({ error: t("api.merchantUnavailable") }, { status: 404 });
    }

    const cooldownDays = merchant.spin_cooldown_days ?? 0;

    const fingerprint = createDeviceFingerprint(
      getClientIp(request),
      request.headers.get("user-agent") ?? "",
    );

    const blocker = await findRecentSpinBlocker(supabase, merchantId, phoneNumber, fingerprint, cooldownDays);
    if (blocker === "phone") {
      return NextResponse.json(
        { error: t("api.phoneAlreadyPlayed", { days: cooldownDays }) },
        { status: 429 },
      );
    }
    if (blocker === "device") {
      return NextResponse.json(
        { error: t("api.deviceAlreadyPlayed", { days: cooldownDays }) },
        { status: 429 },
      );
    }

    const code = generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    const { error: insertError } = await supabase.from("otp_verifications").insert({
      merchant_id: merchantId,
      phone_number: phoneNumber,
      code,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("OTP insert error:", insertError);
      return NextResponse.json({ error: t("api.otpSaveError") }, { status: 500 });
    }

    const smsBody = t("api.smsBody", { code, minutes: OTP_EXPIRY_MINUTES });
    const smsSent = await sendSmsMessage(phoneNumber, smsBody);

    return NextResponse.json({
      ok: true,
      smsSent,
      devCode: smsSent ? undefined : code,
    });
  } catch (err) {
    console.error("OTP send error:", err);
    return NextResponse.json({ error: t("api.otpSendError") }, { status: 500 });
  }
}
