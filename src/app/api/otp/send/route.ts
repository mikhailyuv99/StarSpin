import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OTP_EXPIRY_MINUTES, OTP_LENGTH } from "@/lib/constants";
import { createDeviceFingerprint, getClientIp } from "@/lib/fingerprint";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString().slice(0, OTP_LENGTH);
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/^0/, "+84");
}

async function sendSms(phone: string, code: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV OTP] ${phone}: ${code}`);
      return;
    }
    throw new Error("SMS provider not configured");
  }

  const twilio = await import("twilio");
  const client = twilio.default(accountSid, authToken);
  await client.messages.create({
    body: `Votre code Roue Fidélité: ${code}. Valide ${OTP_EXPIRY_MINUTES} min.`,
    from,
    to: phone,
  });
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

    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - 30);

    const { data: recentSpin } = await supabase
      .from("spins")
      .select("id")
      .eq("merchant_id", merchantId)
      .eq("phone_number", phoneNumber)
      .gte("created_at", cooldownDate.toISOString())
      .limit(1)
      .maybeSingle();

    if (recentSpin) {
      return NextResponse.json(
        { error: "Ce numéro a déjà participé récemment (1 spin / 30 jours)" },
        { status: 429 },
      );
    }

    const { data: recentFingerprint } = await supabase
      .from("spins")
      .select("id")
      .eq("merchant_id", merchantId)
      .eq("device_fingerprint", fingerprint)
      .gte("created_at", cooldownDate.toISOString())
      .limit(1)
      .maybeSingle();

    if (recentFingerprint) {
      return NextResponse.json(
        { error: "Cet appareil a déjà participé récemment" },
        { status: 429 },
      );
    }

    const code = generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    await supabase.from("otp_verifications").insert({
      merchant_id: merchantId,
      phone_number: phoneNumber,
      code,
      expires_at: expiresAt.toISOString(),
    });

    await sendSms(phoneNumber, code);

    return NextResponse.json({ ok: true, devCode: process.env.NODE_ENV === "development" ? code : undefined });
  } catch (err) {
    console.error("OTP send error:", err);
    return NextResponse.json({ error: "Erreur envoi OTP" }, { status: 500 });
  }
}
