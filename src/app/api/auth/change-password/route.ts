import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isValidPassword } from "@/lib/auth-password";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

    const verifyClient = createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return NextResponse.json({ error: "wrong_password" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

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
