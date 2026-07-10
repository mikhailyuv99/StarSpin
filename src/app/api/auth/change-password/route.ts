import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidPassword } from "@/lib/auth-password";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };
    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";

    if (!currentPassword || !isValidPassword(newPassword)) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const hasEmailIdentity = user.identities?.some((identity) => identity.provider === "email");
    if (!hasEmailIdentity) {
      return NextResponse.json({ error: "oauth_only" }, { status: 400 });
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return NextResponse.json({ error: "wrong_password" }, { status: 400 });
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      console.error("[auth/change-password]", updateError.message);
      return NextResponse.json({ error: "update_failed" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/change-password]", err);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
