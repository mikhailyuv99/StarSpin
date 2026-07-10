import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeAuthRedirectPath } from "@/lib/auth-password";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeAuthRedirectPath(searchParams.get("next"));
  const authError = searchParams.get("error");

  if (authError) {
    const redirectUrl = new URL("/login/forgot-password", origin);
    redirectUrl.searchParams.set("error", "link_expired");
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const redirectUrl = new URL("/login/forgot-password", origin);
      redirectUrl.searchParams.set("error", "link_expired");
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
