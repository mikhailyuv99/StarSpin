import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/app-url";
import { isValidPassword, normalizeAuthEmail } from "@/lib/auth-password";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = normalizeAuthEmail(body.email ?? "");

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();
    const redirectTo = `${getAppUrl()}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`;

    await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/forgot-password]", err);
    return NextResponse.json({ ok: true });
  }
}
