import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("already") || message.includes("registered")) {
        return NextResponse.json({ error: "email_taken" }, { status: 409 });
      }
      console.error("[auth/signup]", error.message);
      return NextResponse.json({ error: "signup_failed" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/signup]", err);
    return NextResponse.json({ error: "signup_failed" }, { status: 500 });
  }
}
