import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OTP_EXPIRY_MINUTES, OTP_LENGTH, SPIN_COOLDOWN_DAYS } from "@/lib/constants";
import { createDeviceFingerprint, getClientIp } from "@/lib/fingerprint";
import { findRecentSpinBlocker } from "@/lib/spin-limits";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString().slice(0, OTP_LENGTH);
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("0")) return `+84${cleaned.slice(1)}`;
  return `+84${cleaned}`;
}

function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER,
  );
}

async function sendSms(phone: string, code: string): Promise<boolean> {
  if (!isSmsConfigured()) {
    console.log(`[OTP sans SMS] ${phone}: ${code}`);
    return false;
  }

  const twilio = await import("twilio");
  const client = twilio.default(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!,
  );
  await client.messages.create({
    body: `Votre code Roue Fidélité: ${code}. Valide ${OTP_EXPIRY_MINUTES} min.`,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phone,
  });
  return true;
}

export async function POST(request: Request) {
  try {
    const { merchantId, phone } = await request.json();
    if (!merchantId || !phone) {
      return NextResponse.json({ error: "merchantId et phone requis" }, { status: 400 });
    }

    const phoneNumber = normalizePhone(String(phone));
    const supabase = createAdminClient();

    const { data: merchant } = await supabase
      .from("merchants")
      .select("id, subscription_status")
      .eq("id", merchantId)
      .single();

    if (!merchant || !["active", "trial"].includes(merchant.subscription_status)) {
      return NextResponse.json({ error: "Commerce indisponible" }, { status: 404 });
    }

    const fingerprint = createDeviceFingerprint(
      getClientIp(request),
      request.headers.get("user-agent") ?? "",
    );

    const blocker = await findRecentSpinBlocker(supabase, merchantId, phoneNumber, fingerprint);
    if (blocker === "phone") {
      return NextResponse.json(
        { error: `Ce numéro a déjà participé (${SPIN_COOLDOWN_DAYS} jours)` },
        { status: 429 },
      );
    }
    if (blocker === "device") {
      return NextResponse.json(
        { error: `Cet appareil a déjà participé (${SPIN_COOLDOWN_DAYS} jours)` },
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
      return NextResponse.json({ error: "Erreur enregistrement OTP" }, { status: 500 });
    }

    const smsSent = await sendSms(phoneNumber, code);

    return NextResponse.json({
      ok: true,
      smsSent,
      devCode: smsSent ? undefined : code,
    });
  } catch (err) {
    console.error("OTP send error:", err);
    return NextResponse.json({ error: "Erreur envoi OTP" }, { status: 500 });
  }
}
