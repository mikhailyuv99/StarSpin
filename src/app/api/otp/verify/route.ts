import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/^0/, "+84");
}

export async function POST(request: Request) {
  try {
    const { merchantId, phone, code } = await request.json();
    if (!merchantId || !phone || !code) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const phoneNumber = normalizePhone(String(phone));
    const supabase = createAdminClient();

    const { data: otp } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("merchant_id", merchantId)
      .eq("phone_number", phoneNumber)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otp || otp.code !== String(code)) {
      return NextResponse.json({ error: "Code invalide ou expiré" }, { status: 400 });
    }

    await supabase
      .from("otp_verifications")
      .update({ verified: true })
      .eq("id", otp.id);

    return NextResponse.json({ ok: true, phoneNumber });
  } catch (err) {
    console.error("OTP verify error:", err);
    return NextResponse.json({ error: "Erreur vérification" }, { status: 500 });
  }
}
